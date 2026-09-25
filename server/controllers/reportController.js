const reportService = require('../services/reportService');
const excelService = require('../services/excelService');

/**
 * Get distinct party names for filter dropdown
 */
exports.getParties = async (req, res) => {
  try {
    const parties = await reportService.getDistinctParties();
    res.status(200).json({ success: true, data: parties });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch parties', error: error.message });
  }
};

/**
 * Helper: Paginate records for preview UI
 */
const paginateRecords = (records, page = 1, pageSize = 25) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 25);
  const startIndex = (p - 1) * ps;
  const paginated = records.slice(startIndex, startIndex + ps);

  return {
    items: paginated,
    pagination: {
      totalItems: records.length,
      currentPage: p,
      pageSize: ps,
      totalPages: Math.ceil(records.length / ps) || 1
    }
  };
};

/**
 * 1. Gate Pass Register Report API
 */
exports.getGatePassRegister = async (req, res) => {
  try {
    const result = await reportService.getGatePassRegisterReport(req.query);
    const paginated = paginateRecords(result.records, req.query.page, req.query.pageSize);
    res.status(200).json({
      success: true,
      reportType: 'gate-pass',
      title: 'Gate Pass Register',
      data: paginated.items,
      pagination: paginated.pagination,
      kpis: result.kpis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate Gate Pass Register report', error: error.message });
  }
};

/**
 * 2. Material Inward Register Report API
 */
exports.getMaterialInwardRegister = async (req, res) => {
  try {
    const result = await reportService.getMaterialInwardRegisterReport(req.query);
    const paginated = paginateRecords(result.records, req.query.page, req.query.pageSize);
    res.status(200).json({
      success: true,
      reportType: 'material-inward',
      title: 'Material Inward Register',
      data: paginated.items,
      pagination: paginated.pagination,
      kpis: result.kpis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate Material Inward Register report', error: error.message });
  }
};

/**
 * 3. Returnable Material Report API
 */
exports.getReturnableMaterialReport = async (req, res) => {
  try {
    const result = await reportService.getReturnableMaterialReport(req.query);
    const paginated = paginateRecords(result.records, req.query.page, req.query.pageSize);
    res.status(200).json({
      success: true,
      reportType: 'returnable-material',
      title: 'Returnable Material Report',
      data: paginated.items,
      pagination: paginated.pagination,
      kpis: result.kpis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate Returnable Material report', error: error.message });
  }
};

/**
 * 4. Pending Return Report API
 */
exports.getPendingReturnReport = async (req, res) => {
  try {
    const result = await reportService.getPendingReturnReport(req.query);
    const paginated = paginateRecords(result.records, req.query.page, req.query.pageSize);
    res.status(200).json({
      success: true,
      reportType: 'pending-returns',
      title: 'Pending Return Report',
      data: paginated.items,
      pagination: paginated.pagination,
      kpis: result.kpis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate Pending Return report', error: error.message });
  }
};

/**
 * 5. Gate Pass Closure Report API
 */
exports.getGatePassClosureReport = async (req, res) => {
  try {
    const result = await reportService.getGatePassClosureReport(req.query);
    const paginated = paginateRecords(result.records, req.query.page, req.query.pageSize);
    res.status(200).json({
      success: true,
      reportType: 'gate-pass-closure',
      title: 'Gate Pass Closure Report',
      data: paginated.items,
      pagination: paginated.pagination,
      kpis: result.kpis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate Gate Pass Closure report', error: error.message });
  }
};

/**
 * 6. Party-wise Summary Report API
 */
exports.getPartySummaryReport = async (req, res) => {
  try {
    const result = await reportService.getPartySummaryReport(req.query);
    const paginated = paginateRecords(result.records, req.query.page, req.query.pageSize);
    res.status(200).json({
      success: true,
      reportType: 'party-summary',
      title: 'Party-wise Summary Report',
      data: paginated.items,
      pagination: paginated.pagination,
      kpis: result.kpis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate Party Summary report', error: error.message });
  }
};

/**
 * 7. Combined Gate Pass & Return Report API
 */
exports.getCombinedReport = async (req, res) => {
  try {
    const result = await reportService.getCombinedReport(req.query);
    const paginated = paginateRecords(result.records, req.query.page, req.query.pageSize);
    res.status(200).json({
      success: true,
      reportType: 'combined',
      title: 'Combined Gate Pass & Return Report',
      data: paginated.items,
      pagination: paginated.pagination,
      kpis: result.kpis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate Combined report', error: error.message });
  }
};

/**
 * Export Excel Endpoint
 */
exports.exportExcel = async (req, res) => {
  try {
    const { reportType = 'gate-pass' } = req.query;
    let reportData = null;
    let reportTitle = 'Management Report';

    switch (reportType) {
      case 'gate-pass':
        reportTitle = 'Gate Pass Register Report';
        reportData = await reportService.getGatePassRegisterReport(req.query);
        break;
      case 'material-inward':
        reportTitle = 'Material Inward Register Report';
        reportData = await reportService.getMaterialInwardRegisterReport(req.query);
        break;
      case 'returnable-material':
        reportTitle = 'Returnable Material Report';
        reportData = await reportService.getReturnableMaterialReport(req.query);
        break;
      case 'pending-returns':
        reportTitle = 'Pending Return Report';
        reportData = await reportService.getPendingReturnReport(req.query);
        break;
      case 'gate-pass-closure':
        reportTitle = 'Gate Pass Closure Report';
        reportData = await reportService.getGatePassClosureReport(req.query);
        break;
      case 'party-summary':
        reportTitle = 'Party-wise Summary Report';
        reportData = await reportService.getPartySummaryReport(req.query);
        break;
      case 'combined':
      default:
        reportTitle = 'Combined Gate Pass & Return Report';
        reportData = await reportService.getCombinedReport(req.query);
        break;
    }

    const buffer = await excelService.generateReportExcel({
      reportType,
      reportTitle,
      filters: req.query,
      records: reportData.records || [],
      kpis: reportData.kpis || {}
    });

    const fromStr = req.query.fromDate || 'Start';
    const toStr = req.query.toDate || 'Present';
    const filename = `MarutiDenim_${reportType.replace(/-/g, '_')}_Report_${fromStr}_to_${toStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export Excel Error:', error);
    res.status(500).json({ success: false, message: 'Unable to generate Excel export', error: error.message });
  }
};
