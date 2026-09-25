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
          remarks: items.map(i => i.remarks).filter(Boolean).join('; ') || '-'
        };
      });

      const paginated = paginate(records, params.page, params.pageSize);
      const kpis = {
        totalGatePasses: records.length,
        openCount: records.filter(r => r.gatePassStatus === 'OPEN').length,
        closedCount: records.filter(r => r.gatePassStatus === 'CLOSED').length,
        pendingReturnCount: records.filter(r => r.returnStatus === 'PENDING' || r.returnStatus === 'PARTIALLY_RETURNED').length,
        totalQuantity: records.reduce((acc, r) => acc + r.totalQuantity, 0)
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

      const records = [];

      for (const gp of filteredGps) {
        const gpInwards = rawMis.filter(mi => mi.gatePassNumber === gp.gatePassNumber || mi.gatePassId === gp._id);

        for (const gpItem of (gp.items || [])) {
          const origQty = Number(gpItem.quantity) || 0;
          const retQty = gpItem.returnable !== false ? origQty : 0;

          if (gpInwards.length === 0) {
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
              returnStatus: gp.returnStatus || 'PENDING'
            });
          } else {
            let runningReceived = 0;
            for (const inv of gpInwards) {
              const matchedInwardItem = (inv.items || []).find(it => it.gatePassItemId?.toString() === gpItem._id?.toString() || it.serialNumber === gpItem.serialNumber);
              const thisRecQty = matchedInwardItem ? (Number(matchedInwardItem.receivedQuantity) || 0) : 0;
              runningReceived += thisRecQty;
              const balanceQty = Math.max(0, retQty - runningReceived);

              const thisStatus = balanceQty === 0 
                ? 'FULLY_RETURNED' 
                : (runningReceived > 0 ? 'PARTIALLY_RETURNED' : 'PENDING');

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
        totalBalanceQuantity: records.reduce((acc, r) => acc + r.balanceQuantity, 0)
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

  // SHEET 2: Data Sheet
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
        { header: 'Item Count', key: 'itemCount', width: 12, align: 'right', numFmt: '#,##0' },
        { header: 'Total Qty', key: 'totalQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Returnable Qty', key: 'returnableQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Returned Qty', key: 'returnedQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Balance Qty', key: 'balanceReturnableQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Gate Pass Status', key: 'gatePassStatus', width: 14, align: 'center' },
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' },
        { header: 'Created By', key: 'createdBy', width: 14, align: 'left' },
        { header: 'Created Date', key: 'createdAt', width: 16, align: 'center', isDate: true, withTime: true },
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
        { header: 'Challan / Invoice No.', key: 'challanInvoiceNumber', width: 20, align: 'left' },
        { header: 'Party / Company Name', key: 'partyName', width: 26, align: 'left' },
        { header: 'Item Count', key: 'itemCount', width: 12, align: 'right', numFmt: '#,##0' },
        { header: 'Rec. Qty', key: 'receivedQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Subtotal (₹)', key: 'subtotal', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'CGST (₹)', key: 'totalCgst', width: 14, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'SGST (₹)', key: 'totalSgst', width: 14, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'IGST (₹)', key: 'totalIgst', width: 14, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Total GST (₹)', key: 'totalGst', width: 15, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 16, align: 'right', numFmt: '"₹" #,##0.00', isSum: true },
        { header: 'Created By', key: 'createdBy', width: 14, align: 'left' },
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
        { header: 'Original Qty', key: 'originalQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Returnable Qty', key: 'returnableQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Returned Qty', key: 'returnedQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Pending Qty', key: 'pendingQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        ...(reportType === 'pending-returns' ? [{ header: 'Days Pending', key: 'daysPending', width: 14, align: 'right', numFmt: '#,##0' }] : []),
        { header: 'Last Inward Date', key: 'lastInwardDate', width: 16, align: 'center', isDate: true, withTime: true },
        { header: 'Gate Pass Status', key: 'gatePassStatus', width: 14, align: 'center' },
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
        { header: 'Final Inward Date', key: 'finalInwardDate', width: 16, align: 'center', isDate: true, withTime: true },
        { header: 'Closure Date', key: 'closureDate', width: 16, align: 'center', isDate: true, withTime: true },
        { header: 'Total Days to Close', key: 'totalDaysToClose', width: 16, align: 'right', numFmt: '#,##0' },
        { header: 'Gate Pass Status', key: 'gatePassStatus', width: 14, align: 'center' },
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
        { header: 'Oldest Pending Date', key: 'oldestPendingDate', width: 18, align: 'center', isDate: true },
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
        { header: 'Original Qty', key: 'originalQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Returnable Qty', key: 'returnableQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Inward No.', key: 'inwardNumber', width: 16, align: 'center' },
        { header: 'Inward Date', key: 'inwardDate', width: 16, align: 'center', isDate: true, withTime: true },
        { header: 'Received Qty', key: 'receivedQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Balance Qty', key: 'balanceQuantity', width: 14, align: 'right', numFmt: '#,##0.00', isSum: true },
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
