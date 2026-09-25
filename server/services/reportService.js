const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Escape special regex characters safely
 */
const escapeRegex = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * Fetch distinct party/company names across GatePass and MaterialInward
 */
const getDistinctParties = async () => {
  try {
    if (isDbConnected()) {
      const gpParties = await GatePass.distinct('companyName');
      const miParties = await MaterialInward.distinct('partyName');
      const set = new Set([...gpParties, ...miParties].filter(Boolean));
      return Array.from(set).sort();
    }
  } catch (err) {
    console.warn('Failed to fetch distinct parties from DB:', err.message);
  }
  return ['ABC Ltd', 'Maruti Nandan Fabrics', 'Universal Tech', 'Zenith Logistics'];
};

/**
 * Build Date Range Filter Query Safely
 */
const buildDateFilter = (fromDate, toDate, fieldName = 'date') => {
  const dateFilter = {};
  if (fromDate && typeof fromDate === 'string' && fromDate.trim()) {
    const start = new Date(fromDate.trim());
    if (!isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
  }
  if (toDate && typeof toDate === 'string' && toDate.trim()) {
    const end = new Date(toDate.trim());
    if (!isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
  }
  return Object.keys(dateFilter).length > 0 ? { [fieldName]: dateFilter } : {};
};

/**
 * 1. Gate Pass Register Report
 */
const getGatePassRegisterReport = async (params = {}) => {
  const {
    fromDate,
    toDate,
    gatePassStatus,
    returnStatus,
    materialType,
    party,
    gatePassNumber,
    item
  } = params;

  if (isDbConnected()) {
    const match = {};

    if (fromDate || toDate) {
      Object.assign(match, buildDateFilter(fromDate, toDate, 'date'));
    }
    if (gatePassStatus && gatePassStatus !== 'All') {
      match.gatePassStatus = gatePassStatus;
    }
    if (returnStatus && returnStatus !== 'All') {
      match.returnStatus = returnStatus;
    }
    if (materialType && materialType !== 'All') {
      match.passType = materialType === 'RETURNABLE' ? 'Returnable' : 'Non-Returnable';
    }
    if (party && party !== 'All') {
      match.companyName = party;
    }
    if (gatePassNumber && typeof gatePassNumber === 'string' && gatePassNumber.trim()) {
      const safeStr = escapeRegex(gatePassNumber);
      if (safeStr) match.gatePassNumber = { $regex: safeStr, $options: 'i' };
    }
    if (item && typeof item === 'string' && item.trim()) {
      const safeStr = escapeRegex(item);
      if (safeStr) match['items.description'] = { $regex: safeStr, $options: 'i' };
    }

    const records = await GatePass.find(match).sort({ date: -1, createdAt: -1 }).lean();

    const formattedRows = records.map(gp => {
      const items = gp.items || [];
      const totalQuantity = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
      const returnableQuantity = items.reduce((acc, it) => acc + (it.returnable !== false ? (Number(it.quantity) || 0) : 0), 0);
      const returnedQuantity = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);
      const balanceReturnableQuantity = Math.max(0, returnableQuantity - returnedQuantity);

      return {
        _id: gp._id,
        gatePassNumber: gp.gatePassNumber,
        date: gp.date || gp.createdAt,
        companyName: gp.companyName,
        purpose: gp.purpose || '-',
        materialType: gp.passType || 'Returnable',
        itemCount: items.length,
        totalQuantity,
        returnableQuantity,
        returnedQuantity,
        balanceReturnableQuantity,
        gatePassStatus: gp.gatePassStatus || 'OPEN',
        returnStatus: gp.returnStatus || 'PENDING',
        createdBy: gp.createdBy || 'Admin',
        createdAt: gp.createdAt,
        updatedAt: gp.updatedAt,
        remarks: items.map(i => i.remarks).filter(Boolean).join('; ') || '-'
      };
    });

    const kpis = {
      totalGatePasses: formattedRows.length,
      openCount: formattedRows.filter(r => r.gatePassStatus === 'OPEN').length,
      closedCount: formattedRows.filter(r => r.gatePassStatus === 'CLOSED').length,
      pendingReturnCount: formattedRows.filter(r => r.returnStatus === 'PENDING' || r.returnStatus === 'PARTIALLY_RETURNED').length,
      totalQuantity: formattedRows.reduce((acc, r) => acc + r.totalQuantity, 0)
    };

    return { records: formattedRows, kpis };
  }

  return { records: [], kpis: { totalGatePasses: 0, openCount: 0, closedCount: 0, pendingReturnCount: 0, totalQuantity: 0 } };
};

/**
 * 2. Material Inward Register Report
 */
const getMaterialInwardRegisterReport = async (params = {}) => {
  const {
    fromDate,
    toDate,
    party,
    gatePassNumber,
    materialInwardNumber,
    item
  } = params;

  if (isDbConnected()) {
    const match = {};

    if (fromDate || toDate) {
      Object.assign(match, buildDateFilter(fromDate, toDate, 'inwardDate'));
    }
    if (party && party !== 'All') {
      match.partyName = party;
    }
    if (gatePassNumber && typeof gatePassNumber === 'string' && gatePassNumber.trim()) {
      const safeStr = escapeRegex(gatePassNumber);
      if (safeStr) match.gatePassNumber = { $regex: safeStr, $options: 'i' };
    }
    if (materialInwardNumber && typeof materialInwardNumber === 'string' && materialInwardNumber.trim()) {
      const safeStr = escapeRegex(materialInwardNumber);
      if (safeStr) match.inwardNumber = { $regex: safeStr, $options: 'i' };
    }
    if (item && typeof item === 'string' && item.trim()) {
      const safeStr = escapeRegex(item);
      if (safeStr) match['items.description'] = { $regex: safeStr, $options: 'i' };
    }

    // Chronological ASC (oldest -> newest) for transaction narrative
    const records = await MaterialInward.find(match).sort({ inwardDate: 1, createdAt: 1 }).lean();

    const formattedRows = records.map(mi => {
      const items = mi.items || [];
      const totalRecQty = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);
      const avgRate = items.length > 0 ? (items.reduce((acc, it) => acc + (Number(it.rate) || 0), 0) / items.length) : 0;

      return {
        _id: mi._id,
        inwardNumber: mi.inwardNumber,
        inwardDate: mi.inwardDate || mi.createdAt,
        gatePassNumber: mi.gatePassNumber,
        gateEntryNumber: mi.gateEntryNumber,
        challanInvoiceNumber: mi.challanInvoiceNumber,
        partyName: mi.partyName,
        itemCount: items.length,
        receivedQuantity: totalRecQty,
        rate: avgRate,
        subtotal: mi.subtotal || 0,
        totalCgst: mi.totalCgst || 0,
        totalSgst: mi.totalSgst || 0,
        totalIgst: mi.totalIgst || 0,
        totalGst: mi.totalGst || 0,
        grandTotal: mi.grandTotal || 0,
        createdBy: mi.createdBy || 'Admin',
        createdAt: mi.createdAt,
        remarks: mi.remarks || '-'
      };
    });

    const kpis = {
      totalInwardReceipts: formattedRows.length,
      totalReceivedQuantity: formattedRows.reduce((acc, r) => acc + r.receivedQuantity, 0),
      subtotalTaxable: formattedRows.reduce((acc, r) => acc + r.subtotal, 0),
      totalGst: formattedRows.reduce((acc, r) => acc + r.totalGst, 0),
      grandTotal: formattedRows.reduce((acc, r) => acc + r.grandTotal, 0)
    };

    return { records: formattedRows, kpis };
  }

  return { records: [], kpis: { totalInwardReceipts: 0, totalReceivedQuantity: 0, subtotalTaxable: 0, totalGst: 0, grandTotal: 0 } };
};

/**
 * 3. Returnable Material Report
 */
const getReturnableMaterialReport = async (params = {}) => {
  const {
    fromDate,
    toDate,
    gatePassStatus,
    returnStatus,
    party,
    gatePassNumber,
    item
  } = params;

  if (isDbConnected()) {
    const match = { passType: 'Returnable' };

    if (fromDate || toDate) {
      Object.assign(match, buildDateFilter(fromDate, toDate, 'date'));
    }
    if (gatePassStatus && gatePassStatus !== 'All') {
      match.gatePassStatus = gatePassStatus;
    }
    if (returnStatus && returnStatus !== 'All') {
      match.returnStatus = returnStatus;
    }
    if (party && party !== 'All') {
      match.companyName = party;
    }
    if (gatePassNumber && typeof gatePassNumber === 'string' && gatePassNumber.trim()) {
      const safeStr = escapeRegex(gatePassNumber);
      if (safeStr) match.gatePassNumber = { $regex: safeStr, $options: 'i' };
    }
    if (item && typeof item === 'string' && item.trim()) {
      const safeStr = escapeRegex(item);
      if (safeStr) match['items.description'] = { $regex: safeStr, $options: 'i' };
    }

    const gatePasses = await GatePass.find(match).sort({ date: -1 }).lean();
    const gpIds = gatePasses.map(gp => gp._id);

    const inwards = gpIds.length > 0 
      ? await MaterialInward.find({ gatePassId: { $in: gpIds } }).lean()
      : [];

    const formattedRows = [];

    for (const gp of gatePasses) {
      const gpInwards = inwards.filter(mi => mi.gatePassId?.toString() === gp._id.toString());
      const lastInward = gpInwards.length > 0
        ? gpInwards.reduce((latest, curr) => (new Date(curr.inwardDate) > new Date(latest.inwardDate) ? curr : latest), gpInwards[0])
        : null;

      for (const itemRow of (gp.items || [])) {
        if (item && typeof item === 'string' && item.trim()) {
          if (!itemRow.description.toLowerCase().includes(item.trim().toLowerCase())) continue;
        }

        const origQty = Number(itemRow.quantity) || 0;
        const returnableQty = itemRow.returnable !== false ? origQty : 0;
        const returnedQty = Number(itemRow.receivedQuantity) || 0;
        const pendingQty = Math.max(0, returnableQty - returnedQty);

        formattedRows.push({
          gatePassId: gp._id,
          gatePassNumber: gp.gatePassNumber,
          date: gp.date || gp.createdAt,
          companyName: gp.companyName,
          itemName: itemRow.description,
          category: itemRow.category,
          originalQuantity: origQty,
          returnableQuantity: returnableQty,
          returnedQuantity: returnedQty,
          pendingQuantity: pendingQty,
          lastInwardDate: lastInward ? lastInward.inwardDate : null,
          gatePassStatus: gp.gatePassStatus || 'OPEN',
          returnStatus: gp.returnStatus || 'PENDING',
          remarks: itemRow.remarks || gp.purpose || '-'
        });
      }
    }

    const kpis = {
      totalReturnableItems: formattedRows.length,
      totalReturnableQuantity: formattedRows.reduce((acc, r) => acc + r.returnableQuantity, 0),
      totalReturnedQuantity: formattedRows.reduce((acc, r) => acc + r.returnedQuantity, 0),
      totalPendingQuantity: formattedRows.reduce((acc, r) => acc + r.pendingQuantity, 0)
    };

    return { records: formattedRows, kpis };
  }

  return { records: [], kpis: { totalReturnableItems: 0, totalReturnableQuantity: 0, totalReturnedQuantity: 0, totalPendingQuantity: 0 } };
};

/**
 * 4. Pending Return Report
 */
const getPendingReturnReport = async (params = {}) => {
  const result = await getReturnableMaterialReport(params);
  const now = new Date();

  const filtered = (result.records || [])
    .filter(r => r.pendingQuantity > 0)
    .map(r => {
      const gpDate = new Date(r.date);
      const diffTime = now.getTime() - gpDate.getTime();
      const daysPending = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      return { ...r, daysPending };
    })
    .sort((a, b) => b.daysPending - a.daysPending);

  const kpis = {
    totalPendingItems: filtered.length,
    totalPendingQuantity: filtered.reduce((acc, r) => acc + r.pendingQuantity, 0),
    avgDaysPending: filtered.length > 0 ? Math.round(filtered.reduce((acc, r) => acc + r.daysPending, 0) / filtered.length) : 0,
    maxDaysPending: filtered.length > 0 ? Math.max(...filtered.map(r => r.daysPending)) : 0
  };

  return { records: filtered, kpis };
};

/**
 * 5. Gate Pass Closure Report
 */
const getGatePassClosureReport = async (params = {}) => {
  const {
    fromDate,
    toDate,
    party,
    gatePassNumber,
    item
  } = params;

  if (isDbConnected()) {
    const match = {
      $or: [
        { returnStatus: 'FULLY_RETURNED' },
        { gatePassStatus: 'CLOSED' }
      ]
    };

    if (fromDate || toDate) {
      Object.assign(match, buildDateFilter(fromDate, toDate, 'date'));
    }
    if (party && party !== 'All') {
      match.companyName = party;
    }
    if (gatePassNumber && typeof gatePassNumber === 'string' && gatePassNumber.trim()) {
      const safeStr = escapeRegex(gatePassNumber);
      if (safeStr) match.gatePassNumber = { $regex: safeStr, $options: 'i' };
    }
    if (item && typeof item === 'string' && item.trim()) {
      const safeStr = escapeRegex(item);
      if (safeStr) match['items.description'] = { $regex: safeStr, $options: 'i' };
    }

    const gatePasses = await GatePass.find(match).sort({ date: -1 }).lean();
    const gpIds = gatePasses.map(gp => gp._id);
    const inwards = gpIds.length > 0 
      ? await MaterialInward.find({ gatePassId: { $in: gpIds } }).sort({ inwardDate: -1 }).lean()
      : [];

    const formattedRows = gatePasses.map(gp => {
      const items = gp.items || [];
      const origReturnableQty = items.reduce((acc, it) => acc + (it.returnable !== false ? Number(it.quantity) || 0 : 0), 0);
      const totalReturnedQty = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);

      const gpInwards = inwards.filter(mi => mi.gatePassId?.toString() === gp._id.toString());
      const finalInward = gpInwards.length > 0 ? gpInwards[0] : null;

      const closureDate = finalInward ? (finalInward.inwardDate || finalInward.createdAt) : gp.updatedAt;
      const gpDate = new Date(gp.date || gp.createdAt);
      const closeDate = new Date(closureDate);
      const totalDaysToClose = Math.max(0, Math.floor((closeDate.getTime() - gpDate.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        gatePassId: gp._id,
        gatePassNumber: gp.gatePassNumber,
        date: gp.date || gp.createdAt,
        companyName: gp.companyName,
        originalReturnableQuantity: origReturnableQty,
        totalReturnedQuantity: totalReturnedQty,
        finalInwardNumber: finalInward ? finalInward.inwardNumber : '-',
        finalInwardDate: finalInward ? finalInward.inwardDate : null,
        closureDate,
        totalDaysToClose,
        gatePassStatus: gp.gatePassStatus || 'CLOSED',
        returnStatus: gp.returnStatus || 'FULLY_RETURNED'
      };
    });

    const kpis = {
      totalClosedPasses: formattedRows.length,
      totalReturnedQuantity: formattedRows.reduce((acc, r) => acc + r.totalReturnedQuantity, 0),
      avgDaysToClose: formattedRows.length > 0 ? Math.round(formattedRows.reduce((acc, r) => acc + r.totalDaysToClose, 0) / formattedRows.length) : 0
    };

    return { records: formattedRows, kpis };
  }

  return { records: [], kpis: { totalClosedPasses: 0, totalReturnedQuantity: 0, avgDaysToClose: 0 } };
};

/**
 * 6. Party-wise Summary Report
 */
const getPartySummaryReport = async (params = {}) => {
  const { fromDate, toDate, party } = params;

  if (isDbConnected()) {
    const gpMatch = {};
    if (fromDate || toDate) {
      Object.assign(gpMatch, buildDateFilter(fromDate, toDate, 'date'));
    }
    if (party && party !== 'All') {
      gpMatch.companyName = party;
    }

    const gatePasses = await GatePass.find(gpMatch).lean();
    const inwards = await MaterialInward.find({}).lean();

    const partyMap = {};

    for (const gp of gatePasses) {
      const name = gp.companyName || 'Unknown Party';
      if (!partyMap[name]) {
        partyMap[name] = {
          partyName: name,
          totalGatePasses: 0,
          openGatePasses: 0,
          closedGatePasses: 0,
          totalReturnableQuantity: 0,
          totalReturnedQuantity: 0,
          totalPendingQuantity: 0,
          oldestPendingDate: null,
          totalGrandTotal: 0
        };
      }

      const p = partyMap[name];
      p.totalGatePasses += 1;
      if (gp.gatePassStatus === 'CLOSED' || gp.returnStatus === 'FULLY_RETURNED') {
        p.closedGatePasses += 1;
      } else {
        p.openGatePasses += 1;
      }

      const items = gp.items || [];
      const retQty = items.reduce((acc, it) => acc + (it.returnable !== false ? Number(it.quantity) || 0 : 0), 0);
      const recQty = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);
      const pendQty = Math.max(0, retQty - recQty);

      p.totalReturnableQuantity += retQty;
      p.totalReturnedQuantity += recQty;
      p.totalPendingQuantity += pendQty;

      if (pendQty > 0) {
        const gpDate = new Date(gp.date || gp.createdAt);
        if (!p.oldestPendingDate || gpDate < new Date(p.oldestPendingDate)) {
          p.oldestPendingDate = gpDate;
        }
      }
    }

    // Add Inward Grand Totals
    for (const mi of inwards) {
      const name = mi.partyName;
      if (partyMap[name]) {
        partyMap[name].totalGrandTotal += Number(mi.grandTotal) || 0;
      }
    }

    const formattedRows = Object.values(partyMap).sort((a, b) => b.totalPendingQuantity - a.totalPendingQuantity);

    const kpis = {
      totalParties: formattedRows.length,
      totalOpenPasses: formattedRows.reduce((acc, r) => acc + r.openGatePasses, 0),
      totalPendingQuantity: formattedRows.reduce((acc, r) => acc + r.totalPendingQuantity, 0),
      totalGrandTotal: formattedRows.reduce((acc, r) => acc + r.totalGrandTotal, 0)
    };

    return { records: formattedRows, kpis };
  }

  return { records: [], kpis: { totalParties: 0, totalOpenPasses: 0, totalPendingQuantity: 0, totalGrandTotal: 0 } };
};

/**
 * 7. Combined Gate Pass & Return Report
 */
const getCombinedReport = async (params = {}) => {
  const {
    fromDate,
    toDate,
    gatePassStatus,
    returnStatus,
    party,
    gatePassNumber,
    materialInwardNumber,
    item
  } = params;

  if (isDbConnected()) {
    const match = {};

    if (fromDate || toDate) {
      Object.assign(match, buildDateFilter(fromDate, toDate, 'date'));
    }
    if (gatePassStatus && gatePassStatus !== 'All') {
      match.gatePassStatus = gatePassStatus;
    }
    if (returnStatus && returnStatus !== 'All') {
      match.returnStatus = returnStatus;
    }
    if (party && party !== 'All') {
      match.companyName = party;
    }
    if (gatePassNumber && typeof gatePassNumber === 'string' && gatePassNumber.trim()) {
      const safeStr = escapeRegex(gatePassNumber);
      if (safeStr) match.gatePassNumber = { $regex: safeStr, $options: 'i' };
    }
    if (item && typeof item === 'string' && item.trim()) {
      const safeStr = escapeRegex(item);
      if (safeStr) match['items.description'] = { $regex: safeStr, $options: 'i' };
    }

    // Chronological ASC (oldest -> newest) for transaction narrative
    const gatePasses = await GatePass.find(match).sort({ date: 1, createdAt: 1 }).lean();
    const gpIds = gatePasses.map(gp => gp._id);

    const miMatch = { gatePassId: { $in: gpIds } };
    if (materialInwardNumber && typeof materialInwardNumber === 'string' && materialInwardNumber.trim()) {
      const safeStr = escapeRegex(materialInwardNumber);
      if (safeStr) miMatch.inwardNumber = { $regex: safeStr, $options: 'i' };
    }

    const inwards = gpIds.length > 0 
      ? await MaterialInward.find(miMatch).sort({ inwardDate: 1, createdAt: 1 }).lean()
      : [];

    const formattedRows = [];

    for (const gp of gatePasses) {
      const gpInwards = inwards.filter(mi => mi.gatePassId?.toString() === gp._id.toString());

      for (const gpItem of (gp.items || [])) {
        if (item && typeof item === 'string' && item.trim()) {
          if (!gpItem.description.toLowerCase().includes(item.trim().toLowerCase())) continue;
        }

        const origQty = Number(gpItem.quantity) || 0;
        const retQty = gpItem.returnable !== false ? origQty : 0;

        if (gpInwards.length === 0) {
          // Gate Pass with 0 inward transactions yet
          formattedRows.push({
            gatePassNumber: gp.gatePassNumber,
            date: gp.date || gp.createdAt,
            partyName: gp.companyName,
            itemDescription: gpItem.description,
            originalQuantity: origQty,
            returnableQuantity: retQty,
            inwardNumber: '-',
            inwardDate: null,
            receivedQuantity: 0,
            balanceQuantity: retQty,
            returnStatus: gp.returnStatus || 'PENDING'
          });
        } else {
          // Sequential narrative per inward transaction
          let runningReceived = 0;

          for (const inv of gpInwards) {
            const matchedInwardItem = (inv.items || []).find(it => it.gatePassItemId?.toString() === gpItem._id?.toString() || it.serialNumber === gpItem.serialNumber);
            const thisRecQty = matchedInwardItem ? (Number(matchedInwardItem.receivedQuantity) || 0) : 0;
            runningReceived += thisRecQty;
            const balanceQty = Math.max(0, retQty - runningReceived);

            const thisStatus = balanceQty === 0 
              ? 'FULLY_RETURNED' 
              : (runningReceived > 0 ? 'PARTIALLY_RETURNED' : 'PENDING');

            formattedRows.push({
              gatePassNumber: gp.gatePassNumber,
              date: gp.date || gp.createdAt,
              partyName: gp.companyName,
              itemDescription: gpItem.description,
              originalQuantity: origQty,
              returnableQuantity: retQty,
              inwardNumber: inv.inwardNumber,
              inwardDate: inv.inwardDate || inv.createdAt,
              receivedQuantity: thisRecQty,
              balanceQuantity: balanceQty,
              returnStatus: thisStatus
            });
          }
        }
      }
    }

    const kpis = {
      totalRows: formattedRows.length,
      totalGatePasses: new Set(formattedRows.map(r => r.gatePassNumber)).size,
      totalReceivedQuantity: formattedRows.reduce((acc, r) => acc + r.receivedQuantity, 0),
      totalBalanceQuantity: formattedRows.reduce((acc, r) => acc + r.balanceQuantity, 0)
    };

    return { records: formattedRows, kpis };
  }

  return { records: [], kpis: { totalRows: 0, totalGatePasses: 0, totalReceivedQuantity: 0, totalBalanceQuantity: 0 } };
};

module.exports = {
  getDistinctParties,
  getGatePassRegisterReport,
  getMaterialInwardRegisterReport,
  getReturnableMaterialReport,
  getPendingReturnReport,
  getGatePassClosureReport,
  getPartySummaryReport,
  getCombinedReport
};
