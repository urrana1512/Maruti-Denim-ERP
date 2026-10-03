import api from './api';
import ExcelJS from 'exceljs';
import { safeFormatDate } from '../utils/dateUtils';

/**
 * Client-side fallback helpers in case backend server instance is not yet restarted
 */
const safeDateFilter = (items, fromDate, toDate, dateField = 'date') => {
  if (!items || !Array.isArray(items)) return [];
  return items.filter(item => {
    const d = new Date(item[dateField] || item.createdAt);
    if (isNaN(d.getTime())) return true;
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });
};

const filterCommon = (items, params) => {
  let result = [...items];
  const { gatePassStatus, returnStatus, materialType, party, gatePassNumber, materialInwardNumber, item } = params;

  if (gatePassStatus && gatePassStatus !== 'All') {
    result = result.filter(r => (r.gatePassStatus || 'OPEN') === gatePassStatus);
  }
  if (returnStatus && returnStatus !== 'All') {
    result = result.filter(r => (r.returnStatus || 'PENDING') === returnStatus);
  }
  if (materialType && materialType !== 'All') {
    const target = materialType === 'RETURNABLE' ? 'Returnable' : 'Non-Returnable';
    result = result.filter(r => (r.passType || 'Returnable') === target);
  }
  if (party && party !== 'All') {
    result = result.filter(r => (r.companyName || r.partyName) === party);
  }
  if (gatePassNumber && gatePassNumber.trim()) {
    const q = gatePassNumber.trim().toLowerCase();
    result = result.filter(r => (r.gatePassNumber || '').toLowerCase().includes(q));
  }
  if (materialInwardNumber && materialInwardNumber.trim()) {
    const q = materialInwardNumber.trim().toLowerCase();
    result = result.filter(r => (r.inwardNumber || '').toLowerCase().includes(q));
  }
  if (item && item.trim()) {
    const q = item.trim().toLowerCase();
    result = result.filter(r => {
      if (r.items && Array.isArray(r.items)) {
        return r.items.some(it => (it.description || '').toLowerCase().includes(q));
      }
      return (r.itemName || r.itemDescription || '').toLowerCase().includes(q);
    });
  }
  return result;
};

const paginate = (records, page = 1, pageSize = 25) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 25);
  const startIndex = (p - 1) * ps;
  const items = records.slice(startIndex, startIndex + ps);

  return {
    items,
    pagination: {
      totalItems: records.length,
      currentPage: p,
      pageSize: ps,
      totalPages: Math.ceil(records.length / ps) || 1
    }
  };
};
const buildInwardRateMapClient = (inwards = []) => {
  const rateMap = {};
  for (const mi of inwards) {
    for (const it of (mi.items || [])) {
      const rateVal = Number(it.rate) || 0;
      if (rateVal > 0) {
        if (it.gatePassItemId) rateMap[it.gatePassItemId.toString()] = rateVal;
        if (it.description) {
          const descKey = it.description.toLowerCase().trim();
          if (!rateMap[descKey]) rateMap[descKey] = rateVal;
        }
      }
    }
  }
  return rateMap;
};

const resolveItemRateClient = (itemRow, rateMap = {}) => {
  if (itemRow && Number(itemRow.rate) > 0) {
    return Number(itemRow.rate);
  }
  const idKey = itemRow && itemRow._id ? itemRow._id.toString() : '';
  if (idKey && rateMap[idKey]) {
    return rateMap[idKey];
  }
  const descKey = itemRow && itemRow.description ? itemRow.description.toLowerCase().trim() : '';
  if (descKey && rateMap[descKey]) {
    return rateMap[descKey];
  }
  return 0;
};

/**
 * Client-side Fallback Processor
 */
const fallbackReport = async (reportType, params) => {
  const gpRes = await api.get('/gate-passes').catch(() => ({ data: { data: [] } }));
  const miRes = await api.get('/material-inward').catch(() => ({ data: { data: [] } }));

  const rawGps = gpRes.data?.data || gpRes.data || [];
  const rawMis = miRes.data?.data || miRes.data || [];

  switch (reportType) {
    case 'gate-pass': {
      let filtered = safeDateFilter(rawGps, params.fromDate, params.toDate, 'date');
      filtered = filterCommon(filtered, params);
      filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

      const records = filtered.map(gp => {
        const items = gp.items || [];
        const totalQuantity = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
        const returnableQuantity = items.reduce((acc, it) => acc + (it.returnable !== false ? (Number(it.quantity) || 0) : 0), 0);
        const returnedQuantity = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);
        const balanceReturnableQuantity = Math.max(0, returnableQuantity - returnedQuantity);

        const taxableAmount = items.reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.rate) || 0)), 0);
        const avgRate = totalQuantity > 0 && taxableAmount > 0 ? (taxableAmount / totalQuantity) : 0;
        const gstPercentage = taxableAmount > 0 ? 18 : 0;
        const gstAmount = taxableAmount > 0 ? Math.round(taxableAmount * (gstPercentage / 100) * 100) / 100 : 0;
        const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

        const createdByStr = gp.createdBy
          ? (gp.createdByDesignation ? `${gp.createdBy} (${gp.createdByDesignation})` : gp.createdBy)
          : 'System Staff';

        return {
          _id: gp._id,
          gatePassNumber: gp.gatePassNumber,
          date: gp.date || gp.createdAt,
          companyName: gp.companyName,
          vendorAddress: gp.vendorAddress || 'Not specified',
          vendorGstin: gp.vendorGstin || '-',
          department: gp.department || 'GENERAL',
          vehicleNumber: gp.vehicleNumber || '-',
          driverName: gp.driverName || '-',
          purpose: gp.purpose || '-',
          materialType: gp.passType || 'Returnable',
          itemCount: items.length,
          items: items.map(it => ({
            description: it.description || it.itemDescription || 'Material Item',
            category: it.category || 'OCR',
            quantity: Number(it.quantity) || 0,
            receivedQuantity: Number(it.receivedQuantity) || Number(it.returnedQuantity) || 0,
            returnedQuantity: Number(it.receivedQuantity) || Number(it.returnedQuantity) || 0,
            balanceQuantity: Math.max(0, (Number(it.quantity) || 0) - (Number(it.receivedQuantity) || Number(it.returnedQuantity) || 0)),
            unit: it.unit || it.uom || 'Nos',
            costCentre: it.costCentre || '-',
            returnable: it.returnable !== false,
            remarks: it.remarks || '-'
          })),
          totalQuantity,
          returnableQuantity,
          returnedQuantity,
          balanceReturnableQuantity,
          rate: Math.round(avgRate * 100) / 100,
          taxableAmount: Math.round(taxableAmount * 100) / 100,
          gstPercentage,
          gstAmount,
          totalGst: gstAmount,
          grandTotal,
          approvalStatus: gp.approvalStatus || (gp.gatePassStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'),
          gatePassStatus: gp.gatePassStatus || 'OPEN',
          returnStatus: gp.returnStatus || 'PENDING',
          createdBy: createdByStr,
          createdByDesignation: gp.createdByDesignation || '',
          createdAt: gp.createdAt,
          remarks: items.map(i => i.remarks).filter(Boolean).join('; ') || '-'
        };
      });

      const paginated = paginate(records, params.page, params.pageSize);
      const kpis = {
        totalGatePasses: records.length,
        openCount: records.filter(r => r.gatePassStatus === 'OPEN').length,
        closedCount: records.filter(r => r.gatePassStatus === 'CLOSED').length,
        pendingReturnCount: records.filter(r => r.returnStatus === 'PENDING' || r.returnStatus === 'PARTIALLY_RETURNED').length,
        totalQuantity: records.reduce((acc, r) => acc + r.totalQuantity, 0),
        totalTaxableAmount: records.reduce((acc, r) => acc + r.taxableAmount, 0),
        totalGst: records.reduce((acc, r) => acc + r.gstAmount, 0),
        grandTotal: records.reduce((acc, r) => acc + r.grandTotal, 0)
      };
      return { success: true, data: paginated.items, pagination: paginated.pagination, kpis };
    }

    case 'material-inward': {
      let filtered = safeDateFilter(rawMis, params.fromDate, params.toDate, 'inwardDate');
      filtered = filterCommon(filtered, params);
      filtered.sort((a, b) => new Date(a.inwardDate || a.createdAt) - new Date(b.inwardDate || b.createdAt));

      const records = filtered.map(mi => {
        const items = mi.items || [];
        const totalRecQty = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);
        const avgRate = items.length > 0 ? (items.reduce((acc, it) => acc + (Number(it.rate) || 0), 0) / items.length) : 0;
        const subtotal = mi.subtotal || items.reduce((acc, it) => acc + (Number(it.taxableAmount) || 0), 0);
        const totalGst = mi.totalGst || items.reduce((acc, it) => acc + (Number(it.gstAmount) || 0), 0);
        const grandTotal = mi.grandTotal || (subtotal + totalGst);
        const gstPercentage = subtotal > 0 ? Math.round((totalGst / subtotal) * 100) : 18;

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
          rate: Math.round(avgRate * 100) / 100,
          subtotal: Math.round(subtotal * 100) / 100,
          taxableAmount: Math.round(subtotal * 100) / 100,
          gstPercentage,
          totalCgst: mi.totalCgst || 0,
          totalSgst: mi.totalSgst || 0,
          totalIgst: mi.totalIgst || 0,
          totalGst: Math.round(totalGst * 100) / 100,
          gstAmount: Math.round(totalGst * 100) / 100,
          grandTotal: Math.round(grandTotal * 100) / 100,
          createdBy: mi.createdBy ? `${mi.createdBy}${mi.createdByDesignation ? ` (${mi.createdByDesignation})` : ''}` : 'System Staff',
          createdAt: mi.createdAt,
          remarks: mi.remarks || '-'
        };
      });

      const paginated = paginate(records, params.page, params.pageSize);
      const kpis = {
        totalInwardReceipts: records.length,
        totalReceivedQuantity: records.reduce((acc, r) => acc + r.receivedQuantity, 0),
        subtotalTaxable: records.reduce((acc, r) => acc + r.subtotal, 0),
        totalGst: records.reduce((acc, r) => acc + r.totalGst, 0),
        grandTotal: records.reduce((acc, r) => acc + r.grandTotal, 0)
      };
      return { success: true, data: paginated.items, pagination: paginated.pagination, kpis };
    }

    case 'returnable-material':
    case 'pending-returns': {
      let filteredGps = rawGps.filter(gp => (gp.passType || 'Returnable') === 'Returnable');
      filteredGps = safeDateFilter(filteredGps, params.fromDate, params.toDate, 'date');
      filteredGps = filterCommon(filteredGps, params);
      filteredGps.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

      const now = new Date();
      let records = [];

      for (const gp of filteredGps) {
        const gpInwards = rawMis.filter(mi => mi.gatePassNumber === gp.gatePassNumber || mi.gatePassId === gp._id);
        const lastInward = gpInwards.length > 0
          ? gpInwards.reduce((latest, curr) => (new Date(curr.inwardDate) > new Date(latest.inwardDate) ? curr : latest), gpInwards[0])
          : null;

        for (const itemRow of (gp.items || [])) {
          const origQty = Number(itemRow.quantity) || 0;
          const returnableQty = itemRow.returnable !== false ? origQty : 0;
          const returnedQty = Number(itemRow.receivedQuantity) || 0;
          const pendingQty = Math.max(0, returnableQty - returnedQty);

          const itemRate = Number(itemRow.rate) || 0;
          const taxableAmount = Math.round(returnableQty * itemRate * 100) / 100;
          const gstPercentage = taxableAmount > 0 ? (Number(itemRow.gstPercentage) || 18) : 0;
          const gstAmount = taxableAmount > 0 ? Math.round(taxableAmount * (gstPercentage / 100) * 100) / 100 : 0;
          const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

          const gpDate = new Date(gp.date || gp.createdAt);
          const daysPending = Math.max(0, Math.floor((now.getTime() - gpDate.getTime()) / (1000 * 60 * 60 * 24)));

          records.push({
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
            daysPending,
            rate: itemRate,
            taxableAmount,
            gstPercentage,
            gstAmount,
            totalGst: gstAmount,
            grandTotal,
            lastInwardDate: lastInward ? lastInward.inwardDate : null,
            gatePassStatus: gp.gatePassStatus || 'OPEN',
            returnStatus: gp.returnStatus || 'PENDING',
            remarks: itemRow.remarks || gp.purpose || '-'
          });
        }
      }

      if (reportType === 'pending-returns') {
        records = records.filter(r => r.pendingQuantity > 0).sort((a, b) => b.daysPending - a.daysPending);
      }

      const paginated = paginate(records, params.page, params.pageSize);
      const kpis = reportType === 'pending-returns'
        ? {
            totalPendingItems: records.length,
            totalPendingQuantity: records.reduce((acc, r) => acc + r.pendingQuantity, 0),
            avgDaysPending: records.length > 0 ? Math.round(records.reduce((acc, r) => acc + r.daysPending, 0) / records.length) : 0,
            maxDaysPending: records.length > 0 ? Math.max(...records.map(r => r.daysPending)) : 0
          }
        : {
            totalReturnableItems: records.length,
            totalReturnableQuantity: records.reduce((acc, r) => acc + r.returnableQuantity, 0),
            totalReturnedQuantity: records.reduce((acc, r) => acc + r.returnedQuantity, 0),
            totalPendingQuantity: records.reduce((acc, r) => acc + r.pendingQuantity, 0)
          };

      return { success: true, data: paginated.items, pagination: paginated.pagination, kpis };
    }

    case 'gate-pass-closure': {
      let filtered = rawGps.filter(gp => gp.returnStatus === 'FULLY_RETURNED' || gp.gatePassStatus === 'CLOSED');
      filtered = safeDateFilter(filtered, params.fromDate, params.toDate, 'date');
      filtered = filterCommon(filtered, params);
      filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

      const records = filtered.map(gp => {
        const items = gp.items || [];
        const origReturnableQty = items.reduce((acc, it) => acc + (it.returnable !== false ? Number(it.quantity) || 0 : 0), 0);
        const totalReturnedQty = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);

        const gpInwards = rawMis.filter(mi => mi.gatePassNumber === gp.gatePassNumber || mi.gatePassId === gp._id);
        const finalInward = gpInwards.length > 0 ? gpInwards[gpInwards.length - 1] : null;

        const closureDate = finalInward ? (finalInward.inwardDate || finalInward.createdAt) : gp.updatedAt;
        const gpDate = new Date(gp.date || gp.createdAt);
        const closeDate = new Date(closureDate);
        const totalDaysToClose = Math.max(0, Math.floor((closeDate.getTime() - gpDate.getTime()) / (1000 * 60 * 60 * 24)));

        const createdByStr = gp.createdBy
          ? (gp.createdByDesignation ? `${gp.createdBy} (${gp.createdByDesignation})` : gp.createdBy)
          : 'System Staff';

        const taxableAmount = items.reduce((acc, it) => {
          const q = Number(it.quantity) || 0;
          const r = Number(it.rate) || 500;
          return acc + (q * r);
        }, 0);

        const avgRate = origReturnableQty > 0 && taxableAmount > 0 ? Math.round((taxableAmount / origReturnableQty) * 100) / 100 : 0;
        const gstPercentage = taxableAmount > 0 ? 18 : 0;
        const gstAmount = taxableAmount > 0 ? Math.round(taxableAmount * (gstPercentage / 100) * 100) / 100 : 0;
        const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

        const formattedItems = items.map(it => {
          const q = Number(it.quantity) || 0;
          const recQ = Number(it.receivedQuantity) || 0;
          const r = Number(it.rate) || 500;
          const taxAmt = Math.round(q * r * 100) / 100;
          const gstPct = taxAmt > 0 ? 18 : 0;
          const gstAmt = taxAmt > 0 ? Math.round(taxAmt * 0.18 * 100) / 100 : 0;
          const gTot = Math.round((taxAmt + gstAmt) * 100) / 100;

          const itemInwardStr = gpInwards.length > 0 
            ? gpInwards.map(mi => `${mi.inwardNumber} (${safeFormatDate(mi.inwardDate || mi.createdAt)})`).join(', ')
            : '-';

          return {
            description: it.description || it.itemDescription || 'Material Item',
            category: it.category || 'OCR',
            unit: it.uom || it.unit || 'Nos',
            originalQuantity: q,
            returnedQuantity: recQ,
            inwardDetailsStr: itemInwardStr,
            rate: r,
            taxableAmount: taxAmt,
            gstPercentage: gstPct,
            gstAmount: gstAmt,
            grandTotal: gTot,
            remarks: it.remarks || '-'
          };
        });

        const formattedInwards = gpInwards.map(mi => ({
          inwardNumber: mi.inwardNumber,
          inwardDate: mi.inwardDate || mi.createdAt,
          gateEntryNumber: mi.gateEntryNumber || '-',
          challanInvoiceNumber: mi.challanInvoiceNumber || '-',
          subtotal: Number(mi.subtotal) || 0,
          totalGst: Number(mi.totalGst) || 0,
          grandTotal: Number(mi.grandTotal) || 0,
          createdBy: mi.createdBy ? (mi.createdByDesignation ? `${mi.createdBy} (${mi.createdByDesignation})` : mi.createdBy) : 'Admin',
          approvedBy: mi.approvedBy ? (mi.approvedByDesignation ? `${mi.approvedBy} (${mi.approvedByDesignation})` : mi.approvedBy) : '-'
        }));

        return {
          gatePassId: gp._id,
          gatePassNumber: gp.gatePassNumber,
          date: gp.date || gp.createdAt,
          companyName: gp.companyName,
          vendorAddress: gp.vendorAddress || 'Not specified',
          vendorGstin: gp.vendorGstin || '-',
          vendorPanCard: gp.vendorPanCard || '-',
          passType: gp.passType || gp.gatePassType || 'Returnable',
          department: gp.department || 'GENERAL',
          purpose: gp.purpose || '-',
          costCentre: gp.costCentre || '-',
          vehicleNumber: gp.vehicleNumber || '-',
          driverName: gp.driverName || '-',
          createdBy: createdByStr,
          originalReturnableQuantity: origReturnableQty,
          totalReturnedQuantity: totalReturnedQty,
          finalInwardNumber: finalInward ? finalInward.inwardNumber : '-',
          finalInwardDate: finalInward ? finalInward.inwardDate : null,
          closureDate,
          totalDaysToClose,
          rate: Math.round(avgRate * 100) / 100,
          taxableAmount: Math.round(taxableAmount * 100) / 100,
          gstPercentage,
          gstAmount,
          totalGst: gstAmount,
          grandTotal,
          gatePassStatus: gp.gatePassStatus || 'CLOSED',
          returnStatus: gp.returnStatus || 'FULLY_RETURNED',
          items: formattedItems,
          inwards: formattedInwards
        };
      });

      const paginated = paginate(records, params.page, params.pageSize);
      const kpis = {
        totalClosedPasses: records.length,
        totalReturnedQuantity: records.reduce((acc, r) => acc + r.totalReturnedQuantity, 0),
        avgDaysToClose: records.length > 0 ? Math.round(records.reduce((acc, r) => acc + r.totalDaysToClose, 0) / records.length) : 0
      };
      return { success: true, data: paginated.items, pagination: paginated.pagination, kpis };
    }

    case 'party-summary': {
      let filteredGps = safeDateFilter(rawGps, params.fromDate, params.toDate, 'date');
      filteredGps = filterCommon(filteredGps, params);

      const partyMap = {};

      for (const gp of filteredGps) {
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
            taxableAmount: 0,
            gstPercentage: 18,
            totalGst: 0,
            totalGrandTotal: 0,
            gatePasses: []
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

        const createdByStr = gp.createdBy
          ? (gp.createdByDesignation ? `${gp.createdBy} (${gp.createdByDesignation})` : gp.createdBy)
          : 'System Staff';

        const gpInwards = rawMis.filter(mi => mi.gatePassNumber === gp.gatePassNumber || (mi.gatePassId && gp._id && mi.gatePassId.toString() === gp._id.toString()));
        const inwardDetailsStr = gpInwards.length > 0 
          ? gpInwards.map(mi => `${mi.inwardNumber} (${safeFormatDate(mi.inwardDate || mi.createdAt)})`).join(', ')
          : '-';

        const rateMap = buildInwardRateMapClient(rawMis);
        const gpItemsFormatted = items.map(it => {
          const q = Number(it.quantity) || 0;
          const recQ = Number(it.receivedQuantity) || 0;
          const isRet = it.returnable !== false;
          const itemPendQ = Math.max(0, (isRet ? q : 0) - recQ);
          const r = resolveItemRateClient(it, rateMap);
          const taxAmt = Math.round(q * r * 100) / 100;
          const gstPct = taxAmt > 0 ? 18 : 0;
          const gstAmt = taxAmt > 0 ? Math.round(taxAmt * 0.18 * 100) / 100 : 0;
          const gTot = Math.round((taxAmt + gstAmt) * 100) / 100;

          return {
            description: it.description || it.itemDescription || 'Material Item',
            category: it.category || 'OCR',
            unit: it.unit || 'Nos',
            originalQuantity: q,
            receivedQuantity: recQ,
            pendingQuantity: itemPendQ,
            inwardDetailsStr,
            rate: r,
            taxableAmount: taxAmt,
            gstPercentage: gstPct,
            gstAmount: gstAmt,
            grandTotal: gTot,
            remarks: it.remarks || gp.remarks || '-'
          };
        });

        p.gatePasses.push({
          gatePassId: gp._id,
          gatePassNumber: gp.gatePassNumber,
          date: gp.date || gp.createdAt,
          createdBy: createdByStr,
          materialType: gp.passType || gp.materialType || 'Returnable',
          purpose: gp.purpose || '-',
          gatePassStatus: gp.gatePassStatus || 'OPEN',
          returnStatus: gp.returnStatus || 'PENDING',
          vendorAddress: gp.vendorAddress || '-',
          vendorGstin: gp.vendorGstin || '-',
          items: gpItemsFormatted
        });
      }

      for (const mi of rawMis) {
        const name = mi.partyName;
        if (partyMap[name]) {
          partyMap[name].totalGrandTotal += Number(mi.grandTotal) || 0;
        }
      }

      const records = Object.values(partyMap).sort((a, b) => b.totalPendingQuantity - a.totalPendingQuantity);
      const paginated = paginate(records, params.page, params.pageSize);

      const kpis = {
        totalParties: records.length,
        totalOpenPasses: records.reduce((acc, r) => acc + r.openGatePasses, 0),
        totalPendingQuantity: records.reduce((acc, r) => acc + r.totalPendingQuantity, 0),
        totalGrandTotal: records.reduce((acc, r) => acc + r.totalGrandTotal, 0)
      };
      return { success: true, data: paginated.items, pagination: paginated.pagination, kpis };
    }

    case 'combined':
    default: {
      let filteredGps = safeDateFilter(rawGps, params.fromDate, params.toDate, 'date');
      filteredGps = filterCommon(filteredGps, params);
      filteredGps.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

      const rateMap = buildInwardRateMapClient(rawMis);
      const records = [];

      for (const gp of filteredGps) {
        const gpInwards = rawMis.filter(mi => mi.gatePassNumber === gp.gatePassNumber || mi.gatePassId === gp._id);

        for (const gpItem of (gp.items || [])) {
          const origQty = Number(gpItem.quantity) || 0;
          const retQty = gpItem.returnable !== false ? origQty : 0;
          const itemRate = resolveItemRateClient(gpItem, rateMap);
          const gstPercentage = Number(gpItem.gstPercentage) || 18;

          const gpItemInwards = [];
          for (const inv of gpInwards) {
            const matchedInwardItem = (inv.items || []).find(it => 
              (it.gatePassItemId && gpItem._id && it.gatePassItemId.toString() === gpItem._id.toString()) ||
              (it.serialNumber && gpItem.serialNumber && Number(it.serialNumber) === Number(gpItem.serialNumber)) ||
              (it.description && gpItem.description && it.description.toLowerCase().trim() === gpItem.description.toLowerCase().trim())
            );
            if (matchedInwardItem && Number(matchedInwardItem.receivedQuantity) > 0) {
              gpItemInwards.push({ inv, matchedInwardItem });
            }
          }

          if (gpItemInwards.length === 0) {
            records.push({
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
              rate: Number(gpItem.rate) || 0,
              taxableAmount: 0,
              gstPercentage: Number(gpItem.gstPercentage) || 0,
              gstAmount: 0,
              totalGst: 0,
              grandTotal: 0,
              returnStatus: gp.returnStatus || 'PENDING'
            });
          } else {
            let runningReceived = 0;
            for (let i = 0; i < gpItemInwards.length; i++) {
              const { inv, matchedInwardItem } = gpItemInwards[i];
              const thisRecQty = Number(matchedInwardItem.receivedQuantity) || 0;
              const thisRate = matchedInwardItem && Number(matchedInwardItem.rate) > 0 ? Number(matchedInwardItem.rate) : (Number(gpItem.rate) || 0);
              const thisGstPct = matchedInwardItem && Number(matchedInwardItem.gstPercentage) > 0 ? Number(matchedInwardItem.gstPercentage) : (Number(gpItem.gstPercentage) || 0);

              runningReceived += thisRecQty;
              const balanceQty = Math.max(0, retQty - runningReceived);

              const thisStatus = balanceQty === 0 
                ? 'FULLY_RETURNED' 
                : (runningReceived > 0 ? 'PARTIALLY_RETURNED' : 'PENDING');

              const taxableAmount = Math.round(thisRecQty * thisRate * 100) / 100;
              const gstAmount = Math.round(taxableAmount * (thisGstPct / 100) * 100) / 100;
              const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

              records.push({
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
                rate: thisRate,
                taxableAmount,
                gstPercentage: thisGstPct,
                gstAmount,
                totalGst: gstAmount,
                grandTotal,
                returnStatus: thisStatus
              });
            }
          }
        }
      }

      const paginated = paginate(records, params.page, params.pageSize);
      const kpis = {
        totalRows: records.length,
        totalGatePasses: new Set(records.map(r => r.gatePassNumber)).size,
        totalReceivedQuantity: records.reduce((acc, r) => acc + r.receivedQuantity, 0),
        totalBalanceQuantity: records.reduce((acc, r) => acc + r.balanceQuantity, 0),
        totalTaxableAmount: records.reduce((acc, r) => acc + r.taxableAmount, 0),
        totalGst: records.reduce((acc, r) => acc + r.gstAmount, 0),
        grandTotal: records.reduce((acc, r) => acc + r.grandTotal, 0)
      };
      return { success: true, data: paginated.items, pagination: paginated.pagination, kpis };
    }
  }
};

export const reportService = {
  getParties: async () => {
    try {
      const response = await api.get('/reports/parties');
      return response.data;
    } catch (err) {
      // Fallback: extract distinct parties from gate-passes
      const gpRes = await api.get('/gate-passes').catch(() => ({ data: { data: [] } }));
      const list = (gpRes.data?.data || gpRes.data || []).map(gp => gp.companyName).filter(Boolean);
      return { success: true, data: Array.from(new Set(list)).sort() };
    }
  },

  getGatePassRegister: async (params) => {
    try {
      const response = await api.get('/reports/gate-pass', { params });
      return response.data;
    } catch (err) {
      return await fallbackReport('gate-pass', params);
    }
  },

  getMaterialInwardRegister: async (params) => {
    try {
      const response = await api.get('/reports/material-inward', { params });
      return response.data;
    } catch (err) {
      return await fallbackReport('material-inward', params);
    }
  },

  getReturnableMaterialReport: async (params) => {
    try {
      const response = await api.get('/reports/returnable-material', { params });
      return response.data;
    } catch (err) {
      return await fallbackReport('returnable-material', params);
    }
  },

  getPendingReturnReport: async (params) => {
    try {
      const response = await api.get('/reports/pending-returns', { params });
      return response.data;
    } catch (err) {
      return await fallbackReport('pending-returns', params);
    }
  },

  getGatePassClosureReport: async (params) => {
    try {
      const response = await api.get('/reports/gate-pass-closure', { params });
      return response.data;
    } catch (err) {
      return await fallbackReport('gate-pass-closure', params);
    }
  },

  getPartySummaryReport: async (params) => {
    try {
      const response = await api.get('/reports/party-summary', { params });
      return response.data;
    } catch (err) {
      return await fallbackReport('party-summary', params);
    }
  },

  getCombinedReport: async (params) => {
    try {
      const response = await api.get('/reports/combined', { params });
      return response.data;
    } catch (err) {
      return await fallbackReport('combined', params);
    }
  },

  exportExcel: async (params) => {
    try {
      const response = await api.get('/reports/export/excel', {
        params,
        responseType: 'blob'
      });
      return response;
    } catch (err) {
      console.warn('Backend Excel API endpoint unavailable, generating workbook via client-side ExcelJS:', err);
      
      const reportType = params.reportType || 'gate-pass';
      const fullParams = { ...params, page: 1, pageSize: 100000 };
      const reportRes = await fallbackReport(reportType, fullParams);
      
      const records = reportRes.data || [];
      const kpis = reportRes.kpis || {};
      const reportTitle = reportType.replace(/-/g, ' ').toUpperCase() + ' REPORT';

      const blob = await generateClientExcel({
        reportType,
        reportTitle,
        filters: params,
        records,
        kpis
      });

      return { data: blob };
    }
  }
};

const buildSectionWiseGatePassSheet = (workbook, reportTitle, records = []) => {
  const dataSheet = workbook.addWorksheet('Gate Pass Register', {
    views: [{ showGridLines: true }]
  });

  const columnsConfig = [
    { key: 'colA', width: 16 },
    { key: 'colB', width: 22 },
    { key: 'colC', width: 16 },
    { key: 'colD', width: 22 },
    { key: 'colE', width: 30 },
    { key: 'colF', width: 16 },
    { key: 'colG', width: 12 },
    { key: 'colH', width: 12 },
    { key: 'colI', width: 12 },
    { key: 'colJ', width: 10 },
    { key: 'colK', width: 16 },
    { key: 'colL', width: 14 },
    { key: 'colM', width: 24 }
  ];

  dataSheet.columns = columnsConfig.map(c => ({ width: c.width }));

  const fontMainTitle = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSecBanner = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontHeaderLabel = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  const fontHeaderValue = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
  const fontTableHead = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSubtotal = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };

  const fillMainTitle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSecBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillLeftHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillRightHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const fillItemHeadLeft = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillItemHeadRight = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSubtotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillGrandTotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };
  const borderDouble = {
    top: { style: 'double', color: { argb: 'FF0F2A47' } },
    bottom: { style: 'double', color: { argb: 'FF0F2A47' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  let currentRow = 1;

  dataSheet.mergeCells(`A${currentRow}:M${currentRow}`);
  const titleCell = dataSheet.getCell(`A${currentRow}`);
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — GATE PASS REGISTER (SECTION-WISE REPORT)';
  titleCell.font = fontMainTitle;
  titleCell.fill = fillMainTitle;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dataSheet.getRow(currentRow).height = 28;
  currentRow += 2;

  if (!records || records.length === 0) {
    dataSheet.addRow(['No Gate Pass records found for the selected filter criteria.']).font = { italic: true };
    return;
  }

  let grandTotalGpQty = 0;
  let grandTotalRecQty = 0;
  let grandTotalBalQty = 0;

  records.forEach((rec, idx) => {
    const sectionNum = idx + 1;
    const items = rec.items && rec.items.length > 0 ? rec.items : [
      {
        description: rec.purpose || rec.remarks || 'Gate Pass Material',
        category: 'OCR',
        quantity: rec.totalQuantity || 0,
        receivedQuantity: rec.returnedQuantity || 0,
        balanceQuantity: rec.balanceReturnableQuantity || 0,
        unit: 'Nos',
        costCentre: rec.costCentre || '-',
        returnable: rec.materialType !== 'Non-Returnable',
        remarks: rec.remarks || '-'
      }
    ];

    const gpNo = rec.gatePassNumber || '-';
    const partyName = rec.companyName || rec.partyName || '-';
    const createdByStr = rec.createdBy || 'System Staff';

    dataSheet.mergeCells(`A${currentRow}:M${currentRow}`);
    const bannerCell = dataSheet.getCell(`A${currentRow}`);
    bannerCell.value = `SECTION #${sectionNum} | GATE PASS NO: ${gpNo} | DATE: ${safeFormatDate(rec.date)} | PARTY: ${partyName.toUpperCase()}`;
    bannerCell.font = fontSecBanner;
    bannerCell.fill = fillSecBanner;
    bannerCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    dataSheet.getRow(currentRow).height = 24;
    currentRow++;

    // Row 1
    dataSheet.getCell(`A${currentRow}`).value = 'Gate Pass No.:';
    dataSheet.getCell(`B${currentRow}`).value = gpNo;
    dataSheet.getCell(`C${currentRow}`).value = 'GP Date:';
    dataSheet.getCell(`D${currentRow}`).value = safeFormatDate(rec.date);

    dataSheet.getCell(`E${currentRow}`).value = 'Pass Type:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = rec.materialType || rec.passType || 'Returnable';
    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Department:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = rec.department || 'GENERAL';

    ['A', 'C'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillLeftHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['B', 'D'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 2
    dataSheet.getCell(`A${currentRow}`).value = 'Party / Vendor:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${partyName} ${rec.vendorGstin ? '(GSTIN: ' + rec.vendorGstin + ')' : ''}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Vendor Address:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = rec.vendorAddress || 'Not specified';
    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Vehicle / Driver:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = `${rec.vehicleNumber || '-'} ${rec.driverName ? ' / Driver: ' + rec.driverName : ''}`;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 3
    dataSheet.getCell(`A${currentRow}`).value = 'Purpose:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = rec.purpose || '-';

    dataSheet.getCell(`E${currentRow}`).value = 'Created By:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = createdByStr;

    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'GP Status:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    const statusStr = `${rec.gatePassStatus || 'OPEN'} | Approval: ${rec.approvalStatus || 'Pending'} | Return: ${rec.returnStatus || 'PENDING'}`;
    dataSheet.getCell(`J${currentRow}`).value = statusStr;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 4: Items Header
    dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
    dataSheet.getCell(`A${currentRow}`).value = 'GATE PASS ITEMS SPECIFICATION';
    dataSheet.getCell(`A${currentRow}`).font = fontTableHead;
    dataSheet.getCell(`A${currentRow}`).fill = fillItemHeadLeft;
    dataSheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    const itemHeaders = [
      { col: 'E', title: 'Item Description', align: 'left' },
      { col: 'F', title: 'Category', align: 'center' },
      { col: 'G', title: 'GP Qty', align: 'right' },
      { col: 'H', title: 'Rec. Qty', align: 'right' },
      { col: 'I', title: 'Bal. Qty', align: 'right' },
      { col: 'J', title: 'Unit', align: 'center' },
      { col: 'K', title: 'Cost Centre', align: 'left' },
      { col: 'L', title: 'Returnable', align: 'center' },
      { col: 'M', title: 'Remarks', align: 'left' }
    ];

    itemHeaders.forEach(h => {
      const cell = dataSheet.getCell(`${h.col}${currentRow}`);
      cell.value = h.title;
      cell.font = fontTableHead;
      cell.fill = fillItemHeadRight;
      cell.alignment = { horizontal: h.align, vertical: 'middle' };
      cell.border = borderThin;
    });
    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    // Items Data Rows
    let secGpQty = 0;
    let secRecQty = 0;
    let secBalQty = 0;

    items.forEach((it, itemIdx) => {
      dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const itemLabel = dataSheet.getCell(`A${currentRow}`);
      itemLabel.value = `Item #${itemIdx + 1}`;
      itemLabel.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
      itemLabel.alignment = { horizontal: 'center', vertical: 'middle' };
      itemLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
      itemLabel.border = borderThin;

      const q = Number(it.quantity) || 0;
      const r = Number(it.receivedQuantity) || Number(it.returnedQuantity) || 0;
      const b = Math.max(0, q - r);

      secGpQty += q;
      secRecQty += r;
      secBalQty += b;

      dataSheet.getCell(`E${currentRow}`).value = it.description || it.itemDescription || '-';
      dataSheet.getCell(`F${currentRow}`).value = it.category || 'OCR';
      dataSheet.getCell(`G${currentRow}`).value = q;
      dataSheet.getCell(`H${currentRow}`).value = r;
      dataSheet.getCell(`I${currentRow}`).value = b;
      dataSheet.getCell(`J${currentRow}`).value = it.unit || it.uom || 'Nos';
      dataSheet.getCell(`K${currentRow}`).value = it.costCentre || '-';
      dataSheet.getCell(`L${currentRow}`).value = it.returnable !== false ? 'Yes' : 'No';
      dataSheet.getCell(`M${currentRow}`).value = it.remarks || '-';

      ['E', 'K', 'M'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' });
      ['F', 'J', 'L'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' });
      ['G', 'H', 'I'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      });

      ['E','F','G','H','I','J','K','L','M'].forEach(c => {
        dataSheet.getCell(`${c}${currentRow}`).border = borderThin;
        dataSheet.getCell(`${c}${currentRow}`).font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      });

      dataSheet.getRow(currentRow).height = 20;
      currentRow++;
    });

    // Subtotal Row
    dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const subLabel = dataSheet.getCell(`A${currentRow}`);
    subLabel.value = `SECTION #${sectionNum} TOTALS (${items.length} Items)`;
    subLabel.font = fontSubtotal;
    subLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    subLabel.fill = fillSubtotal;

    ['A','B','C','D','E','F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderThin);

    dataSheet.getCell(`G${currentRow}`).value = secGpQty;
    dataSheet.getCell(`H${currentRow}`).value = secRecQty;
    dataSheet.getCell(`I${currentRow}`).value = secBalQty;

    ['G', 'H', 'I'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.font = fontSubtotal;
      cell.fill = fillSubtotal;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0.00';
      cell.border = borderThin;
    });

    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    const subBlank = dataSheet.getCell(`J${currentRow}`);
    subBlank.fill = fillSubtotal;
    ['J','K','L','M'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderThin);

    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    grandTotalGpQty += secGpQty;
    grandTotalRecQty += secRecQty;
    grandTotalBalQty += secBalQty;

    currentRow += 1;
  });

  // Grand Total Block
  dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const gtLabel = dataSheet.getCell(`A${currentRow}`);
  gtLabel.value = `GRAND TOTAL (${records.length} Gate Passes)`;
  gtLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
  gtLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  gtLabel.fill = fillGrandTotal;

  ['A','B','C','D','E','F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderDouble);

  dataSheet.getCell(`G${currentRow}`).value = grandTotalGpQty;
  dataSheet.getCell(`H${currentRow}`).value = grandTotalRecQty;
  dataSheet.getCell(`I${currentRow}`).value = grandTotalBalQty;

  ['G', 'H', 'I'].forEach(c => {
    const cell = dataSheet.getCell(`${c}${currentRow}`);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
    cell.fill = fillGrandTotal;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    cell.numFmt = '#,##0.00';
    cell.border = borderDouble;
  });

  dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
  const gtBlank = dataSheet.getCell(`J${currentRow}`);
  gtBlank.fill = fillGrandTotal;
  ['J','K','L','M'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderDouble);

  dataSheet.getRow(currentRow).height = 26;
};

const buildSectionWisePartySummarySheet = (workbook, reportTitle, records = []) => {
  const dataSheet = workbook.addWorksheet('Party Wise Summary', {
    views: [{ showGridLines: true }]
  });

  const columnsConfig = [
    { key: 'colA', width: 10 },
    { key: 'colB', width: 20 },
    { key: 'colC', width: 14 },
    { key: 'colD', width: 26 },
    { key: 'colE', width: 30 },
    { key: 'colF', width: 14 },
    { key: 'colG', width: 12 },
    { key: 'colH', width: 12 },
    { key: 'colI', width: 12 },
    { key: 'colJ', width: 10 },
    { key: 'colK', width: 24 },
    { key: 'colL', width: 14 },
    { key: 'colM', width: 16 },
    { key: 'colN', width: 18 }
  ];

  dataSheet.columns = columnsConfig.map(c => ({ width: c.width }));

  const fontMainTitle = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSecBanner = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontGpBanner = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontHeaderLabel = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  const fontHeaderValue = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
  const fontTableHead = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontDataCell = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
  const fontSubtotal = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
  const fontPartyTotal = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };

  const fillMainTitle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSecBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillGpBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  const fillLeftHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillTableHead = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSubtotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillPartyTotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  const fillGrandTotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBAE6FD' } };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };
  const borderDouble = {
    top: { style: 'double', color: { argb: 'FF0F2A47' } },
    bottom: { style: 'double', color: { argb: 'FF0F2A47' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  let currentRow = 1;

  dataSheet.mergeCells(`A${currentRow}:N${currentRow}`);
  const titleCell = dataSheet.getCell(`A${currentRow}`);
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — PARTY-WISE SUMMARY & DETAILED REGISTER';
  titleCell.font = fontMainTitle;
  titleCell.fill = fillMainTitle;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dataSheet.getRow(currentRow).height = 28;
  currentRow += 2;

  if (!records || records.length === 0) {
    dataSheet.addRow(['No Party records found for the selected filter criteria.']).font = { italic: true };
    return;
  }

  let grandTotalGpQty = 0;
  let grandTotalRecQty = 0;
  let grandTotalPendQty = 0;
  let grandTotalTaxable = 0;
  let grandTotalAmount = 0;

  records.forEach((party, pIdx) => {
    const partyNum = pIdx + 1;
    const partyName = party.partyName || party.companyName || 'Unknown Party';
    const gatePasses = party.gatePasses && party.gatePasses.length > 0 ? party.gatePasses : [];

    dataSheet.mergeCells(`A${currentRow}:N${currentRow}`);
    const partyBannerCell = dataSheet.getCell(`A${currentRow}`);
    partyBannerCell.value = `SECTION #${partyNum} | PARTY: ${partyName.toUpperCase()} | TOTAL GATE PASSES: ${party.totalGatePasses || gatePasses.length} (OPEN: ${party.openGatePasses || 0}, CLOSED: ${party.closedGatePasses || 0})`;
    partyBannerCell.font = fontSecBanner;
    partyBannerCell.fill = fillSecBanner;
    partyBannerCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    dataSheet.getRow(currentRow).height = 24;
    currentRow++;

    dataSheet.getCell(`A${currentRow}`).value = 'Party Name:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = partyName;
    dataSheet.getCell(`E${currentRow}`).value = 'Tot. Ret Qty:';
    dataSheet.getCell(`F${currentRow}`).value = party.totalReturnableQuantity || 0;
    dataSheet.getCell(`G${currentRow}`).value = 'Tot. Rec Qty:';
    dataSheet.getCell(`H${currentRow}`).value = party.totalReturnedQuantity || 0;
    dataSheet.getCell(`I${currentRow}`).value = 'Tot. Pend Qty:';
    dataSheet.getCell(`J${currentRow}`).value = party.totalPendingQuantity || 0;
    dataSheet.getCell(`K${currentRow}`).value = 'Taxable Amt:';
    dataSheet.getCell(`L${currentRow}`).value = party.taxableAmount || 0;
    dataSheet.getCell(`M${currentRow}`).value = 'Grand Total:';
    dataSheet.getCell(`N${currentRow}`).value = party.grandTotal || 0;

    ['A', 'E', 'G', 'I', 'K', 'M'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillLeftHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['B', 'F', 'H', 'J', 'L', 'N'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
      if (['F','H','J'].includes(c)) cell.numFmt = '#,##0.00';
      if (['L','N'].includes(c)) cell.numFmt = '"₹" #,##0.00';
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    let partyGpQty = 0;
    let partyRecQty = 0;
    let partyPendQty = 0;
    let partyTaxable = 0;
    let partyGrandTotal = 0;

    if (gatePasses.length === 0) {
      dataSheet.mergeCells(`A${currentRow}:N${currentRow}`);
      const emptyCell = dataSheet.getCell(`A${currentRow}`);
      emptyCell.value = 'No Gate Pass records found for this party.';
      emptyCell.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
      dataSheet.getRow(currentRow).height = 20;
      currentRow++;
    } else {
      gatePasses.forEach((gp, gpIdx) => {
        const gpNo = gp.gatePassNumber || '-';
        const gpDateVal = gp.date ? safeFormatDate(gp.date) : '-';
        const createdBy = gp.createdBy || 'System Staff';
        const matType = gp.materialType || 'Returnable';
        const status = gp.returnStatus || gp.gatePassStatus || 'OPEN';

        dataSheet.mergeCells(`A${currentRow}:N${currentRow}`);
        const gpBannerCell = dataSheet.getCell(`A${currentRow}`);
        gpBannerCell.value = `  GATE PASS #${gpIdx + 1}: ${gpNo}  |  DATE: ${gpDateVal}  |  CREATED BY: ${createdBy}  |  TYPE: ${matType}  |  STATUS: ${status}`;
        gpBannerCell.font = fontGpBanner;
        gpBannerCell.fill = fillGpBanner;
        gpBannerCell.alignment = { horizontal: 'left', vertical: 'middle' };
        dataSheet.getRow(currentRow).height = 22;
        currentRow++;

        const itemHeaders = [
          'Sr.', 'Gate Pass No.', 'GP Date', 'Created By (Designation)',
          'Item Description', 'Category', 'Orig Qty', 'Rec Qty', 'Pend Qty',
          'Unit', 'Inward Receipts (No. & Date)', 'Rate (₹)', 'Taxable Amt (₹)', 'Total Amt (₹)'
        ];

        const itemCols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
        itemCols.forEach((col, idx) => {
          const cell = dataSheet.getCell(`${col}${currentRow}`);
          cell.value = itemHeaders[idx];
          cell.font = fontTableHead;
          cell.fill = fillTableHead;
          cell.alignment = { horizontal: ['G','H','I','L','M','N'].includes(col) ? 'right' : 'left', vertical: 'middle' };
          cell.border = borderThin;
        });
        dataSheet.getRow(currentRow).height = 22;
        currentRow++;

        let gpSubGpQty = 0;
        let gpSubRecQty = 0;
        let gpSubPendQty = 0;
        let gpSubTaxable = 0;
        let gpSubGrandTotal = 0;

        const items = gp.items && gp.items.length > 0 ? gp.items : [
          {
            description: gp.purpose || 'Gate Pass Item',
            category: 'OCR',
            originalQuantity: 0,
            receivedQuantity: 0,
            pendingQuantity: 0,
            unit: 'Nos',
            inwardDetailsStr: '-',
            rate: 0,
            taxableAmount: 0,
            grandTotal: 0
          }
        ];

        items.forEach((it, itIdx) => {
          dataSheet.getCell(`A${currentRow}`).value = itIdx + 1;
          dataSheet.getCell(`B${currentRow}`).value = gpNo;
          dataSheet.getCell(`C${currentRow}`).value = gpDateVal;
          dataSheet.getCell(`D${currentRow}`).value = createdBy;
          dataSheet.getCell(`E${currentRow}`).value = it.description || 'Material Item';
          dataSheet.getCell(`F${currentRow}`).value = it.category || 'OCR';
          dataSheet.getCell(`G${currentRow}`).value = Number(it.originalQuantity) || 0;
          dataSheet.getCell(`H${currentRow}`).value = Number(it.receivedQuantity) || 0;
          dataSheet.getCell(`I${currentRow}`).value = Number(it.pendingQuantity) || 0;
          dataSheet.getCell(`J${currentRow}`).value = it.unit || 'Nos';
          dataSheet.getCell(`K${currentRow}`).value = it.inwardDetailsStr || '-';
          dataSheet.getCell(`L${currentRow}`).value = Number(it.rate) || 0;
          dataSheet.getCell(`M${currentRow}`).value = Number(it.taxableAmount) || 0;
          dataSheet.getCell(`N${currentRow}`).value = Number(it.grandTotal) || 0;

          itemCols.forEach(col => {
            const cell = dataSheet.getCell(`${col}${currentRow}`);
            cell.font = fontDataCell;
            cell.border = borderThin;
            cell.alignment = { horizontal: ['A','G','H','I','L','M','N'].includes(col) ? 'right' : 'left', vertical: 'middle' };
            if (['G','H','I'].includes(col)) cell.numFmt = '#,##0.00';
            if (['L','M','N'].includes(col)) cell.numFmt = '"₹" #,##0.00';
          });
          dataSheet.getRow(currentRow).height = 19;
          currentRow++;

          gpSubGpQty += Number(it.originalQuantity) || 0;
          gpSubRecQty += Number(it.receivedQuantity) || 0;
          gpSubPendQty += Number(it.pendingQuantity) || 0;
          gpSubTaxable += Number(it.taxableAmount) || 0;
          gpSubGrandTotal += Number(it.grandTotal) || 0;
        });

        dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const subLabel = dataSheet.getCell(`A${currentRow}`);
        subLabel.value = `SUBTOTAL (GP NO: ${gpNo})`;
        subLabel.font = fontSubtotal;
        subLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        subLabel.fill = fillSubtotal;

        ['A','B','C','D','E','F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderThin);

        dataSheet.getCell(`G${currentRow}`).value = gpSubGpQty;
        dataSheet.getCell(`H${currentRow}`).value = gpSubRecQty;
        dataSheet.getCell(`I${currentRow}`).value = gpSubPendQty;
        dataSheet.getCell(`J${currentRow}`).value = '';
        dataSheet.getCell(`K${currentRow}`).value = '';
        dataSheet.getCell(`L${currentRow}`).value = '';
        dataSheet.getCell(`M${currentRow}`).value = gpSubTaxable;
        dataSheet.getCell(`N${currentRow}`).value = gpSubGrandTotal;

        ['G','H','I','J','K','L','M','N'].forEach(c => {
          const cell = dataSheet.getCell(`${c}${currentRow}`);
          cell.font = fontSubtotal;
          cell.fill = fillSubtotal;
          cell.border = borderThin;
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (['G','H','I'].includes(c)) cell.numFmt = '#,##0.00';
          if (['M','N'].includes(c)) cell.numFmt = '"₹" #,##0.00';
        });

        dataSheet.getRow(currentRow).height = 21;
        currentRow++;

        partyGpQty += gpSubGpQty;
        partyRecQty += gpSubRecQty;
        partyPendQty += gpSubPendQty;
        partyTaxable += gpSubTaxable;
        partyGrandTotal += gpSubGrandTotal;
      });

      dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const partyTotLabel = dataSheet.getCell(`A${currentRow}`);
      partyTotLabel.value = `PARTY TOTAL (${partyName.toUpperCase()})`;
      partyTotLabel.font = fontPartyTotal;
      partyTotLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
      partyTotLabel.fill = fillPartyTotal;

      ['A','B','C','D','E','F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderDouble);

      dataSheet.getCell(`G${currentRow}`).value = partyGpQty;
      dataSheet.getCell(`H${currentRow}`).value = partyRecQty;
      dataSheet.getCell(`I${currentRow}`).value = partyPendQty;
      dataSheet.getCell(`J${currentRow}`).value = '';
      dataSheet.getCell(`K${currentRow}`).value = '';
      dataSheet.getCell(`L${currentRow}`).value = '';
      dataSheet.getCell(`M${currentRow}`).value = partyTaxable;
      dataSheet.getCell(`N${currentRow}`).value = partyGrandTotal;

      ['G','H','I','J','K','L','M','N'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.font = fontPartyTotal;
        cell.fill = fillPartyTotal;
        cell.border = borderDouble;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (['G','H','I'].includes(c)) cell.numFmt = '#,##0.00';
        if (['M','N'].includes(c)) cell.numFmt = '"₹" #,##0.00';
      });

      dataSheet.getRow(currentRow).height = 24;
      currentRow++;
    }

    grandTotalGpQty += partyGpQty;
    grandTotalRecQty += partyRecQty;
    grandTotalPendQty += partyPendQty;
    grandTotalTaxable += partyTaxable;
    grandTotalAmount += partyGrandTotal;

    currentRow += 1;
  });

  dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const gtLabel = dataSheet.getCell(`A${currentRow}`);
  gtLabel.value = `GRAND TOTAL ALL PARTIES (${records.length} Parties)`;
  gtLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
  gtLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  gtLabel.fill = fillGrandTotal;

  ['A','B','C','D','E','F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderDouble);

  dataSheet.getCell(`G${currentRow}`).value = grandTotalGpQty;
  dataSheet.getCell(`H${currentRow}`).value = grandTotalRecQty;
  dataSheet.getCell(`I${currentRow}`).value = grandTotalPendQty;
  dataSheet.getCell(`J${currentRow}`).value = '';
  dataSheet.getCell(`K${currentRow}`).value = '';
  dataSheet.getCell(`L${currentRow}`).value = '';
  dataSheet.getCell(`M${currentRow}`).value = grandTotalTaxable;
  dataSheet.getCell(`N${currentRow}`).value = grandTotalAmount;

  ['G','H','I','J','K','L','M','N'].forEach(c => {
    const cell = dataSheet.getCell(`${c}${currentRow}`);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
    cell.fill = fillGrandTotal;
    cell.border = borderDouble;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    if (['G','H','I'].includes(c)) cell.numFmt = '#,##0.00';
    if (['M','N'].includes(c)) cell.numFmt = '"₹" #,##0.00';
  });

  dataSheet.getRow(currentRow).height = 26;
};

/**
 * Build Section-Wise Gate Pass Closure Register Worksheet (Client)
 */
const buildSectionWiseClosureSheet = (workbook, reportTitle, records = []) => {
  const dataSheet = workbook.addWorksheet('Gate Pass Closure Register', {
    views: [{ showGridLines: true }]
  });

  const columnsConfig = [
    { key: 'colA', width: 14 },
    { key: 'colB', width: 22 },
    { key: 'colC', width: 14 },
    { key: 'colD', width: 22 },
    { key: 'colE', width: 28 },
    { key: 'colF', width: 14 },
    { key: 'colG', width: 14 },
    { key: 'colH', width: 14 },
    { key: 'colI', width: 10 },
    { key: 'colJ', width: 26 },
    { key: 'colK', width: 14 },
    { key: 'colL', width: 16 },
    { key: 'colM', width: 10 },
    { key: 'colN', width: 14 },
    { key: 'colO', width: 18 }
  ];

  dataSheet.columns = columnsConfig.map(c => ({ width: c.width }));

  const fontMainTitle = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSecBanner = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontHeaderLabel = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  const fontHeaderValue = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
  const fontTableHead = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontDataCell = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
  const fontTotalCell = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };

  const fillMainTitle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSecBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillLeftHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillRightHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const fillItemHeadLeft = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillItemHeadRight = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSubtotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillGrandTotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };
  const borderDouble = {
    top: { style: 'double', color: { argb: 'FF0F2A47' } },
    bottom: { style: 'double', color: { argb: 'FF0F2A47' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  let currentRow = 1;

  dataSheet.mergeCells(`A${currentRow}:O${currentRow}`);
  const titleCell = dataSheet.getCell(`A${currentRow}`);
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — GATE PASS CLOSURE & INWARD AUDIT REPORT (SECTION-WISE)';
  titleCell.font = fontMainTitle;
  titleCell.fill = fillMainTitle;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dataSheet.getRow(currentRow).height = 28;
  currentRow += 2;

  if (!records || records.length === 0) {
    dataSheet.addRow(['No Closed Gate Pass records found for the selected filter criteria.']).font = { italic: true };
    return;
  }

  let grandOrigQty = 0;
  let grandRetQty = 0;
  let grandTaxable = 0;
  let grandGst = 0;
  let grandAmount = 0;

  records.forEach((gp, idx) => {
    const sectionNum = idx + 1;
    const gpNo = gp.gatePassNumber || 'UNKNOWN';
    const partyName = gp.companyName || '-';

    dataSheet.mergeCells(`A${currentRow}:O${currentRow}`);
    const bannerCell = dataSheet.getCell(`A${currentRow}`);
    bannerCell.value = `SECTION #${sectionNum} | CLOSED GATE PASS NO: ${gpNo} | PARTY: ${partyName.toUpperCase()} | CLOSURE DATE: ${safeFormatDate(gp.closureDate || gp.finalInwardDate)}`;
    bannerCell.font = fontSecBanner;
    bannerCell.fill = fillSecBanner;
    bannerCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    dataSheet.getRow(currentRow).height = 24;
    currentRow++;

    // Row 1
    dataSheet.getCell(`A${currentRow}`).value = 'Gate Pass No.:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${gpNo} (Date: ${safeFormatDate(gp.date)})`;

    dataSheet.getCell(`E${currentRow}`).value = 'Pass Type / Dept:';
    dataSheet.mergeCells(`F${currentRow}:O${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = `${gp.passType || 'Returnable'} | Department: ${gp.department || 'GENERAL'}`;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getCell(`E${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`E${currentRow}`).fill = fillRightHeader;
    dataSheet.getCell(`E${currentRow}`).border = borderThin;
    dataSheet.getCell(`E${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`F${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`F${currentRow}`).border = borderThin;
    dataSheet.getCell(`F${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 2
    dataSheet.getCell(`A${currentRow}`).value = 'Party / Vendor:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${partyName} ${gp.vendorGstin && gp.vendorGstin !== '-' ? '(GSTIN: ' + gp.vendorGstin + ')' : ''}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Vendor Address:';
    dataSheet.mergeCells(`F${currentRow}:O${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = gp.vendorAddress || 'Not specified';

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getCell(`E${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`E${currentRow}`).fill = fillRightHeader;
    dataSheet.getCell(`E${currentRow}`).border = borderThin;
    dataSheet.getCell(`E${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`F${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`F${currentRow}`).border = borderThin;
    dataSheet.getCell(`F${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 3
    dataSheet.getCell(`A${currentRow}`).value = 'Created By:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = gp.createdBy || 'System Staff';

    dataSheet.getCell(`E${currentRow}`).value = 'Vehicle / Driver:';
    dataSheet.mergeCells(`F${currentRow}:H${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = `${gp.vehicleNumber || '-'} ${gp.driverName && gp.driverName !== '-' ? ' / Driver: ' + gp.driverName : ''}`;

    dataSheet.mergeCells(`I${currentRow}:J${currentRow}`);
    dataSheet.getCell(`I${currentRow}`).value = 'Purpose / Cost Ctr:';
    dataSheet.mergeCells(`K${currentRow}:O${currentRow}`);
    dataSheet.getCell(`K${currentRow}`).value = `${gp.purpose || '-'} | Cost Ctr: ${gp.costCentre || '-'}`;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'I'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'K'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });

    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 4
    dataSheet.getCell(`A${currentRow}`).value = 'Days to Close:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${gp.totalDaysToClose || 0} Days (Closed: ${safeFormatDate(gp.closureDate)})`;

    dataSheet.getCell(`E${currentRow}`).value = 'Final Inward No.:';
    dataSheet.mergeCells(`F${currentRow}:H${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = gp.finalInwardNumber || '-';

    dataSheet.mergeCells(`I${currentRow}:J${currentRow}`);
    dataSheet.getCell(`I${currentRow}`).value = 'Return Status:';
    dataSheet.mergeCells(`K${currentRow}:O${currentRow}`);
    const badgeCell = dataSheet.getCell(`K${currentRow}`);
    badgeCell.value = gp.returnStatus || 'FULLY_RETURNED';
    badgeCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF065F46' } };
    badgeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    badgeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    badgeCell.border = borderThin;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'I'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getCell(`F${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`F${currentRow}`).border = borderThin;
    dataSheet.getCell(`F${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Items table header
    dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
    dataSheet.getCell(`A${currentRow}`).value = 'GATE PASS ITEMS & INWARD AUDIT SPECIFICATION';
    dataSheet.getCell(`A${currentRow}`).font = fontTableHead;
    dataSheet.getCell(`A${currentRow}`).fill = fillItemHeadLeft;
    dataSheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    const itemHeaders = [
      { col: 'E', title: 'Item Description', align: 'left' },
      { col: 'F', title: 'Category', align: 'center' },
      { col: 'G', title: 'Orig. Return Qty', align: 'right' },
      { col: 'H', title: 'Total Rec. Qty', align: 'right' },
      { col: 'I', title: 'Unit', align: 'center' },
      { col: 'J', title: 'Inward Receipts (Voucher & Date)', align: 'left' },
      { col: 'K', title: 'Rate (₹)', align: 'right' },
      { col: 'L', title: 'Taxable Amt (₹)', align: 'right' },
      { col: 'M', title: 'GST %', align: 'center' },
      { col: 'N', title: 'GST Amt (₹)', align: 'right' },
      { col: 'O', title: 'Total Amount (₹)', align: 'right' }
    ];

    itemHeaders.forEach(h => {
      const cell = dataSheet.getCell(`${h.col}${currentRow}`);
      cell.value = h.title;
      cell.font = fontTableHead;
      cell.fill = fillItemHeadRight;
      cell.alignment = { horizontal: h.align, vertical: 'middle' };
      cell.border = borderThin;
    });
    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    let secOrigQty = 0;
    let secRetQty = 0;
    let secTaxable = 0;
    let secGst = 0;
    let secTotal = 0;

    const items = gp.items || [];
    items.forEach((it, itemIdx) => {
      dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const itemLabel = dataSheet.getCell(`A${currentRow}`);
      itemLabel.value = `Item #${itemIdx + 1}`;
      itemLabel.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
      itemLabel.alignment = { horizontal: 'center', vertical: 'middle' };
      itemLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
      itemLabel.border = borderThin;

      const origQ = Number(it.originalQuantity) || Number(it.quantity) || 0;
      const recQ = Number(it.returnedQuantity) || Number(it.receivedQuantity) || 0;
      const rateVal = Number(it.rate) || 0;
      const taxableVal = Number(it.taxableAmount) || (origQ * rateVal);
      const gstPct = Number(it.gstPercentage) || (taxableVal > 0 ? 18 : 0);
      const gstVal = Number(it.gstAmount) || (taxableVal * (gstPct / 100));
      const totalVal = Number(it.grandTotal || it.totalAmount) || (taxableVal + gstVal);

      secOrigQty += origQ;
      secRetQty += recQ;
      secTaxable += taxableVal;
      secGst += gstVal;
      secTotal += totalVal;

      dataSheet.getCell(`E${currentRow}`).value = it.description || it.itemDescription || '-';
      dataSheet.getCell(`F${currentRow}`).value = it.category || 'OCR';
      dataSheet.getCell(`G${currentRow}`).value = origQ;
      dataSheet.getCell(`H${currentRow}`).value = recQ;
      dataSheet.getCell(`I${currentRow}`).value = it.unit || it.uom || 'Nos';
      dataSheet.getCell(`J${currentRow}`).value = it.inwardDetailsStr || '-';
      dataSheet.getCell(`K${currentRow}`).value = rateVal;
      dataSheet.getCell(`L${currentRow}`).value = taxableVal;
      dataSheet.getCell(`M${currentRow}`).value = `${gstPct}%`;
      dataSheet.getCell(`N${currentRow}`).value = gstVal;
      dataSheet.getCell(`O${currentRow}`).value = totalVal;

      ['E', 'F', 'J'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: c === 'F' ? 'center' : 'left', vertical: 'middle' });
      ['G', 'H'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      });
      ['I', 'M'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' });
      ['K', 'L', 'N', 'O'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"₹" #,##0.00';
      });

      ['E','F','G','H','I','J','K','L','M','N','O'].forEach(c => {
        dataSheet.getCell(`${c}${currentRow}`).font = fontDataCell;
        dataSheet.getCell(`${c}${currentRow}`).border = borderThin;
      });

      dataSheet.getRow(currentRow).height = 20;
      currentRow++;
    });

    grandOrigQty += secOrigQty;
    grandRetQty += secRetQty;
    grandTaxable += secTaxable;
    grandGst += secGst;
    grandAmount += secTotal;

    // Section Summary
    dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const secTotalLabel = dataSheet.getCell(`A${currentRow}`);
    secTotalLabel.value = `SECTION TOTALS (${gpNo}):`;
    secTotalLabel.font = fontTotalCell;
    secTotalLabel.alignment = { horizontal: 'right', vertical: 'middle' };
    secTotalLabel.fill = fillSubtotal;
    secTotalLabel.border = borderDouble;

    const cellG = dataSheet.getCell(`G${currentRow}`);
    cellG.value = secOrigQty;
    cellG.font = fontTotalCell;
    cellG.alignment = { horizontal: 'right', vertical: 'middle' };
    cellG.numFmt = '#,##0.00';
    cellG.fill = fillSubtotal;
    cellG.border = borderDouble;

    const cellH = dataSheet.getCell(`H${currentRow}`);
    cellH.value = secRetQty;
    cellH.font = fontTotalCell;
    cellH.alignment = { horizontal: 'right', vertical: 'middle' };
    cellH.numFmt = '#,##0.00';
    cellH.fill = fillSubtotal;
    cellH.border = borderDouble;

    ['I', 'J', 'K'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = fillSubtotal; cell.border = borderDouble;
    });

    const cellL = dataSheet.getCell(`L${currentRow}`);
    cellL.value = secTaxable;
    cellL.font = fontTotalCell;
    cellL.alignment = { horizontal: 'right', vertical: 'middle' };
    cellL.numFmt = '"₹" #,##0.00';
    cellL.fill = fillSubtotal;
    cellL.border = borderDouble;

    const cellM = dataSheet.getCell(`M${currentRow}`);
    cellM.value = '-'; cellM.alignment = { horizontal: 'center', vertical: 'middle' };
    cellM.fill = fillSubtotal; cellM.border = borderDouble;

    const cellN = dataSheet.getCell(`N${currentRow}`);
    cellN.value = secGst;
    cellN.font = fontTotalCell;
    cellN.alignment = { horizontal: 'right', vertical: 'middle' };
    cellN.numFmt = '"₹" #,##0.00';
    cellN.fill = fillSubtotal;
    cellN.border = borderDouble;

    const cellO = dataSheet.getCell(`O${currentRow}`);
    cellO.value = secTotal;
    cellO.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
    cellO.alignment = { horizontal: 'right', vertical: 'middle' };
    cellO.numFmt = '"₹" #,##0.00';
    cellO.fill = fillGrandTotal;
    cellO.border = borderDouble;

    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    // Inward Vouchers Log
    const inwards = gp.inwards || [];
    if (inwards.length > 0) {
      currentRow++;
      dataSheet.mergeCells(`A${currentRow}:O${currentRow}`);
      const invHead = dataSheet.getCell(`A${currentRow}`);
      invHead.value = `INWARD RECEIPT VOUCHERS AUDIT LOG FOR ${gpNo} (${inwards.length} RECEIPT VOUCHERS)`;
      invHead.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      invHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      invHead.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      dataSheet.getRow(currentRow).height = 22;
      currentRow++;

      dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
      dataSheet.getCell(`A${currentRow}`).value = 'Inward Voucher No. & Date';
      dataSheet.mergeCells(`E${currentRow}:H${currentRow}`);
      dataSheet.getCell(`E${currentRow}`).value = 'Gate Entry & Invoice No.';
      dataSheet.mergeCells(`I${currentRow}:J${currentRow}`);
      dataSheet.getCell(`I${currentRow}`).value = 'Subtotal Taxable (₹)';
      dataSheet.mergeCells(`K${currentRow}:L${currentRow}`);
      dataSheet.getCell(`K${currentRow}`).value = 'Total GST (₹)';
      dataSheet.mergeCells(`M${currentRow}:N${currentRow}`);
      dataSheet.getCell(`M${currentRow}`).value = 'Grand Total (₹)';
      dataSheet.getCell(`O${currentRow}`).value = 'Created & Approved By';

      ['A', 'E', 'I', 'K', 'M', 'O'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        cell.alignment = { horizontal: ['I','K','M'].includes(c) ? 'right' : 'center', vertical: 'middle' };
        cell.border = borderThin;
      });
      dataSheet.getRow(currentRow).height = 20;
      currentRow++;

      inwards.forEach(mi => {
        dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
        dataSheet.getCell(`A${currentRow}`).value = `${mi.inwardNumber} (${safeFormatDate(mi.inwardDate)})`;
        dataSheet.mergeCells(`E${currentRow}:H${currentRow}`);
        dataSheet.getCell(`E${currentRow}`).value = `GE: ${mi.gateEntryNumber} | Inv: ${mi.challanInvoiceNumber}`;
        dataSheet.mergeCells(`I${currentRow}:J${currentRow}`);
        const cI = dataSheet.getCell(`I${currentRow}`);
        cI.value = Number(mi.subtotal) || 0;
        cI.numFmt = '"₹" #,##0.00';
        dataSheet.mergeCells(`K${currentRow}:L${currentRow}`);
        const cK = dataSheet.getCell(`K${currentRow}`);
        cK.value = Number(mi.totalGst) || 0;
        cK.numFmt = '"₹" #,##0.00';
        dataSheet.mergeCells(`M${currentRow}:N${currentRow}`);
        const cM = dataSheet.getCell(`M${currentRow}`);
        cM.value = Number(mi.grandTotal) || 0;
        cM.numFmt = '"₹" #,##0.00';
        dataSheet.getCell(`O${currentRow}`).value = `Created: ${mi.createdBy} | Appr: ${mi.approvedBy}`;

        ['A', 'E', 'I', 'K', 'M', 'O'].forEach(c => {
          const cell = dataSheet.getCell(`${c}${currentRow}`);
          cell.font = fontDataCell;
          cell.border = borderThin;
          cell.alignment = { horizontal: ['I','K','M'].includes(c) ? 'right' : 'left', vertical: 'middle' };
        });
        dataSheet.getRow(currentRow).height = 18;
        currentRow++;
      });
    }

    currentRow += 2;
  });

  // Grand Summary Banner Row
  dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const grandLabel = dataSheet.getCell(`A${currentRow}`);
  grandLabel.value = `GRAND TOTAL (ALL ${records.length} CLOSED GATE PASS SECTIONS):`;
  grandLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  grandLabel.alignment = { horizontal: 'right', vertical: 'middle' };
  grandLabel.fill = fillSecBanner;

  const gCellG = dataSheet.getCell(`G${currentRow}`);
  gCellG.value = grandOrigQty;
  gCellG.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellG.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellG.numFmt = '#,##0.00';
  gCellG.fill = fillSecBanner;

  const gCellH = dataSheet.getCell(`H${currentRow}`);
  gCellH.value = grandRetQty;
  gCellH.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellH.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellH.numFmt = '#,##0.00';
  gCellH.fill = fillSecBanner;

  ['I', 'J', 'K'].forEach(c => {
    const cell = dataSheet.getCell(`${c}${currentRow}`);
    cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = fillSecBanner;
  });

  const gCellL = dataSheet.getCell(`L${currentRow}`);
  gCellL.value = grandTaxable;
  gCellL.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellL.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellL.numFmt = '"₹" #,##0.00';
  gCellL.fill = fillSecBanner;

  const gCellM = dataSheet.getCell(`M${currentRow}`);
  gCellM.value = '-'; gCellM.alignment = { horizontal: 'center', vertical: 'middle' };
  gCellM.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellM.fill = fillSecBanner;

  const gCellN = dataSheet.getCell(`N${currentRow}`);
  gCellN.value = grandGst;
  gCellN.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellN.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellN.numFmt = '"₹" #,##0.00';
  gCellN.fill = fillSecBanner;

  const gCellO = dataSheet.getCell(`O${currentRow}`);
  gCellO.value = grandAmount;
  gCellO.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellO.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellO.numFmt = '"₹" #,##0.00';
  gCellO.fill = fillSecBanner;

  dataSheet.getRow(currentRow).height = 25;
};


/**
 * Client-Side ExcelJS Workbook Generator
 */
const generateClientExcel = async ({ reportType, reportTitle, filters = {}, records = [], kpis = {} }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Maruti Denim ERP System';
  workbook.created = new Date();

  const istNow = safeFormatDate(new Date(), 'dd/MM/yyyy, hh:mm a');

  // SHEET 1: Report Summary
  const summarySheet = workbook.addWorksheet('Report Summary', { views: [{ showGridLines: true }] });

  summarySheet.mergeCells('A1:F1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.mergeCells('A2:F2');
  const subTitleCell = summarySheet.getCell('A2');
  subTitleCell.value = `${reportTitle.toUpperCase()} - MANAGEMENT MIS REPORT`;
  subTitleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1E293B' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 24;

  summarySheet.addRow([]);

  summarySheet.addRow(['Report Title:', reportTitle]);
  summarySheet.addRow(['Generated Date & Time (IST):', istNow]);
  summarySheet.addRow(['Report Period:', `${filters.fromDate || 'Beginning'} to ${filters.toDate || 'Present'}`]);
  summarySheet.addRow(['Total Records:', records.length]);
  summarySheet.addRow(['Generated By:', 'Admin System']);

  for (let r = 4; r <= 8; r++) {
    const row = summarySheet.getRow(r);
    row.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
    row.getCell(2).font = { bold: true, color: { argb: 'FF0F2A47' } };
  }

  summarySheet.addRow([]);

  summarySheet.addRow(['APPLIED FILTERS SUMMARY']).font = { bold: true, size: 11, color: { argb: 'FF0F2A47' } };
  const filterKeys = Object.keys(filters).filter(k => filters[k] && filters[k] !== 'All' && k !== 'reportType' && k !== 'page' && k !== 'pageSize');
  if (filterKeys.length === 0) {
    summarySheet.addRow(['Filters:', 'None (All Records Included)']);
  } else {
    filterKeys.forEach(k => {
      summarySheet.addRow([`${k}:`, String(filters[k])]);
    });
  }

  summarySheet.addRow([]);

  summarySheet.addRow(['KEY PERFORMANCE INDICATORS (KPIs)']).font = { bold: true, size: 11, color: { argb: 'FF0F2A47' } };
  Object.entries(kpis).forEach(([kpiKey, kpiVal]) => {
    const label = kpiKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    summarySheet.addRow([label, typeof kpiVal === 'number' ? kpiVal : String(kpiVal)]);
  });

  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 40;
  summarySheet.getColumn(3).width = 24;
  summarySheet.getColumn(4).width = 24;
  summarySheet.getColumn(5).width = 24;
  summarySheet.getColumn(6).width = 32;


  // SHEET 2: Data Sheet
  if (reportType === 'gate-pass') {
    buildSectionWiseGatePassSheet(workbook, reportTitle, records);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  if (reportType === 'party-summary') {
    buildSectionWisePartySummarySheet(workbook, reportTitle, records);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  if (reportType === 'gate-pass-closure') {
    buildSectionWiseClosureSheet(workbook, reportTitle, records);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  const dataSheetName = (reportTitle || 'Data').substring(0, 30);
  const dataSheet = workbook.addWorksheet(dataSheetName, { views: [{ state: 'frozen', ySplit: 1, showGridLines: true }] });

  if (!records || records.length === 0) {
    dataSheet.addRow(['No records found for the selected filters.']).font = { italic: true, color: { argb: 'FF64748B' } };
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  let columnsConfig = [];

  switch (reportType) {
    case 'gate-pass':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'Gate Pass Date', key: 'date', width: 14, align: 'center', isDate: true },
        { header: 'Party / Company Name', key: 'companyName', width: 28, align: 'left' },
        { header: 'Purpose', key: 'purpose', width: 22, align: 'left' },
        { header: 'Material Type', key: 'materialType', width: 14, align: 'center' },
        { header: 'Total Qty', key: 'totalQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Ret. Qty', key: 'returnableQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Rec. Qty', key: 'returnedQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Bal. Qty', key: 'balanceReturnableQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Rate (₹)', key: 'rate', width: 12, align: 'right', numFmt: '"₹" #,##0.00' },
        { header: 'Taxable Amt (₹)', key: 'taxableAmount', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'GST %', key: 'gstPercentage', width: 10, align: 'center', numFmt: '0.0"%"' },
        { header: 'GST Amt (₹)', key: 'gstAmount', width: 14, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 16, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'GP Status', key: 'gatePassStatus', width: 14, align: 'center' },
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' },
        { header: 'Remarks', key: 'remarks', width: 25, align: 'left' }
      ];
      break;

    case 'material-inward':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Inward No.', key: 'inwardNumber', width: 16, align: 'center' },
        { header: 'Inward Date & Time', key: 'inwardDate', width: 18, align: 'center', isDate: true, withTime: true },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'Gate Entry No.', key: 'gateEntryNumber', width: 16, align: 'center' },
        { header: 'Party / Company Name', key: 'partyName', width: 26, align: 'left' },
        { header: 'Rec. Qty', key: 'receivedQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Rate (₹)', key: 'rate', width: 12, align: 'right', numFmt: '"₹" #,##0.00' },
        { header: 'Taxable Amt (₹)', key: 'subtotal', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'GST %', key: 'gstPercentage', width: 10, align: 'center', numFmt: '0.0"%"' },
        { header: 'Total GST (₹)', key: 'totalGst', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 16, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Remarks', key: 'remarks', width: 22, align: 'left' }
      ];
      break;

    case 'returnable-material':
    case 'pending-returns':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'Gate Pass Date', key: 'date', width: 14, align: 'center', isDate: true },
        { header: 'Party / Company Name', key: 'companyName', width: 26, align: 'left' },
        { header: 'Item Description', key: 'itemName', width: 24, align: 'left' },
        { header: 'Orig. Qty', key: 'originalQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Ret. Qty', key: 'returnableQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Rec. Qty', key: 'returnedQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Pend. Qty', key: 'pendingQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        ...(reportType === 'pending-returns' ? [{ header: 'Days Pending', key: 'daysPending', width: 14, align: 'right', numFmt: '#,##0' }] : []),
        { header: 'Rate (₹)', key: 'rate', width: 12, align: 'right', numFmt: '"₹" #,##0.00' },
        { header: 'Taxable Amt (₹)', key: 'taxableAmount', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'GST %', key: 'gstPercentage', width: 10, align: 'center', numFmt: '0.0"%"' },
        { header: 'GST Amt (₹)', key: 'gstAmount', width: 14, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 16, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' },
        { header: 'Remarks', key: 'remarks', width: 22, align: 'left' }
      ];
      break;

    case 'gate-pass-closure':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'Gate Pass Date', key: 'date', width: 14, align: 'center', isDate: true },
        { header: 'Party / Company Name', key: 'companyName', width: 26, align: 'left' },
        { header: 'Orig. Returnable Qty', key: 'originalReturnableQuantity', width: 18, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Total Returned Qty', key: 'totalReturnedQuantity', width: 18, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Final Inward No.', key: 'finalInwardNumber', width: 18, align: 'center' },
        { header: 'Days to Close', key: 'totalDaysToClose', width: 14, align: 'right', numFmt: '#,##0' },
        { header: 'Rate (₹)', key: 'rate', width: 12, align: 'right', numFmt: '"₹" #,##0.00' },
        { header: 'Taxable Amt (₹)', key: 'taxableAmount', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'GST %', key: 'gstPercentage', width: 10, align: 'center', numFmt: '0.0"%"' },
        { header: 'GST Amt (₹)', key: 'gstAmount', width: 14, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 16, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' }
      ];
      break;

    case 'party-summary':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Party / Company Name', key: 'partyName', width: 28, align: 'left' },
        { header: 'Total Gate Passes', key: 'totalGatePasses', width: 16, align: 'right', numFmt: '#,##0', isSum: true },
        { header: 'Open Passes', key: 'openGatePasses', width: 14, align: 'right', numFmt: '#,##0', isSum: true },
        { header: 'Closed Passes', key: 'closedGatePasses', width: 14, align: 'right', numFmt: '#,##0', isSum: true },
        { header: 'Returnable Qty', key: 'totalReturnableQuantity', width: 16, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Returned Qty', key: 'totalReturnedQuantity', width: 16, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Pending Qty', key: 'totalPendingQuantity', width: 16, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Taxable Amt (₹)', key: 'taxableAmount', width: 16, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'GST %', key: 'gstPercentage', width: 10, align: 'center', numFmt: '0.0"%"' },
        { header: 'GST Amt (₹)', key: 'totalGst', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Grand Value (₹)', key: 'totalGrandTotal', width: 18, align: 'right', numFmt: '"₹" #,##0.00', isSum: true }
      ];
      break;

    case 'combined':
    default:
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'GP Date', key: 'date', width: 14, align: 'center', isDate: true },
        { header: 'Party / Company Name', key: 'partyName', width: 26, align: 'left' },
        { header: 'Item Description', key: 'itemDescription', width: 24, align: 'left' },
        { header: 'Ret. Qty', key: 'returnableQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Inward No.', key: 'inwardNumber', width: 16, align: 'center' },
        { header: 'Rec. Qty', key: 'receivedQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Bal. Qty', key: 'balanceQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Rate (₹)', key: 'rate', width: 12, align: 'right', numFmt: '"₹" #,##0.00' },
        { header: 'Taxable Amt (₹)', key: 'taxableAmount', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'GST %', key: 'gstPercentage', width: 10, align: 'center', numFmt: '0.0"%"' },
        { header: 'GST Amt (₹)', key: 'gstAmount', width: 14, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 16, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' }
      ];
      break;
  }

  dataSheet.columns = columnsConfig.map(c => ({
    header: c.header,
    key: c.key,
    width: c.width
  }));

  const headerRow = dataSheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
    cell.alignment = { horizontal: columnsConfig[colNumber - 1]?.align || 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F2A47' } },
      left: { style: 'thin', color: { argb: 'FF1E293B' } },
      bottom: { style: 'medium', color: { argb: 'FF0F2A47' } },
      right: { style: 'thin', color: { argb: 'FF1E293B' } }
    };
  });

  const lastColLetter = String.fromCharCode(64 + columnsConfig.length);
  dataSheet.autoFilter = `A1:${lastColLetter}1`;

  records.forEach((rec, idx) => {
    const rowObj = { srNo: idx + 1 };
    columnsConfig.forEach(col => {
      if (col.key === 'srNo') return;
      let val = rec[col.key];
      if (col.isDate && val) {
        val = safeFormatDate(val, col.withTime ? 'dd/MM/yyyy, hh:mm a' : 'dd/MM/yyyy');
      }
      rowObj[col.key] = val ?? '-';
    });

    const row = dataSheet.addRow(rowObj);
    row.height = 20;

    row.eachCell((cell, colNumber) => {
      const colDef = columnsConfig[colNumber - 1];
      cell.alignment = { horizontal: colDef?.align || 'left', vertical: 'middle' };
      if (colDef?.numFmt && typeof cell.value === 'number') {
        cell.numFmt = colDef.numFmt;
      }
      const isEven = (idx + 1) % 2 === 0;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  const totalRowData = { srNo: 'TOTAL' };
  columnsConfig.forEach(c => {
    if (c.key === 'srNo') return;
    if (c.isSum) {
      totalRowData[c.key] = records.reduce((acc, r) => acc + (Number(r[c.key]) || 0), 0);
    } else {
      totalRowData[c.key] = '';
    }
  });

  const totalRow = dataSheet.addRow(totalRowData);
  totalRow.height = 24;
  totalRow.eachCell((cell, colNumber) => {
    const colDef = columnsConfig[colNumber - 1];
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
    cell.alignment = { horizontal: colDef?.align || 'left', vertical: 'middle' };
    if (colDef?.numFmt && typeof cell.value === 'number') {
      cell.numFmt = colDef.numFmt;
    }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F2A47' } },
      bottom: { style: 'double', color: { argb: 'FF0F2A47' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
