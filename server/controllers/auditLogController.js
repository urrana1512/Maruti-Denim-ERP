const { resolveModels } = require('../config/connectionManager');

// GET Employee "My Activity" Log
const getMyActivity = async (req, res) => {
  try {
    const { AuditLog } = resolveModels(req);
    const user = req.user;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { module, action, startDate, endDate, search } = req.query;

    // Strict ownership filtering: user sees ONLY their own events
    const query = {
      companyCode: req.companyCode,
      userId: user._id
    };

    if (module && module !== 'ALL') {
      query.module = module;
    }

    if (action && action !== 'ALL') {
      query.action = action;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = eDate;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: searchRegex },
        { action: searchRegex },
        { entityId: searchRegex }
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching employee activity:', error);
    res.status(500).json({ success: false, message: 'Server error fetching activity logs.' });
  }
};

// GET Company Admin Audit Logs (Company-Wide)
const getCompanyAuditLogs = async (req, res) => {
  try {
    const { AuditLog } = resolveModels(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { user, role, module, action, status, startDate, endDate, search } = req.query;

    const query = {
      companyCode: req.companyCode
    };

    if (user && user !== 'ALL') {
      query.userName = new RegExp(user.trim(), 'i');
    }

    if (role && role !== 'ALL') {
      query.userRole = new RegExp(role.trim(), 'i');
    }

    if (module && module !== 'ALL') {
      query.module = module;
    }

    if (action && action !== 'ALL') {
      query.action = action;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = eDate;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userName: searchRegex },
        { userEmail: searchRegex },
        { description: searchRegex },
        { action: searchRegex },
        { entityId: searchRegex }
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching company audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching audit logs.' });
  }
};

// GET Record Audit Timeline (e.g. Gate Pass GP-1025)
const getRecordTimeline = async (req, res) => {
  try {
    const { AuditLog } = resolveModels(req);
    const { module, entityId } = req.params;

    const query = {
      companyCode: req.companyCode,
      $or: [
        { entityId: entityId },
        { targetId: entityId }
      ]
    };

    if (module && module !== 'ALL') {
      query.module = module.toUpperCase();
    }

    const timeline = await AuditLog.find(query)
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, timeline });
  } catch (error) {
    console.error('Error fetching record timeline:', error);
    res.status(500).json({ success: false, message: 'Server error fetching record timeline.' });
  }
};

// GET Export Company Audit Logs
const exportAuditLogs = async (req, res) => {
  try {
    const { AuditLog } = resolveModels(req);
    const { format = 'csv', user, role, module, action, status, startDate, endDate, search } = req.query;

    const query = {
      companyCode: req.companyCode
    };

    if (user && user !== 'ALL') query.userName = new RegExp(user.trim(), 'i');
    if (role && role !== 'ALL') query.userRole = new RegExp(role.trim(), 'i');
    if (module && module !== 'ALL') query.module = module;
    if (action && action !== 'ALL') query.action = action;
    if (status && status !== 'ALL') query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = eDate;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userName: searchRegex },
        { description: searchRegex },
        { entityId: searchRegex }
      ];
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();

    if (format === 'json') {
      return res.json({ success: true, logs });
    }

    // CSV format
    const headers = ['Date & Time', 'User', 'Email', 'Role', 'Action', 'Module', 'Description', 'Reference ID', 'Status', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString('en-IN'),
      `"${log.userName || ''}"`,
      `"${log.userEmail || ''}"`,
      `"${log.userRole || ''}"`,
      `"${log.action || ''}"`,
      `"${log.module || ''}"`,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      `"${log.entityId || log.targetId || ''}"`,
      `"${log.status || 'SUCCESS'}"`,
      `"${log.ipAddress || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${req.companyCode}_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

// Immutability rejection for modify attempts
const rejectModification = (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Audit logs are permanent, append-only historical records and cannot be modified or deleted.'
  });
};

module.exports = {
  getMyActivity,
  getCompanyAuditLogs,
  getRecordTimeline,
  exportAuditLogs,
  rejectModification
};
