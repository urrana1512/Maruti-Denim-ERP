const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const GatePassAudit = require('../models/GatePassAudit');
const MasterDataAudit = require('../models/MasterDataAudit');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Build Mongoose Date Range Filter
 */
const buildDateFilter = (range, fromDate, toDate, dateField = 'date') => {
  const dateQuery = {};
  const now = new Date();

  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    dateQuery.$gte = start;
    dateQuery.$lte = end;
  } else if (range === 'yesterday') {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    dateQuery.$gte = start;
    dateQuery.$lte = end;
  } else if (range === 'last7days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    dateQuery.$gte = start;
  } else if (range === 'last30days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    dateQuery.$gte = start;
  } else if (range === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    dateQuery.$gte = start;
  } else if (range === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    dateQuery.$gte = start;
    dateQuery.$lte = end;
  } else if (range === 'thisYear') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    dateQuery.$gte = start;
  } else if (fromDate || toDate) {
    if (fromDate) {
      const start = new Date(fromDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        dateQuery.$gte = start;
      }
    }
    if (toDate) {
      const end = new Date(toDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
    }
  }

  return Object.keys(dateQuery).length > 0 ? { [dateField]: dateQuery } : {};
};

/**
 * Helper to build extra scope filters (Vendor, Department)
 */
const buildScopeFilter = (filters = {}) => {
  const query = {};
  if (filters.vendor && filters.vendor !== 'All') {
    query.companyName = filters.vendor;
  }
  if (filters.department && filters.department !== 'All') {
    query.department = filters.department;
  }
  return query;
};

/**
 * 1. KPI Summary Numbers
 */
const getDashboardSummary = async (filters = {}) => {
  if (!isDbConnected()) {
    return {
      totalGatePasses: 0,
      pendingGatePasses: 0,
      approvedGatePasses: 0,
      materialCurrentlyOut: 0,
      returnablePending: 0,
      partiallyReturned: 0,
      fullyReturnedClosed: 0,
      overdueReturns: 0
    };
  }

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, ...scopeFilter };

  const records = await GatePass.find(matchQuery).lean();

  let totalGatePasses = records.length;
  let pendingGatePasses = 0;
  let approvedGatePasses = 0;
  let materialCurrentlyOut = 0;
  let returnablePending = 0;
  let partiallyReturned = 0;
  let fullyReturnedClosed = 0;
  let overdueReturns = 0;

  const now = new Date();

  records.forEach(gp => {
    // Approval / Status
    if (gp.approvalStatus === 'Approved') {
      approvedGatePasses++;
    } else if (gp.gatePassStatus !== 'CANCELLED') {
      pendingGatePasses++;
    }

    // Return status
    if (gp.gatePassStatus === 'CLOSED' || gp.returnStatus === 'FULLY_RETURNED') {
      fullyReturnedClosed++;
    } else if (gp.returnStatus === 'PARTIALLY_RETURNED') {
      partiallyReturned++;
    } else if (gp.returnStatus === 'PENDING') {
      returnablePending++;
    }

    // Returnable material currently out
    const items = gp.items || [];
    items.forEach(it => {
      if (it.returnable !== false && gp.gatePassStatus !== 'CANCELLED') {
        const qty = Number(it.quantity) || 0;
        const rec = Number(it.receivedQuantity) || 0;
        const pending = Math.max(0, qty - rec);
        materialCurrentlyOut += pending;
      }
    });

    // Overdue calculation (if returnable, pending > 0, not cancelled, and older than 14 days)
    if (
      gp.passType === 'Returnable' &&
      gp.gatePassStatus !== 'CANCELLED' &&
      gp.gatePassStatus !== 'CLOSED' &&
      gp.returnStatus !== 'FULLY_RETURNED'
    ) {
      const gpDate = new Date(gp.date || gp.createdAt);
      const diffDays = Math.floor((now - gpDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 14) {
        overdueReturns++;
      }
    }
  });

  return {
    totalGatePasses,
    pendingGatePasses,
    approvedGatePasses,
    materialCurrentlyOut: Math.round(materialCurrentlyOut * 100) / 100,
    returnablePending,
    partiallyReturned,
    fullyReturnedClosed,
    overdueReturns
  };
};

/**
 * 2. Status Distribution (Donut Chart)
 */
const getStatusDistribution = async (filters = {}) => {
  if (!isDbConnected()) return [];

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, ...scopeFilter };

  const records = await GatePass.find(matchQuery).lean();
  const total = records.length;
  if (total === 0) return [];

  const counts = {
    'Approved': 0,
    'Pending Approval': 0,
    'Partially Returned': 0,
    'Fully Returned / Closed': 0,
    'Open / Pending Return': 0,
    'Cancelled': 0
  };

  records.forEach(gp => {
    if (gp.gatePassStatus === 'CANCELLED') {
      counts['Cancelled']++;
    } else if (gp.approvalStatus === 'Pending') {
      counts['Pending Approval']++;
    } else if (gp.gatePassStatus === 'CLOSED' || gp.returnStatus === 'FULLY_RETURNED') {
      counts['Fully Returned / Closed']++;
    } else if (gp.returnStatus === 'PARTIALLY_RETURNED') {
      counts['Partially Returned']++;
    } else if (gp.returnStatus === 'PENDING') {
      counts['Open / Pending Return']++;
    } else if (gp.approvalStatus === 'Approved') {
      counts['Approved']++;
    }
  });

  const colors = {
    'Approved': '#10B981',             // Emerald green
    'Pending Approval': '#F59E0B',     // Amber
    'Partially Returned': '#3B82F6',    // Blue
    'Fully Returned / Closed': '#059669', // Dark Emerald
    'Open / Pending Return': '#8B5CF6',// Purple
    'Cancelled': '#EF4444'             // Red
  };

  return Object.keys(counts)
    .filter(key => counts[key] > 0)
    .map(key => ({
      name: key,
      value: counts[key],
      percentage: Math.round((counts[key] / total) * 1000) / 10,
      color: colors[key] || '#64748B'
    }));
};

/**
 * 3. Gate Pass Activity Trends (Area/Line Chart)
 */
const getGatePassTrends = async (filters = {}) => {
  if (!isDbConnected()) return [];

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, ...scopeFilter };

  const records = await GatePass.find(matchQuery).sort({ date: 1 }).lean();
  if (records.length === 0) return [];

  // Group by YYYY-MM-DD
  const trendMap = {};

  records.forEach(gp => {
    const d = new Date(gp.date || gp.createdAt);
    const dateStr = d.toISOString().split('T')[0];

    if (!trendMap[dateStr]) {
      trendMap[dateStr] = { date: dateStr, created: 0, approved: 0, closed: 0 };
    }

    trendMap[dateStr].created += 1;
    if (gp.approvalStatus === 'Approved') {
      trendMap[dateStr].approved += 1;
    }
    if (gp.gatePassStatus === 'CLOSED' || gp.returnStatus === 'FULLY_RETURNED') {
      trendMap[dateStr].closed += 1;
    }
  });

  return Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * 4. Material Return Overview Summary & Bar Breakdown
 */
const getMaterialReturnSummary = async (filters = {}) => {
  if (!isDbConnected()) {
    return {
      totalIssued: 0,
      totalReturned: 0,
      totalPending: 0,
      totalOverdue: 0,
      returnPercentage: 0,
      chartData: []
    };
  }

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, passType: 'Returnable', ...scopeFilter };

  const records = await GatePass.find(matchQuery).lean();
  let totalIssued = 0;
  let totalReturned = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  const now = new Date();

  records.forEach(gp => {
    if (gp.gatePassStatus === 'CANCELLED') return;

    const gpDate = new Date(gp.date || gp.createdAt);
    const diffDays = Math.floor((now - gpDate) / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays > 14;

    (gp.items || []).forEach(it => {
      if (it.returnable !== false) {
        const qty = Number(it.quantity) || 0;
        const rec = Number(it.receivedQuantity) || 0;
        const pend = Math.max(0, qty - rec);

        totalIssued += qty;
        totalReturned += rec;
        totalPending += pend;
        if (isOverdue && pend > 0) {
          totalOverdue += pend;
        }
      }
    });
  });

  totalIssued = Math.round(totalIssued * 100) / 100;
  totalReturned = Math.round(totalReturned * 100) / 100;
  totalPending = Math.round(totalPending * 100) / 100;
  totalOverdue = Math.round(totalOverdue * 100) / 100;
  const returnPercentage = totalIssued > 0 ? Math.round((totalReturned / totalIssued) * 1000) / 10 : 0;

  return {
    totalIssued,
    totalReturned,
    totalPending,
    totalOverdue,
    returnPercentage,
    chartData: [
      {
        category: 'Material Quantities',
        Issued: totalIssued,
        Returned: totalReturned,
        Pending: totalPending,
        Overdue: totalOverdue
      }
    ]
  };
};

/**
 * 5. Return Trends over Time (Line/Bar Chart)
 */
const getReturnTrends = async (filters = {}) => {
  if (!isDbConnected()) return [];

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, ...scopeFilter };

  const inwards = await MaterialInward.find(matchQuery).sort({ inwardDate: 1 }).lean();
  if (inwards.length === 0) return [];

  const trendMap = {};

  inwards.forEach(mi => {
    const d = new Date(mi.inwardDate || mi.createdAt);
    const dateStr = d.toISOString().split('T')[0];

    if (!trendMap[dateStr]) {
      trendMap[dateStr] = { date: dateStr, returnedQuantity: 0, grandTotal: 0, receiptsCount: 0 };
    }

    const recQty = (mi.items || []).reduce((sum, it) => sum + (Number(it.receivedQuantity) || 0), 0);
    trendMap[dateStr].returnedQuantity += recQty;
    trendMap[dateStr].grandTotal += Number(mi.grandTotal) || 0;
    trendMap[dateStr].receiptsCount += 1;
  });

  return Object.values(trendMap).map(row => ({
    ...row,
    returnedQuantity: Math.round(row.returnedQuantity * 100) / 100,
    grandTotal: Math.round(row.grandTotal * 100) / 100
  })).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * 6. Overdue Returns List (Table)
 */
const getOverdueReturns = async (filters = {}, limit = 10) => {
  if (!isDbConnected()) return [];

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = {
    ...dateFilter,
    ...scopeFilter,
    passType: 'Returnable',
    gatePassStatus: { $ne: 'CANCELLED' },
    returnStatus: { $in: ['PENDING', 'PARTIALLY_RETURNED'] }
  };

  const records = await GatePass.find(matchQuery).sort({ date: 1 }).lean();
  const now = new Date();

  const overdueList = [];

  records.forEach(gp => {
    const gpDate = new Date(gp.date || gp.createdAt);
    const diffDays = Math.floor((now - gpDate) / (1000 * 60 * 60 * 24));
    
    // Check if open > 7 days or specifically overdue > 14 days
    if (diffDays >= 7) {
      const items = gp.items || [];
      const totalQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
      const returnedQty = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);
      const pendingQty = Math.max(0, totalQty - returnedQty);

      if (pendingQty > 0) {
        const itemNames = items.map(i => i.description).filter(Boolean).join(', ');

        overdueList.push({
          _id: gp._id,
          gatePassNumber: gp.gatePassNumber,
          vendorName: gp.companyName,
          itemDescription: itemNames || 'Returnable Materials',
          issuedQuantity: totalQty,
          returnedQuantity: returnedQty,
          pendingQuantity: pendingQty,
          date: gp.date || gp.createdAt,
          dueDate: new Date(gpDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          daysOverdue: diffDays,
          returnStatus: gp.returnStatus || 'PENDING',
          approvalStatus: gp.approvalStatus || 'Pending'
        });
      }
    }
  });

  // Sort by daysOverdue descending
  overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return overdueList.slice(0, limit);
};

/**
 * 7. Vendor Analytics
 */
const getVendorAnalytics = async (filters = {}, limit = 10) => {
  if (!isDbConnected()) return [];

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, ...scopeFilter };

  const records = await GatePass.find(matchQuery).lean();
  const vendorMap = {};

  records.forEach(gp => {
    const vName = gp.companyName || 'Unknown Vendor';
    if (!vendorMap[vName]) {
      vendorMap[vName] = {
        vendorName: vName,
        gatePassCount: 0,
        totalQuantity: 0,
        returnedQuantity: 0,
        pendingQuantity: 0
      };
    }

    vendorMap[vName].gatePassCount += 1;
    (gp.items || []).forEach(it => {
      const qty = Number(it.quantity) || 0;
      const rec = Number(it.receivedQuantity) || 0;
      vendorMap[vName].totalQuantity += qty;
      vendorMap[vName].returnedQuantity += rec;
      vendorMap[vName].pendingQuantity += Math.max(0, qty - rec);
    });
  });

  return Object.values(vendorMap)
    .map(v => ({
      ...v,
      totalQuantity: Math.round(v.totalQuantity * 100) / 100,
      returnedQuantity: Math.round(v.returnedQuantity * 100) / 100,
      pendingQuantity: Math.round(v.pendingQuantity * 100) / 100
    }))
    .sort((a, b) => b.gatePassCount - a.gatePassCount)
    .slice(0, limit);
};

/**
 * 8. Item / Material Analytics
 */
const getItemAnalytics = async (filters = {}, limit = 10) => {
  if (!isDbConnected()) return [];

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, ...scopeFilter };

  const records = await GatePass.find(matchQuery).lean();
  const itemMap = {};

  records.forEach(gp => {
    (gp.items || []).forEach(it => {
      const name = it.description ? it.description.trim() : 'Unspecified Item';
      const key = name.toLowerCase();

      if (!itemMap[key]) {
        itemMap[key] = {
          description: name,
          category: it.category || 'General',
          movementCount: 0,
          totalIssuedQty: 0,
          totalReturnedQty: 0,
          totalPendingQty: 0
        };
      }

      const qty = Number(it.quantity) || 0;
      const rec = Number(it.receivedQuantity) || 0;

      itemMap[key].movementCount += 1;
      itemMap[key].totalIssuedQty += qty;
      itemMap[key].totalReturnedQty += rec;
      itemMap[key].totalPendingQty += Math.max(0, qty - rec);
    });
  });

  return Object.values(itemMap)
    .map(i => ({
      ...i,
      totalIssuedQty: Math.round(i.totalIssuedQty * 100) / 100,
      totalReturnedQty: Math.round(i.totalReturnedQty * 100) / 100,
      totalPendingQty: Math.round(i.totalPendingQty * 100) / 100
    }))
    .sort((a, b) => b.totalIssuedQty - a.totalIssuedQty)
    .slice(0, limit);
};

/**
 * 9. Department Analytics
 */
const getDepartmentAnalytics = async (filters = {}) => {
  if (!isDbConnected()) return [];

  const dateFilter = buildDateFilter(filters.range, filters.fromDate, filters.toDate, 'date');
  const scopeFilter = buildScopeFilter(filters);
  const matchQuery = { ...dateFilter, ...scopeFilter };

  const records = await GatePass.find(matchQuery).lean();
  const deptMap = {};
  let totalWithDept = 0;

  records.forEach(gp => {
    const dept = gp.department ? gp.department.trim() : (gp.costCentre ? gp.costCentre.trim() : '');
    if (dept) {
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, count: 0, totalQuantity: 0 };
      }
      deptMap[dept].count += 1;
      (gp.items || []).forEach(it => {
        deptMap[dept].totalQuantity += Number(it.quantity) || 0;
      });
      totalWithDept += 1;
    }
  });

  if (totalWithDept === 0) return []; // If no department data exists in database, return [] per spec

  return Object.values(deptMap)
    .map(d => ({
      ...d,
      totalQuantity: Math.round(d.totalQuantity * 100) / 100,
      percentage: Math.round((d.count / totalWithDept) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * 10. Recent Gate Passes
 */
const getRecentGatePasses = async (limit = 8) => {
  if (!isDbConnected()) return [];

  const records = await GatePass.find({})
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return records.map(gp => {
    const items = gp.items || [];
    const itemSummary = items.map(i => i.description).filter(Boolean).join(', ') || 'No items';

    return {
      _id: gp._id,
      gatePassNumber: gp.gatePassNumber,
      date: gp.date || gp.createdAt,
      companyName: gp.companyName,
      itemsSummary: itemSummary,
      passType: gp.passType || 'Returnable',
      totalQuantity: items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
      approvalStatus: gp.approvalStatus || (gp.gatePassStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'),
      gatePassStatus: gp.gatePassStatus || 'OPEN',
      returnStatus: gp.returnStatus || 'PENDING',
      createdBy: gp.createdBy || 'Admin'
    };
  });
};

/**
 * 11. Recent Material Inward
 */
const getRecentInwards = async (limit = 8) => {
  if (!isDbConnected()) return [];

  const records = await MaterialInward.find({})
    .sort({ inwardDate: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return records.map(mi => {
    const items = mi.items || [];
    const itemSummary = items.map(i => i.description).filter(Boolean).join(', ') || 'Inward Items';
    const receivedQuantity = items.reduce((sum, i) => sum + (Number(i.receivedQuantity) || 0), 0);

    return {
      _id: mi._id,
      inwardNumber: mi.inwardNumber,
      gatePassNumber: mi.gatePassNumber,
      inwardDate: mi.inwardDate || mi.createdAt,
      partyName: mi.partyName,
      itemsSummary: itemSummary,
      receivedQuantity: Math.round(receivedQuantity * 100) / 100,
      grandTotal: mi.grandTotal || 0,
      createdBy: mi.createdBy || 'Admin'
    };
  });
};

/**
 * 12. Recent Audit / Activity Timeline
 */
const getRecentActivity = async (limit = 12) => {
  if (!isDbConnected()) return [];

  const audits = await GatePassAudit.find({})
    .populate('gatePassId', 'gatePassNumber companyName')
    .populate('inwardId', 'inwardNumber partyName')
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  const activities = audits.map(log => {
    let refNumber = log.gatePassId?.gatePassNumber || 'Gate Pass';
    if (log.inwardId?.inwardNumber) {
      refNumber += ` / ${log.inwardId.inwardNumber}`;
    }

    return {
      _id: log._id,
      type: 'GATE_PASS',
      action: log.action || 'ACTIVITY',
      refNumber,
      gatePassId: log.gatePassId?._id || log.gatePassId,
      user: log.performedBy || 'Admin',
      timestamp: log.timestamp || log.createdAt,
      details: log.metadata?.reason || log.metadata?.note || log.action
    };
  });

  return activities;
};

/**
 * 13. Action Required List (Pending approvals, overdue returns)
 */
const getActionRequired = async (limit = 10) => {
  if (!isDbConnected()) return [];

  const actions = [];
  const now = new Date();

  // 1. Pending Approvals
  const pendingApprovals = await GatePass.find({
    approvalStatus: 'Pending',
    gatePassStatus: { $ne: 'CANCELLED' }
  })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  pendingApprovals.forEach(gp => {
    actions.push({
      _id: gp._id,
      category: 'PENDING_APPROVAL',
      priority: 'HIGH',
      refNumber: gp.gatePassNumber,
      partyName: gp.companyName,
      date: gp.date || gp.createdAt,
      title: `Gate Pass ${gp.gatePassNumber} Awaiting Approval`,
      description: `Created by ${gp.createdBy || 'User'} with ${gp.items?.length || 0} items`,
      actionType: 'APPROVE',
      targetUrl: `/gate-pass/manage`
    });
  });

  // 2. Overdue Returnable Gate Passes
  const overdueGps = await GatePass.find({
    passType: 'Returnable',
    gatePassStatus: { $ne: 'CANCELLED' },
    returnStatus: { $in: ['PENDING', 'PARTIALLY_RETURNED'] }
  })
    .sort({ date: 1 })
    .limit(limit)
    .lean();

  overdueGps.forEach(gp => {
    const gpDate = new Date(gp.date || gp.createdAt);
    const diffDays = Math.floor((now - gpDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 7) {
      actions.push({
        _id: gp._id,
        category: 'OVERDUE_RETURN',
        priority: diffDays > 14 ? 'CRITICAL' : 'WARNING',
        refNumber: gp.gatePassNumber,
        partyName: gp.companyName,
        date: gp.date || gp.createdAt,
        title: `Overdue Returnable GP ${gp.gatePassNumber}`,
        description: `${diffDays} Days Outstanding (${gp.returnStatus === 'PARTIALLY_RETURNED' ? 'Partially Returned' : 'Pending'})`,
        actionType: 'MATERIAL_INWARD',
        targetUrl: `/material-inward`
      });
    }
  });

  // Sort by Priority (CRITICAL > HIGH > WARNING) and Date
  const priorityWeight = { 'CRITICAL': 3, 'HIGH': 2, 'WARNING': 1 };
  actions.sort((a, b) => {
    if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return new Date(b.date) - new Date(a.date);
  });

  return actions.slice(0, limit);
};

module.exports = {
  getDashboardSummary,
  getStatusDistribution,
  getGatePassTrends,
  getMaterialReturnSummary,
  getReturnTrends,
  getOverdueReturns,
  getVendorAnalytics,
  getItemAnalytics,
  getDepartmentAnalytics,
  getRecentGatePasses,
  getRecentInwards,
  getRecentActivity,
  getActionRequired
};
