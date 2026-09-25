const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const GatePassAudit = require('../models/GatePassAudit');
const { calculateGatePassReturnStatus, calculateItemReturnStatus } = require('../utils/returnCalculator');
const { calculateLineItemGST, calculateDocumentTotals } = require('../utils/gstCalculator');

// Mock data store for offline/demo fallback mode
let mockInwards = [];
let mockInwardCounter = 0;

const isDbConnected = () => mongoose.connection.readyState === 1;

const combineDateWithCurrentTime = (dateInput) => {
  const now = new Date();
  if (!dateInput) return now;
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date();
      d.setFullYear(parts[0], parts[1] - 1, parts[2]);
      return d;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return now;
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return d;
};

const generateInwardNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `MI-${year}-`;

  if (isDbConnected()) {
    const lastInward = await MaterialInward.findOne({ inwardNumber: new RegExp(`^${prefix}`) })
      .sort({ createdAt: -1 })
      .exec();

    if (lastInward) {
      const lastNum = parseInt(lastInward.inwardNumber.split('-')[2], 10);
      return `${prefix}${(lastNum + 1).toString().padStart(4, '0')}`;
    }
    return `${prefix}0001`;
  } else {
    mockInwardCounter++;
    return `${prefix}${mockInwardCounter.toString().padStart(4, '0')}`;
  }
};

const fetchGatePassForInward = async (gatePassNumber) => {
  let gatePass = null;

  if (isDbConnected()) {
    const trimmed = gatePassNumber.trim();
    gatePass = await GatePass.findOne({
      $or: [
        { gatePassNumber: trimmed },
        { gatePassNumber: { $regex: new RegExp(`^${trimmed}$`, 'i') } }
      ]
    });
  } else {
    const gatePassService = require('./gatePassService');
    const passes = await gatePassService.getGatePasses();
    gatePass = passes.find(gp => gp.gatePassNumber.toLowerCase() === gatePassNumber.trim().toLowerCase());
  }

  if (!gatePass) {
    throw new Error(`Gate Pass "${gatePassNumber}" not found.`);
  }

  if (gatePass.status === 'cancelled' || gatePass.gatePassStatus === 'CANCELLED') {
    throw new Error(`Gate Pass ${gatePass.gatePassNumber} has been cancelled.`);
  }

  // Filter returnable items (if passType is Returnable, treat all items as returnable unless explicitly returnable: false)
  const isReturnablePass = (gatePass.passType || gatePass.gatePassType || 'Returnable') === 'Returnable';
  const rawItems = gatePass.items || [];
  
  const returnableItems = rawItems
    .filter(item => item.returnable !== false || isReturnablePass)
    .map(item => {
      const origQty = Number(item.quantity) || 0;
      const prevRec = Number(item.receivedQuantity) || 0;
      const pending = Math.max(0, origQty - prevRec);
      return {
        _id: item._id,
        serialNumber: item.serialNumber,
        description: item.description,
        category: item.category,
        uom: item.uom || item.unit || 'Nos',
        originalQuantity: origQty,
        previouslyReceivedQuantity: prevRec,
        pendingQuantity: pending,
        returnable: true,
        itemReturnStatus: item.itemReturnStatus || calculateItemReturnStatus(origQty, prevRec)
      };
    });

  if (returnableItems.length === 0) {
    throw new Error(`Gate Pass ${gatePass.gatePassNumber} does not contain any returnable material items.`);
  }

  const isClosed = gatePass.gatePassStatus === 'CLOSED' || gatePass.returnStatus === 'FULLY_RETURNED';

  return {
    gatePass: {
      _id: gatePass._id,
      gatePassNumber: gatePass.gatePassNumber,
      date: gatePass.date,
      companyName: gatePass.companyName,
      passType: gatePass.passType,
      gatePassType: gatePass.gatePassType || gatePass.passType,
      purpose: gatePass.purpose || '',
      vehicleNumber: gatePass.vehicleNumber || '',
      driverName: gatePass.driverName || '',
      department: gatePass.department || '',
      status: gatePass.status,
      gatePassStatus: gatePass.gatePassStatus || (isClosed ? 'CLOSED' : 'OPEN'),
      returnStatus: gatePass.returnStatus || (isClosed ? 'FULLY_RETURNED' : 'PENDING'),
    },
    returnableItems,
    isClosed
  };
};

const createMaterialInward = async (data) => {
  const {
    gatePassId,
    gateEntryNumber,
    inwardDate,
    documentType,
    challanInvoiceNumber,
    items: inputItems = [],
    remarks = ''
  } = data;

  if (!gatePassId) throw new Error('Gate Pass ID is required.');
  if (!gateEntryNumber) throw new Error('Gate Entry No. is required.');
  if (!inwardDate) throw new Error('Inward Date is required.');
  if (!challanInvoiceNumber) throw new Error('Challan/Invoice No. is required.');
  if (!inputItems || inputItems.length === 0) throw new Error('Please enter at least one received quantity.');

  let gatePass = null;
  if (isDbConnected()) {
    gatePass = await GatePass.findById(gatePassId);
  } else {
    const gatePassService = require('./gatePassService');
    gatePass = await gatePassService.getGatePassById(gatePassId);
  }

  if (!gatePass) throw new Error('Gate Pass not found.');
  if (gatePass.status === 'cancelled' || gatePass.gatePassStatus === 'CANCELLED') {
    throw new Error('Gate Pass is cancelled.');
  }
  if (gatePass.gatePassStatus === 'CLOSED' || gatePass.returnStatus === 'FULLY_RETURNED') {
    throw new Error('Gate Pass is already closed.');
  }

  const inwardNumber = await generateInwardNumber();
  const finalInwardDate = combineDateWithCurrentTime(inwardDate);
  const processedInwardItems = [];
  let atLeastOneValidItem = false;

  for (const inputItem of inputItems) {
    const receiveQty = Number(inputItem.receivedQuantity) || 0;
    if (receiveQty <= 0) continue; // Skip zero-quantity rows

    // Locate corresponding Gate Pass item
    const gpItem = (gatePass.items || []).find(it => it._id?.toString() === inputItem.gatePassItemId?.toString() || it.serialNumber === inputItem.serialNumber);
    if (!gpItem) continue;

    const origQty = Number(gpItem.quantity) || 0;
    const prevReceived = Number(gpItem.receivedQuantity) || 0;
    const pendingBefore = Math.max(0, origQty - prevReceived);

    if (receiveQty > pendingBefore) {
      throw new Error(`Receive quantity (${receiveQty}) cannot exceed the pending quantity (${pendingBefore}) for item "${gpItem.description}".`);
    }

    atLeastOneValidItem = true;

    const catStr = String(gpItem.category || inputItem.category || '');
    const isOnCost = catStr.includes('On Cost Repair') || catStr.includes('OCR');
    const effectiveRate = isOnCost ? (Number(inputItem.rate) || 0) : 0;

    // Calculate GST & Amounts
    const gstCalc = calculateLineItemGST({
      receivedQuantity: receiveQty,
      rate: effectiveRate,
      gstType: inputItem.gstType || 'CGST_SGST',
      gstPercentage: inputItem.gstPercentage || 18
    });

    processedInwardItems.push({
      gatePassItemId: gpItem._id,
      serialNumber: gpItem.serialNumber,
      description: gpItem.description,
      originalQuantity: origQty,
      previouslyReceivedQuantity: prevReceived,
      pendingQuantityBefore: pendingBefore,
      receivedQuantity: receiveQty,
      unit: gpItem.uom || inputItem.unit || 'Nos',
      rate: effectiveRate,
      taxableAmount: gstCalc.taxableAmount,
      gstType: gstCalc.gstType,
      gstPercentage: gstCalc.gstPercentage,
      cgstPercentage: gstCalc.cgstPercentage,
      sgstPercentage: gstCalc.sgstPercentage,
      igstPercentage: gstCalc.igstPercentage,
      cgstAmount: gstCalc.cgstAmount,
      sgstAmount: gstCalc.sgstAmount,
      igstAmount: gstCalc.igstAmount,
      gstAmount: gstCalc.gstAmount,
      totalAmount: gstCalc.totalAmount,
      inwardDate: finalInwardDate,
      inwardNumber,
      challanInvoiceNumber,
      gateEntryNumber,
      remarks: inputItem.remarks || ''
    });

    // Update running receivedQuantity on Gate Pass item
    gpItem.receivedQuantity = prevReceived + receiveQty;
    gpItem.itemReturnStatus = calculateItemReturnStatus(origQty, gpItem.receivedQuantity);
  }

  if (!atLeastOneValidItem || processedInwardItems.length === 0) {
    throw new Error('Please enter at least one received quantity greater than 0.');
  }

  // Calculate Document Totals
  const docTotals = calculateDocumentTotals(processedInwardItems);

  // Recalculate Gate Pass return status
  const statusDerivation = calculateGatePassReturnStatus(gatePass.items);
  gatePass.returnStatus = statusDerivation.returnStatus;
  gatePass.gatePassStatus = statusDerivation.gatePassStatus;
  if (statusDerivation.gatePassStatus === 'CLOSED') {
    gatePass.status = 'closed';
  }

  const inwardPayload = {
    inwardNumber,
    gatePassId: gatePass._id,
    gatePassNumber: gatePass.gatePassNumber,
    gateEntryNumber,
    inwardDate: finalInwardDate,
    documentType: documentType || 'Challan',
    challanInvoiceNumber,
    partyName: gatePass.companyName,
    items: processedInwardItems,
    subtotal: docTotals.subtotal,
    totalCgst: docTotals.totalCgst,
    totalSgst: docTotals.totalSgst,
    totalIgst: docTotals.totalIgst,
    totalGst: docTotals.totalGst,
    grandTotal: docTotals.grandTotal,
    remarks,
    createdBy: 'Admin'
  };

  let savedInward = null;

  if (isDbConnected()) {
    const newInward = new MaterialInward(inwardPayload);
    savedInward = await newInward.save();

    await gatePass.save();

    // Log Audit
    const audit = new GatePassAudit({
      gatePassId: gatePass._id,
      inwardId: savedInward._id,
      performedBy: 'Admin',
      action: statusDerivation.gatePassStatus === 'CLOSED' ? 'GATE_PASS_CLOSED_BY_INWARD' : 'MATERIAL_INWARD_CREATED',
      metadata: {
        inwardNumber,
        returnStatus: gatePass.returnStatus,
        gatePassStatus: gatePass.gatePassStatus,
        grandTotal: docTotals.grandTotal
      }
    });
    await audit.save();
  } else {
    savedInward = {
      ...inwardPayload,
      _id: `mock-inward-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockInwards.push(savedInward);
  }

  return {
    materialInward: savedInward,
    gatePass: {
      _id: gatePass._id,
      gatePassNumber: gatePass.gatePassNumber,
      returnStatus: gatePass.returnStatus,
      gatePassStatus: gatePass.gatePassStatus,
    },
    returnStatus: gatePass.returnStatus,
    gatePassStatus: gatePass.gatePassStatus,
    message: gatePass.gatePassStatus === 'CLOSED' 
      ? 'Material inward saved successfully. All returnable material received. Gate Pass closed.'
      : 'Material inward saved successfully. Gate Pass is partially returned.'
  };
};

const getMaterialInwardById = async (id) => {
  if (!id) return null;
  if (id.startsWith('consolidated-')) {
    const gpNum = id.replace('consolidated-', '');
    return await getConsolidatedInwardByGatePass(gpNum);
  }
  if (isDbConnected()) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const found = await MaterialInward.findById(id);
      if (found) return found;
    }
    const foundByNum = await MaterialInward.findOne({ inwardNumber: id.trim() });
    if (foundByNum) return foundByNum;
  }
  return mockInwards.find(mi => mi._id === id || mi.inwardNumber === id);
};

const getInwardHistory = async (gatePassNumber) => {
  if (isDbConnected()) {
    return await MaterialInward.find({ gatePassNumber: gatePassNumber.trim() }).sort({ createdAt: -1 });
  } else {
    return mockInwards
      .filter(mi => mi.gatePassNumber.toLowerCase() === gatePassNumber.trim().toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
  }
};

const getConsolidatedInwardByGatePass = async (gatePassIdentifier) => {
  let gatePass = null;
  const gatePassService = require('./gatePassService');
  gatePass = await gatePassService.getGatePassById(gatePassIdentifier);

  const gatePassNum = gatePass ? gatePass.gatePassNumber : gatePassIdentifier;
  const history = await getInwardHistory(gatePassNum);

  if (!history || history.length === 0) {
    if (gatePass) {
      return {
        _id: `consolidated-${gatePass.gatePassNumber}`,
        inwardNumber: `MI-CONSOLIDATED-${gatePass.gatePassNumber}`,
        gatePassId: gatePass._id,
        gatePassNumber: gatePass.gatePassNumber,
        gateEntryNumber: 'CONSOLIDATED',
        inwardDate: gatePass.date || new Date(),
        documentType: 'Consolidated Receipt',
        challanInvoiceNumber: 'No Inwards Yet',
        partyName: gatePass.companyName || gatePass.partyName,
        items: [],
        subtotal: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalGst: 0,
        grandTotal: 0,
        remarks: 'No material inward records logged yet.',
        createdBy: 'Admin',
        isConsolidated: true,
        inwardCount: 0,
        gatePassStatus: gatePass.gatePassStatus || gatePass.status,
        returnStatus: gatePass.returnStatus
      };
    }
    throw new Error(`No material inward records found for Gate Pass ${gatePassIdentifier}.`);
  }

  // Flatten all items across all inward history records
  const allItems = [];
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;
  let grandTotal = 0;
  const remarksList = [];

  let srNo = 1;
  const sortedHistory = [...history].sort((a, b) => new Date(a.inwardDate || a.createdAt) - new Date(b.inwardDate || b.createdAt));

  for (const inv of sortedHistory) {
    if (inv.remarks) remarksList.push(`${inv.inwardNumber}: ${inv.remarks}`);
    for (const item of (inv.items || [])) {
      const itemTaxable = Number(item.taxableAmount) || (Number(item.receivedQuantity || 0) * Number(item.rate || 0));
      const itemGst = Number(item.gstAmount) || 0;
      const itemTotal = Number(item.totalAmount) || (itemTaxable + itemGst);

      allItems.push({
        ...(item.toObject ? item.toObject() : item),
        serialNumber: srNo++,
        inwardDate: item.inwardDate || inv.inwardDate || inv.createdAt,
        inwardNumber: item.inwardNumber || inv.inwardNumber,
        challanInvoiceNumber: item.challanInvoiceNumber || inv.challanInvoiceNumber,
        gateEntryNumber: item.gateEntryNumber || inv.gateEntryNumber,
        taxableAmount: itemTaxable,
        gstAmount: itemGst,
        totalAmount: itemTotal
      });
    }
    subtotal += Number(inv.subtotal || 0);
    totalCgst += Number(inv.totalCgst || 0);
    totalSgst += Number(inv.totalSgst || 0);
    totalIgst += Number(inv.totalIgst || 0);
    totalGst += Number(inv.totalGst || 0);
    grandTotal += Number(inv.grandTotal || 0);
  }

  const latestInward = sortedHistory[sortedHistory.length - 1];

  return {
    _id: `consolidated-${gatePassNum}`,
    inwardNumber: `MI-CONSOLIDATED-${gatePassNum}`,
    gatePassId: gatePass ? gatePass._id : latestInward.gatePassId,
    gatePassNumber: gatePassNum,
    gateEntryNumber: latestInward.gateEntryNumber || 'CONSOLIDATED',
    inwardDate: latestInward.inwardDate || latestInward.createdAt,
    documentType: 'Consolidated Receipt',
    challanInvoiceNumber: `CONSOLIDATED (${sortedHistory.length} Inward Vouchers)`,
    partyName: (gatePass ? gatePass.companyName || gatePass.partyName : null) || latestInward.partyName,
    items: allItems,
    subtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst,
    grandTotal,
    remarks: remarksList.join(' | ') || 'Consolidated Material Inward Receipt across all returns.',
    createdBy: latestInward.createdBy || 'Admin',
    isConsolidated: true,
    inwardCount: sortedHistory.length,
    gatePassStatus: gatePass ? (gatePass.gatePassStatus || gatePass.status) : 'CLOSED',
    returnStatus: gatePass ? gatePass.returnStatus : 'FULLY_RETURNED'
  };
};

module.exports = {
  fetchGatePassForInward,
  createMaterialInward,
  getMaterialInwardById,
  getInwardHistory,
  getConsolidatedInwardByGatePass
};
