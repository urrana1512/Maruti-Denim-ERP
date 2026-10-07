const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const { format } = require('date-fns');
const { getSuperAdminModels, getTenantModels } = require('../config/connectionManager');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Mask Email for List View PII Minimization (e.g. a***n@domain.com)
 */
const maskEmail = (emailStr) => {
  if (!emailStr || !emailStr.includes('@')) return 'u****@domain.com';
  const [local, domain] = emailStr.split('@');
  const maskedLocal = local.length > 2 ? `${local[0]}****${local[local.length - 1]}` : `${local[0]}****`;
  return `${maskedLocal}@${domain}`;
};

/**
 * Mask Phone for List View PII Minimization (e.g. 98****3210)
 */
const maskPhone = (phoneStr) => {
  if (!phoneStr || phoneStr.length < 6) return '******';
  const str = String(phoneStr).trim();
  return `${str.slice(0, 2)}****${str.slice(-4)}`;
};

// =========================================================================
// 1. SUPER ADMIN AUTHENTICATION & PROFILE
// =========================================================================

/**
 * @desc Super Admin Login
 * @route POST /api/superadmin/login
 */
exports.superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Super Admin email and password are required.' });
    }

    const { SuperAdminUser, SuperAdminAuditLog } = getSuperAdminModels();
    const cleanEmail = String(email).toLowerCase().trim();

    const user = await SuperAdminUser.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin credentials.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: 'SUPER_ADMIN', tokenVersion: user.tokenVersion || 0 },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    try {
      await SuperAdminAuditLog.create({
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        action: 'SUPER_ADMIN_LOGIN',
        module: 'PLATFORM',
        ipAddress: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) {
      console.warn('SuperAdmin AuditLog error:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Super Admin authenticated successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'SUPER_ADMIN'
      }
    });
  } catch (error) {
    console.error('Super Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during Super Admin login.', error: error.message });
  }
};

/**
 * @desc Get Super Admin Profile
 * @route GET /api/superadmin/me
 */
exports.getSuperAdminMe = async (req, res) => {
  try {
    const { SuperAdminUser } = getSuperAdminModels();
    const user = await SuperAdminUser.findById(req.superAdmin._id);
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'SUPER_ADMIN',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error loading Super Admin profile.' });
  }
};

/**
 * @desc Change Super Admin Password
 * @route POST /api/superadmin/profile/change-password
 */
exports.changeSuperAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const { SuperAdminUser, SuperAdminAuditLog } = getSuperAdminModels();
    const user = await SuperAdminUser.findById(req.superAdmin._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await SuperAdminAuditLog.create({
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      action: 'SUPER_ADMIN_PASSWORD_CHANGED',
      module: 'SECURITY',
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(200).json({ success: true, message: 'Super Admin password updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password.', error: error.message });
  }
};

/**
 * @desc Get Active Super Admin Sessions
 * @route GET /api/superadmin/sessions
 */
exports.getSuperAdminSessions = async (req, res) => {
  try {
    const user = req.superAdmin;
    res.status(200).json({
      success: true,
      sessions: [
        {
          id: 'current-session',
          device: req.headers['user-agent'] || 'Web Browser',
          ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
          lastActive: new Date(),
          isCurrent: true
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading session data.' });
  }
};

// =========================================================================
// 2. DASHBOARD TELEMETRY & FAN-OUT AGGREGATION
// =========================================================================

/**
 * @desc Get Platform Aggregated Dashboard Stats with Company Filter, Date Filter & Resilience
 * @route GET /api/superadmin/dashboard-stats
 */
exports.getSuperAdminDashboardStats = async (req, res) => {
  try {
    const { companyCode = 'ALL', timeframe = '30d', startDate, endDate } = req.query;
    const { Company, SuperAdminAuditLog } = getSuperAdminModels();

    // 1. Resolve Company Scope Filter
    let companyQuery = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      companyQuery.code = companyCode.toLowerCase().trim();
    }
    const companies = await Company.find(companyQuery).sort({ createdAt: 1 });

    // 2. Resolve Date Range Filter
    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (timeframe === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === '7d') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === '30d') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === 'this_month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === 'prev_month') {
      start = new Date(start.getFullYear(), start.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeframe === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to past 30 days for trend analysis
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    // 3. Consolidated Metric Aggregators
    let totalUsers = 0;
    let totalGatePassesInPeriod = 0;
    let activeGatePasses = 0;
    let partiallyReturned = 0;
    let closedGatePasses = 0;
    let totalInwardEntries = 0;
    let pendingReturnableCount = 0;
    let overdueReturnableCount = 0;

    let recentGatePasses = [];
    let recentInwardEntries = [];
    let recentActivities = [];
    let pendingReturnableRecords = [];
    let alerts = [];

    // Daily breakdown bucket map (YYYY-MM-DD)
    const dailyMap = {};
    const currDate = new Date(start);
    while (currDate <= end) {
      const dateKey = currDate.toISOString().split('T')[0];
      dailyMap[dateKey] = { date: dateKey, total: 0, maruti: 0, shriRam: 0, balaji: 0 };
      currDate.setDate(currDate.getDate() + 1);
    }

    // 4. Fetch telemetry from each tenant database in parallel with error resilience
    const companyStats = await Promise.all(
      companies.map(async (company) => {
        try {
          const tenantModels = getTenantModels(company.code, company.dbName);

          const [
            uCount,
            gpInPeriod,
            gpActive,
            gpPartial,
            gpClosed,
            miInPeriod,
            gpPendingReturn,
            gpOverdue,
            recentGPs,
            recentInwards,
            recentLogs,
            pendingReturnList,
            passesForTrends
          ] = await Promise.all([
            tenantModels.User.countDocuments(),
            tenantModels.GatePass.countDocuments(dateFilter),
            tenantModels.GatePass.countDocuments({ status: 'active', returnStatus: { $ne: 'FULLY_RETURNED' } }),
            tenantModels.GatePass.countDocuments({ returnStatus: 'PARTIALLY_RETURNED' }),
            tenantModels.GatePass.countDocuments({ $or: [{ status: 'closed' }, { returnStatus: 'FULLY_RETURNED' }] }),
            tenantModels.MaterialInward.countDocuments(dateFilter),
            tenantModels.GatePass.countDocuments({ passType: 'RETURNABLE', returnStatus: { $in: ['PENDING', 'PARTIALLY_RETURNED'] } }),
            tenantModels.GatePass.countDocuments({
              passType: 'RETURNABLE',
              returnStatus: { $in: ['PENDING', 'PARTIALLY_RETURNED'] },
              expectedReturnDate: { $lt: new Date() }
            }),
            tenantModels.GatePass.find(dateFilter)
              .sort({ createdAt: -1 })
              .limit(10)
              .select('gatePassNumber companyName passType returnStatus status createdAt createdBy vehicleNumber partyName items')
              .lean(),
            tenantModels.MaterialInward.find(dateFilter)
              .sort({ createdAt: -1 })
              .limit(10)
              .select('inwardNumber gatePassNumber companyName supplierName challanNo entryDate status totalQuantityReceived createdBy')
              .lean(),
            tenantModels.AuditLog.find({})
              .sort({ createdAt: -1 })
              .limit(10)
              .lean(),
            tenantModels.GatePass.find({ passType: 'RETURNABLE', returnStatus: { $in: ['PENDING', 'PARTIALLY_RETURNED'] } })
              .sort({ createdAt: -1 })
              .limit(5)
              .select('gatePassNumber companyName returnStatus expectedReturnDate createdAt createdBy items')
              .lean(),
            tenantModels.GatePass.find(dateFilter).select('createdAt').lean()
          ]);

          totalUsers += uCount;
          totalGatePassesInPeriod += gpInPeriod;
          activeGatePasses += gpActive;
          partiallyReturned += gpPartial;
          closedGatePasses += gpClosed;
          totalInwardEntries += miInPeriod;
          pendingReturnableCount += gpPendingReturn;
          overdueReturnableCount += gpOverdue;

          // Populate daily trend map
          passesForTrends.forEach((gp) => {
            const dateKey = new Date(gp.createdAt).toISOString().split('T')[0];
            if (dailyMap[dateKey]) {
              dailyMap[dateKey].total += 1;
              if (company.code === 'maruti_nandan') dailyMap[dateKey].maruti += 1;
              else if (company.code === 'shri_ram') dailyMap[dateKey].shriRam += 1;
              else if (company.code === 'balaji_polycot') dailyMap[dateKey].balaji += 1;
            }
          });

          // Collect Recent Gate Passes
          if (recentGPs && recentGPs.length > 0) {
            recentGPs.forEach((gp) => {
              recentGatePasses.push({
                ...gp,
                tenantCode: company.code,
                tenantName: company.name
              });
            });
          }

          // Collect Recent Inward Entries
          if (recentInwards && recentInwards.length > 0) {
            recentInwards.forEach((mi) => {
              recentInwardEntries.push({
                ...mi,
                tenantCode: company.code,
                tenantName: company.name
              });
            });
          }

          // Collect Recent Audit Logs
          if (recentLogs && recentLogs.length > 0) {
            recentLogs.forEach((log) => {
              recentActivities.push({
                ...log,
                tenantCode: company.code,
                tenantName: company.name
              });
            });
          }

          // Collect Pending Returnable Records
          if (pendingReturnList && pendingReturnList.length > 0) {
            pendingReturnList.forEach((pr) => {
              pendingReturnableRecords.push({
                ...pr,
                tenantCode: company.code,
                tenantName: company.name
              });
            });
          }

          // Overdue Returnables Alert
          if (gpOverdue > 0) {
            alerts.push({
              id: `alert-overdue-${company.code}`,
              type: 'OVERDUE_RETURNABLES',
              severity: 'warning',
              title: `Overdue Returnables: ${company.name}`,
              message: `${company.name} has ${gpOverdue} returnable gate pass(es) past expected return date.`,
              companyCode: company.code,
              timestamp: new Date()
            });
          }

          // Inactive Status Alert
          if (company.status === 'INACTIVE') {
            alerts.push({
              id: `alert-inactive-${company.code}`,
              type: 'COMPANY_INACTIVE',
              severity: 'warning',
              title: `Company Inactive: ${company.name}`,
              message: `Company '${company.name}' is currently deactivated by Super Admin.`,
              companyCode: company.code,
              timestamp: company.updatedAt || company.createdAt
            });
          }

          const lastActivityTime = recentGPs[0]?.createdAt || recentLogs[0]?.createdAt || company.updatedAt;

          return {
            _id: company._id,
            name: company.name,
            code: company.code,
            address: company.address,
            gstNo: company.gstNo,
            status: company.status,
            adminEmail: company.adminEmail,
            usersCount: uCount,
            gatePassesInPeriod: gpInPeriod,
            activeGatePasses: gpActive,
            partiallyReturned: gpPartial,
            closedGatePasses: gpClosed,
            inwardInPeriod: miInPeriod,
            pendingReturnable: gpPendingReturn,
            overdueReturnables: gpOverdue,
            lastActivityAt: lastActivityTime,
            isAvailable: true,
            dbConnected: true
          };
        } catch (err) {
          console.warn(`[SuperAdmin Stats Warning] Database connection/query failed for tenant ${company.code}: ${err.message}`);

          alerts.push({
            id: `alert-db-error-${company.code}`,
            type: 'DATABASE_CONNECTIVITY',
            severity: 'danger',
            title: `Database Connection Issue: ${company.name}`,
            message: `Unable to connect to tenant database '${company.dbName}'.`,
            companyCode: company.code,
            timestamp: new Date()
          });

          return {
            _id: company._id,
            name: company.name,
            code: company.code,
            address: company.address,
            gstNo: company.gstNo,
            status: company.status,
            adminEmail: company.adminEmail,
            usersCount: 0,
            gatePassesInPeriod: 0,
            activeGatePasses: 0,
            partiallyReturned: 0,
            closedGatePasses: 0,
            inwardInPeriod: 0,
            pendingReturnable: 0,
            overdueReturnables: 0,
            lastActivityAt: null,
            isAvailable: false,
            dbConnected: false,
            errorNotice: `Data for ${company.name} is currently unavailable.`
          };
        }
      })
    );

    // 5. Total registered companies count across platform
    const allCompaniesList = await Company.find({}).select('code name status');
    const totalCompaniesCount = allCompaniesList.length;

    // Sort recent combined lists
    recentGatePasses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recentGatePasses = recentGatePasses.slice(0, 10);

    recentInwardEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recentInwardEntries = recentInwardEntries.slice(0, 10);

    recentActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recentActivities = recentActivities.slice(0, 12);

    pendingReturnableRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    pendingReturnableRecords = pendingReturnableRecords.slice(0, 10);

    // 6. Trend Chart Data Array
    const trendSeries = Object.values(dailyMap);

    // 7. Status Breakdown Distribution for Donut Chart
    const statusDistribution = [
      { label: 'Active / Open', count: activeGatePasses, color: '#3B82F6' },
      { label: 'Partially Returned', count: partiallyReturned, color: '#F59E0B' },
      { label: 'Closed / Completed', count: closedGatePasses, color: '#10B981' }
    ];

    res.status(200).json({
      success: true,
      asOf: new Date().toISOString(),
      filters: {
        companyCode: companyCode.toUpperCase(),
        timeframe,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      stats: {
        totalCompanies: totalCompaniesCount,
        totalUsers,
        totalGatePassesInPeriod,
        activeGatePasses,
        partiallyReturned,
        closedGatePasses,
        totalInwardEntries,
        pendingReturnableCount,
        overdueReturnableCount
      },
      companies: companyStats,
      trends: trendSeries,
      statusDistribution,
      inwardOverview: {
        totalInwardEntries,
        pendingReturnableCount,
        overdueReturnableCount,
        pendingRecords: pendingReturnableRecords
      },
      recentGatePasses,
      recentInwardEntries,
      recentActivities,
      alerts
    });
  } catch (error) {
    console.error('Error fetching Super Admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error loading Super Admin dashboard.', error: error.message });
  }
};

// =========================================================================
// 3. COMPANY CATALOG & PROVISIONING
// =========================================================================

/**
 * @desc Get All Companies
 * @route GET /api/superadmin/companies
 */
exports.getCompanies = async (req, res) => {
  try {
    const { search = '', status = 'ALL', page = 1, limit = 20 } = req.query;
    const { Company } = getSuperAdminModels();

    const query = {};
    if (status && status.toUpperCase() !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { code: regex }, { adminEmail: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const companies = await Company.find(query).sort({ createdAt: 1 }).skip(skip).limit(limitNum);
    const total = await Company.countDocuments(query);

    // Attach live tenant stats
    const enrichedCompanies = await Promise.all(
      companies.map(async (comp) => {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const [usersCount, gpCount, activeGp, pendingApprovals] = await Promise.all([
            tenantModels.User.countDocuments(),
            tenantModels.GatePass.countDocuments(),
            tenantModels.GatePass.countDocuments({ status: 'active' }),
            tenantModels.User.countDocuments({ status: 'PENDING_APPROVAL' })
          ]);
          return {
            ...comp.toObject(),
            usersCount,
            gatePassesCount: gpCount,
            activeGatePasses: activeGp,
            pendingApprovals,
            isAvailable: true
          };
        } catch (e) {
          return {
            ...comp.toObject(),
            usersCount: 0,
            gatePassesCount: 0,
            activeGatePasses: 0,
            pendingApprovals: 0,
            isAvailable: false
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedCompanies.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      companies: enrichedCompanies
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading companies list.', error: error.message });
  }
};

/**
 * @desc Get Single Company Telemetry & Read-Only Inspection Details
 * @route GET /api/superadmin/companies/:code/details
 */
exports.getCompanyDetails = async (req, res) => {
  try {
    const { code } = req.params;
    const { Company } = getSuperAdminModels();
    const cleanCode = String(code).toLowerCase().trim();

    const company = await Company.findOne({ code: cleanCode });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    let tenantData = {
      isAvailable: false,
      usersCount: 0,
      gatePassesCount: 0,
      activeGatePasses: 0,
      pendingReturnable: 0,
      closedGatePasses: 0,
      inwardCount: 0,
      pendingApprovals: 0,
      recentGatePasses: [],
      recentLogs: [],
      usersList: []
    };

    try {
      const tenantModels = getTenantModels(cleanCode, company.dbName);
      const [uCount, gpCount, gpActive, gpPendingReturn, gpClosed, miCount, uPending, recentGPs, recentLogs, usersSample] = await Promise.all([
        tenantModels.User.countDocuments(),
        tenantModels.GatePass.countDocuments(),
        tenantModels.GatePass.countDocuments({ status: 'active' }),
        tenantModels.GatePass.countDocuments({ returnStatus: 'PENDING' }),
        tenantModels.GatePass.countDocuments({ $or: [{ status: 'closed' }, { returnStatus: 'FULLY_RETURNED' }] }),
        tenantModels.MaterialInward.countDocuments(),
        tenantModels.User.countDocuments({ status: 'PENDING_APPROVAL' }),
        tenantModels.GatePass.find({}).sort({ createdAt: -1 }).limit(10).lean(),
        tenantModels.AuditLog.find({}).sort({ createdAt: -1 }).limit(10).lean(),
        tenantModels.User.find({}).select('name email phone designation roleName status createdAt').limit(10).lean()
      ]);

      // Mask user list PII in telemetry view
      const maskedUsers = usersSample.map(u => ({
        ...u,
        email: maskEmail(u.email),
        phone: maskPhone(u.phone)
      }));

      tenantData = {
        isAvailable: true,
        usersCount: uCount,
        gatePassesCount: gpCount,
        activeGatePasses: gpActive,
        pendingReturnable: gpPendingReturn,
        closedGatePasses: gpClosed,
        inwardCount: miCount,
        pendingApprovals: uPending,
        recentGatePasses: recentGPs,
        recentLogs: recentLogs,
        usersList: maskedUsers
      };
    } catch (err) {
      console.warn(`[CompanyDetails Warning] DB error for ${cleanCode}: ${err.message}`);
    }

    res.status(200).json({
      success: true,
      company,
      telemetry: tenantData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error loading company details.', error: error.message });
  }
};

/**
 * @desc Provision New Company
 * @route POST /api/superadmin/companies
 */
exports.createCompany = async (req, res) => {
  try {
    const { name, code, address, gstNo, adminName, adminEmail, adminPassword } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Company Name and Code are required.' });
    }

    const { Company, SuperAdminAuditLog } = getSuperAdminModels();
    const cleanCode = String(code).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    const dbName = `${cleanCode}_db`;

    const existing = await Company.findOne({ $or: [{ code: cleanCode }, { dbName }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A company with this code or database already exists.' });
    }

    const company = await Company.create({
      name: String(name).trim(),
      code: cleanCode,
      address: address || '',
      gstNo: gstNo || '',
      dbName,
      status: 'ACTIVE',
      adminName: adminName || 'Company Admin',
      adminEmail: adminEmail || `admin@${cleanCode}.com`,
      logoUrl: '/Maruti%20denim%20logo.png'
    });

    // Provision tenant DB
    const tenantModels = getTenantModels(cleanCode, dbName);

    // Seed default Admin role
    let adminRole = await tenantModels.Role.findOne({ code: 'admin' });
    if (!adminRole) {
      adminRole = await tenantModels.Role.create({
        name: 'Admin',
        code: 'admin',
        description: 'Full enterprise admin access for company',
        permissions: ['admin_access', 'user_management', 'gate_pass_read', 'gate_pass_create', 'gate_pass_approve', 'gate_pass_close', 'material_inward_read', 'reports_view', 'master_data_manage'],
        isSystemRole: true,
        status: 'ACTIVE'
      });
    }

    // Seed company Admin user account
    const initialAdminEmail = String(adminEmail || `admin@${cleanCode}.com`).toLowerCase().trim();
    let companyAdmin = await tenantModels.User.findOne({ email: initialAdminEmail });
    if (!companyAdmin) {
      companyAdmin = await tenantModels.User.create({
        name: adminName || `${company.name} Admin`,
        email: initialAdminEmail,
        phone: '9876543210',
        department: 'Admin',
        designation: 'Company Administrator',
        password: adminPassword || 'Admin@123',
        role: adminRole._id,
        roleName: 'Admin',
        status: 'APPROVED',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'Super Admin Provisioning'
      });
    }

    await SuperAdminAuditLog.create({
      userId: req.superAdmin._id.toString(),
      userName: req.superAdmin.name,
      userEmail: req.superAdmin.email,
      action: 'COMPANY_PROVISIONED',
      module: 'COMPANY',
      companyCode: cleanCode,
      details: { name: company.name, dbName, adminEmail: initialAdminEmail },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(201).json({
      success: true,
      message: `Company '${company.name}' provisioned successfully! Tenant database '${dbName}' created.`,
      company
    });
  } catch (error) {
    console.error('Error provisioning company:', error);
    res.status(500).json({ success: false, message: 'Server error provisioning company.', error: error.message });
  }
};

/**
 * @desc Toggle Company Status with Sensitive Action Re-Authentication
 * @route PATCH /api/superadmin/companies/:code/status
 */
exports.toggleCompanyStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const { status, confirmPassword, reason } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password confirmation is required for sensitive administrative actions.' });
    }

    const { Company, SuperAdminUser, SuperAdminAuditLog } = getSuperAdminModels();
    const superAdmin = await SuperAdminUser.findById(req.superAdmin._id).select('+password');

    const isMatch = await superAdmin.matchPassword(confirmPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Security re-authentication failed.' });
    }

    const cleanCode = String(code).toLowerCase().trim();
    const company = await Company.findOne({ code: cleanCode });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company record not found.' });
    }

    const newStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    company.status = newStatus;
    await company.save();

    await SuperAdminAuditLog.create({
      userId: req.superAdmin._id.toString(),
      userName: req.superAdmin.name,
      userEmail: req.superAdmin.email,
      action: newStatus === 'ACTIVE' ? 'COMPANY_ACTIVATED' : 'COMPANY_DEACTIVATED',
      module: 'COMPANY',
      companyCode: cleanCode,
      details: { companyName: company.name, newStatus, reason: reason || 'Super Admin action' },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(200).json({
      success: true,
      message: `Company '${company.name}' status changed to ${newStatus}.`,
      company
    });
  } catch (error) {
    console.error('Toggle company status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating company status.' });
  }
};

// =========================================================================
// 4. CONSOLIDATED GATE PASSES & INWARDS
// =========================================================================

/**
 * @desc Get Consolidated Gate Passes across Companies
 * @route GET /api/superadmin/gate-passes
 */
exports.getConsolidatedGatePasses = async (req, res) => {
  try {
    const { companyCode = 'ALL', status = 'ALL', passType = 'ALL', search = '', page = 1, limit = 20 } = req.query;
    const { Company } = getSuperAdminModels();

    let companyQuery = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      companyQuery.code = companyCode.toLowerCase().trim();
    }

    const companies = await Company.find(companyQuery);

    let allGatePasses = [];

    await Promise.all(
      companies.map(async (comp) => {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const query = {};

          if (status && status.toUpperCase() !== 'ALL') {
            query.status = status.toLowerCase();
          }

          if (passType && passType.toUpperCase() !== 'ALL') {
            query.passType = passType.toUpperCase();
          }

          if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
              { gatePassNumber: regex },
              { companyName: regex },
              { createdBy: regex },
              { vehicleNumber: regex }
            ];
          }

          const passes = await tenantModels.GatePass.find(query).sort({ createdAt: -1 }).lean();

          passes.forEach(gp => {
            allGatePasses.push({
              ...gp,
              companyCode: comp.code,
              companyTitle: comp.name
            });
          });
        } catch (e) {
          console.warn(`[Consolidated GatePasses Warning] Failed loading ${comp.code}: ${e.message}`);
        }
      })
    );

    // Sort combined gate passes by creation date descending
    allGatePasses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const paginatedPasses = allGatePasses.slice(skip, skip + limitNum);
    const total = allGatePasses.length;

    res.status(200).json({
      success: true,
      count: paginatedPasses.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      gatePasses: paginatedPasses
    });
  } catch (error) {
    console.error('Error fetching consolidated gate passes:', error);
    res.status(500).json({ success: false, message: 'Server error loading gate passes.', error: error.message });
  }
};

/**
 * @desc Get Consolidated Inward & Returnables across Companies
 * @route GET /api/superadmin/inward-returnables
 */
exports.getConsolidatedInwardReturnables = async (req, res) => {
  try {
    const { companyCode = 'ALL', returnStatus = 'ALL', search = '', page = 1, limit = 20 } = req.query;
    const { Company } = getSuperAdminModels();

    let companyQuery = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      companyQuery.code = companyCode.toLowerCase().trim();
    }

    const companies = await Company.find(companyQuery);
    let allRecords = [];

    await Promise.all(
      companies.map(async (comp) => {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const query = { passType: 'RETURNABLE' };

          if (returnStatus && returnStatus.toUpperCase() !== 'ALL') {
            query.returnStatus = returnStatus.toUpperCase();
          }

          if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
              { gatePassNumber: regex },
              { companyName: regex },
              { createdBy: regex }
            ];
          }

          const passes = await tenantModels.GatePass.find(query).sort({ createdAt: -1 }).lean();

          passes.forEach(gp => {
            allRecords.push({
              ...gp,
              companyCode: comp.code,
              companyTitle: comp.name
            });
          });
        } catch (e) {
          console.warn(`[Consolidated Inwards Warning] Failed loading ${comp.code}: ${e.message}`);
        }
      })
    );

    allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const paginatedRecords = allRecords.slice(skip, skip + limitNum);
    const total = allRecords.length;

    res.status(200).json({
      success: true,
      count: paginatedRecords.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      inwardReturnables: paginatedRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error loading inward/returnables.', error: error.message });
  }
};

// =========================================================================
// 5. USER & COMPANY ADMIN MONITORING (PII MINIMIZED)
// =========================================================================

/**
 * @desc Get Consolidated Users across Companies (PII Masked in List View)
 * @route GET /api/superadmin/users
 */
exports.getConsolidatedUsers = async (req, res) => {
  try {
    const { companyCode = 'ALL', role = 'ALL', status = 'ALL', search = '', page = 1, limit = 20 } = req.query;
    const { Company } = getSuperAdminModels();

    let companyQuery = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      companyQuery.code = companyCode.toLowerCase().trim();
    }

    const companies = await Company.find(companyQuery);
    let allUsers = [];

    await Promise.all(
      companies.map(async (comp) => {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const query = {};

          if (status && status.toUpperCase() !== 'ALL') {
            query.status = status.toUpperCase();
          }

          if (role && role.toUpperCase() !== 'ALL') {
            query.roleName = role;
          }

          if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
              { name: regex },
              { email: regex },
              { phone: regex },
              { designation: regex }
            ];
          }

          const users = await tenantModels.User.find(query).select('-password').sort({ createdAt: -1 }).lean();

          users.forEach(u => {
            allUsers.push({
              _id: u._id,
              name: u.name,
              emailMasked: maskEmail(u.email),
              phoneMasked: maskPhone(u.phone),
              department: u.department,
              designation: u.designation,
              roleName: u.roleName,
              status: u.status,
              createdAt: u.createdAt,
              lastLoginAt: u.lastLoginAt,
              companyCode: comp.code,
              companyTitle: comp.name
            });
          });
        } catch (e) {
          console.warn(`[Consolidated Users Warning] Failed loading ${comp.code}: ${e.message}`);
        }
      })
    );

    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const paginatedUsers = allUsers.slice(skip, skip + limitNum);
    const total = allUsers.length;

    res.status(200).json({
      success: true,
      count: paginatedUsers.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      users: paginatedUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error loading users.', error: error.message });
  }
};

/**
 * @desc Get Unmasked User Detail Inspection View (With Audit Entry Logging)
 * @route GET /api/superadmin/users/:companyCode/:userId
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { companyCode, userId } = req.params;
    const { Company, SuperAdminAuditLog } = getSuperAdminModels();
    const cleanCode = String(companyCode).toLowerCase().trim();

    const company = await Company.findOne({ code: cleanCode });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const tenantModels = getTenantModels(cleanCode, company.dbName);
    const user = await tenantModels.User.findById(userId).select('-password').populate('role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in tenant database.' });
    }

    // Log PII inspection audit log
    await SuperAdminAuditLog.create({
      userId: req.superAdmin._id.toString(),
      userName: req.superAdmin.name,
      userEmail: req.superAdmin.email,
      action: 'USER_PII_VIEWED',
      module: 'PRIVACY',
      companyCode: cleanCode,
      details: { targetUserId: user._id, targetUserName: user.name, targetUserEmail: user.email },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        companyCode: cleanCode,
        companyName: company.name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user detail inspection.' });
  }
};

/**
 * @desc Get Company Admins Overview
 * @route GET /api/superadmin/company-admins
 */
exports.getCompanyAdmins = async (req, res) => {
  try {
    const { Company } = getSuperAdminModels();
    const companies = await Company.find({}).sort({ createdAt: 1 });

    const adminList = await Promise.all(
      companies.map(async (comp) => {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const adminUser = await tenantModels.User.findOne({
            $or: [{ roleName: 'Admin' }, { email: comp.adminEmail }]
          }).select('-password').lean();

          return {
            companyCode: comp.code,
            companyName: comp.name,
            companyStatus: comp.status,
            logoUrl: comp.logoUrl,
            adminName: adminUser ? adminUser.name : comp.adminName,
            adminEmail: comp.adminEmail,
            adminEmailMasked: maskEmail(comp.adminEmail),
            adminPhoneMasked: adminUser ? maskPhone(adminUser.phone) : '98****3210',
            status: adminUser ? adminUser.status : 'ACTIVE',
            lastLoginAt: adminUser ? adminUser.lastLoginAt : null,
            createdAt: adminUser ? adminUser.createdAt : comp.createdAt,
            isAvailable: true
          };
        } catch (e) {
          return {
            companyCode: comp.code,
            companyName: comp.name,
            companyStatus: comp.status,
            logoUrl: comp.logoUrl,
            adminName: comp.adminName,
            adminEmail: comp.adminEmail,
            adminEmailMasked: maskEmail(comp.adminEmail),
            adminPhoneMasked: '******',
            status: 'ACTIVE',
            lastLoginAt: null,
            createdAt: comp.createdAt,
            isAvailable: false
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      admins: adminList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching company admins.', error: error.message });
  }
};

/**
 * @desc Reassign Company Admin with Password Re-Authentication
 * @route POST /api/superadmin/company-admins/reassign
 */
exports.reassignCompanyAdmin = async (req, res) => {
  try {
    const { companyCode, adminName, adminEmail, adminPassword, confirmPassword, reason } = req.body;

    if (!companyCode || !adminEmail || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Company code, Admin Email, and Super Admin Password confirmation are required.' });
    }

    const { Company, SuperAdminUser, SuperAdminAuditLog } = getSuperAdminModels();
    const superAdmin = await SuperAdminUser.findById(req.superAdmin._id).select('+password');

    const isMatch = await superAdmin.matchPassword(confirmPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin password. Action denied.' });
    }

    const cleanCode = String(companyCode).toLowerCase().trim();
    const company = await Company.findOne({ code: cleanCode });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const cleanEmail = String(adminEmail).toLowerCase().trim();
    const tenantModels = getTenantModels(cleanCode, company.dbName);

    let adminRole = await tenantModels.Role.findOne({ code: 'admin' });
    if (!adminRole) {
      adminRole = await tenantModels.Role.create({
        name: 'Admin',
        code: 'admin',
        description: 'Full enterprise admin access for company',
        permissions: ['admin_access', 'user_management', 'gate_pass_read', 'gate_pass_create', 'gate_pass_approve', 'gate_pass_close', 'material_inward_read', 'reports_view', 'master_data_manage'],
        isSystemRole: true,
        status: 'ACTIVE'
      });
    }

    let user = await tenantModels.User.findOne({ email: cleanEmail });
    if (user) {
      user.role = adminRole._id;
      user.roleName = 'Admin';
      user.status = 'APPROVED';
      if (adminName) user.name = adminName;
      if (adminPassword) user.password = adminPassword; // bcrypt hashed in pre-save hook
      await user.save();
    } else {
      user = await tenantModels.User.create({
        name: adminName || `${company.name} Admin`,
        email: cleanEmail,
        phone: '9876543210',
        department: 'Admin',
        designation: 'Company Administrator',
        password: adminPassword || 'Admin@123',
        role: adminRole._id,
        roleName: 'Admin',
        status: 'APPROVED',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'Super Admin Reassignment'
      });
    }

    company.adminEmail = cleanEmail;
    company.adminName = user.name;
    await company.save();

    await SuperAdminAuditLog.create({
      userId: req.superAdmin._id.toString(),
      userName: req.superAdmin.name,
      userEmail: req.superAdmin.email,
      action: 'COMPANY_ADMIN_REASSIGNED',
      module: 'COMPANY',
      companyCode: cleanCode,
      details: { companyName: company.name, newAdminEmail: cleanEmail, newAdminName: user.name, reason: reason || 'Admin replacement' },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(200).json({
      success: true,
      message: `Company Admin for '${company.name}' reassigned to ${cleanEmail} successfully!`
    });
  } catch (error) {
    console.error('Reassign company admin error:', error);
    res.status(500).json({ success: false, message: 'Server error reassigning company admin.', error: error.message });
  }
};

// =========================================================================
// 6. REPORTS, AUDIT LOGS, ALERTS & EXPORTS
// =========================================================================

/**
 * @desc Get Platform Audit Logs (Tamper-Evident Append-Only)
 * @route GET /api/superadmin/audit-logs
 */
exports.getSuperAdminAuditLogs = async (req, res) => {
  try {
    const { companyCode = 'ALL', module = 'ALL', search = '', page = 1, limit = 50 } = req.query;
    const { SuperAdminAuditLog } = getSuperAdminModels();

    const query = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      query.companyCode = companyCode.toLowerCase().trim();
    }
    if (module && module.toUpperCase() !== 'ALL') {
      query.module = module.toUpperCase();
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ userName: regex }, { userEmail: regex }, { action: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const logs = await SuperAdminAuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await SuperAdminAuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading platform audit logs.' });
  }
};

/**
 * @desc Get System Actionable Alerts & Telemetry Anomalies
 * @route GET /api/superadmin/alerts
 */
exports.getSuperAdminAlerts = async (req, res) => {
  try {
    const { Company } = getSuperAdminModels();
    const companies = await Company.find({}).sort({ createdAt: 1 });

    const alerts = [];

    // 1. Inactive Company Alerts
    companies.forEach(comp => {
      if (comp.status === 'INACTIVE') {
        alerts.push({
          id: `alert-inactive-${comp.code}`,
          type: 'COMPANY_INACTIVE',
          severity: 'warning',
          title: `Company Inactive: ${comp.name}`,
          message: `Company '${comp.name}' (${comp.code}) is set to inactive status. Registration and employee logins are restricted.`,
          companyCode: comp.code,
          timestamp: comp.updatedAt || comp.createdAt
        });
      }
    });

    // 2. Pending Approvals & Connectivity Alerts
    await Promise.all(
      companies.map(async comp => {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const [pendingUsers, pendingReturnables] = await Promise.all([
            tenantModels.User.countDocuments({ status: 'PENDING_APPROVAL' }),
            tenantModels.GatePass.countDocuments({ returnStatus: 'PENDING' })
          ]);

          if (pendingUsers > 0) {
            alerts.push({
              id: `alert-pending-users-${comp.code}`,
              type: 'PENDING_APPROVALS',
              severity: 'info',
              title: `Pending User Approvals (${comp.name})`,
              message: `${pendingUsers} new user registration(s) are awaiting Admin approval.`,
              companyCode: comp.code,
              timestamp: new Date()
            });
          }

          if (pendingReturnables > 5) {
            alerts.push({
              id: `alert-pending-return-${comp.code}`,
              type: 'OVERDUE_RETURNABLES',
              severity: 'warning',
              title: `High Pending Returnables (${comp.name})`,
              message: `${comp.name} has ${pendingReturnables} pending returnable gate passes requiring follow-up.`,
              companyCode: comp.code,
              timestamp: new Date()
            });
          }
        } catch (err) {
          alerts.push({
            id: `alert-db-error-${comp.code}`,
            type: 'DATABASE_CONNECTIVITY',
            severity: 'danger',
            title: `Database Connection Issue: ${comp.name}`,
            message: `Could not connect to tenant database '${comp.dbName}'. Please check database connection settings.`,
            companyCode: comp.code,
            timestamp: new Date()
          });
        }
      })
    );

    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error evaluating platform alerts.', error: error.message });
  }
};

/**
 * @desc Get Cross-Company Analytics & Performance Breakdown
 * @route GET /api/superadmin/reports/analytics
 */
exports.getSuperAdminAnalytics = async (req, res) => {
  try {
    const { companyCode = 'ALL' } = req.query;
    const { Company } = getSuperAdminModels();

    let companyQuery = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      companyQuery.code = companyCode.toLowerCase().trim();
    }

    const companies = await Company.find(companyQuery);

    const companyAnalytics = await Promise.all(
      companies.map(async comp => {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const [totalGP, returnableGP, nonReturnableGP, activeGP, closedGP, totalUsers, totalInwards] = await Promise.all([
            tenantModels.GatePass.countDocuments(),
            tenantModels.GatePass.countDocuments({ passType: 'RETURNABLE' }),
            tenantModels.GatePass.countDocuments({ passType: 'NON_RETURNABLE' }),
            tenantModels.GatePass.countDocuments({ status: 'active' }),
            tenantModels.GatePass.countDocuments({ $or: [{ status: 'closed' }, { returnStatus: 'FULLY_RETURNED' }] }),
            tenantModels.User.countDocuments(),
            tenantModels.MaterialInward.countDocuments()
          ]);

          return {
            companyCode: comp.code,
            companyName: comp.name,
            totalGatePasses: totalGP,
            returnableGatePasses: returnableGP,
            nonReturnableGatePasses: nonReturnableGP,
            activeGatePasses: activeGP,
            closedGatePasses: closedGP,
            totalUsers,
            totalInwards,
            isAvailable: true
          };
        } catch (e) {
          return {
            companyCode: comp.code,
            companyName: comp.name,
            totalGatePasses: 0,
            returnableGatePasses: 0,
            nonReturnableGatePasses: 0,
            activeGatePasses: 0,
            closedGatePasses: 0,
            totalUsers: 0,
            totalInwards: 0,
            isAvailable: false
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      analytics: companyAnalytics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading analytics data.' });
  }
};

/**
 * @desc Export Consolidated Platform Report to Excel (With PII Minimization & Attribution)
 * @route GET /api/superadmin/reports/export
 */
exports.exportSuperAdminReport = async (req, res) => {
  try {
    const { companyCode = 'ALL', reportType = 'gatepasses' } = req.query;
    const { Company } = getSuperAdminModels();

    let companyQuery = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      companyQuery.code = companyCode.toLowerCase().trim();
    }

    const companies = await Company.find(companyQuery);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Super Admin Platform Report');

    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `MARUTI DENIM GROUP — SUPER ADMIN ${reportType.toUpperCase()} CONSOLIDATED REPORT`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    sheet.addRow([]);
    sheet.addRow(['Report Filter:', companyCode.toUpperCase() === 'ALL' ? 'All Companies' : companyCode.toUpperCase()]);
    sheet.addRow(['Generated Date:', format(new Date(), 'dd-MM-yyyy HH:mm:ss')]);
    sheet.addRow([]);

    if (reportType === 'users') {
      const headerRow = sheet.addRow(['Sr. No.', 'Company', 'Employee Name', 'Email (Masked)', 'Department', 'Role', 'Status', 'Registered Date']);
      headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      });

      let sr = 1;
      for (const comp of companies) {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const users = await tenantModels.User.find({}).sort({ createdAt: -1 }).lean();
          users.forEach(u => {
            sheet.addRow([
              sr++,
              comp.name,
              u.name,
              maskEmail(u.email),
              u.department || '-',
              u.roleName || 'Staff',
              u.status,
              u.createdAt ? format(new Date(u.createdAt), 'dd-MM-yyyy') : '-'
            ]);
          });
        } catch (e) {}
      }
    } else {
      // Default: Gate Passes Report
      const headerRow = sheet.addRow(['Sr. No.', 'Company', 'Gate Pass No.', 'Type', 'Party / Vendor', 'Vehicle No.', 'Status', 'Date']);
      headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      });

      let sr = 1;
      for (const comp of companies) {
        try {
          const tenantModels = getTenantModels(comp.code, comp.dbName);
          const passes = await tenantModels.GatePass.find({}).sort({ createdAt: -1 }).lean();
          passes.forEach(gp => {
            sheet.addRow([
              sr++,
              comp.name,
              gp.gatePassNumber,
              gp.passType,
              gp.companyName || '-',
              gp.vehicleNumber || '-',
              gp.status || gp.returnStatus,
              gp.createdAt ? format(new Date(gp.createdAt), 'dd-MM-yyyy') : '-'
            ]);
          });
        } catch (e) {}
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SuperAdmin_${reportType}_Report.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Super Admin report error:', error);
    res.status(500).json({ success: false, message: 'Failed to export report.', error: error.message });
  }
};

/**
 * @desc Get Super Admin Platform Notifications
 * @route GET /api/superadmin/notifications
 */
exports.getSuperAdminNotifications = async (req, res) => {
  try {
    const { SuperAdminNotification } = getSuperAdminModels();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { isRead, category, priority, search } = req.query;
    const query = {};

    if (isRead !== undefined && isRead !== '') {
      query.isRead = isRead === 'true';
    }
    if (category && category !== 'ALL') query.category = category;
    if (priority && priority !== 'ALL') query.priority = priority;

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { message: searchRegex }];
    }

    const notifications = await SuperAdminNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SuperAdminNotification.countDocuments(query);
    const unreadCount = await SuperAdminNotification.countDocuments({ isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error getting Super Admin notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

/**
 * @desc Get Super Admin Unread Alerts Count
 * @route GET /api/superadmin/notifications/unread-count
 */
exports.getSuperAdminUnreadCount = async (req, res) => {
  try {
    const { SuperAdminNotification } = getSuperAdminModels();
    const count = await SuperAdminNotification.countDocuments({ isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, count: 0 });
  }
};

/**
 * @desc Mark Single Super Admin Notification Read
 * @route PATCH /api/superadmin/notifications/:id/read
 */
exports.markSuperAdminNotificationRead = async (req, res) => {
  try {
    const { SuperAdminNotification } = getSuperAdminModels();
    const notification = await SuperAdminNotification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.', notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

/**
 * @desc Mark All Super Admin Notifications Read
 * @route PATCH /api/superadmin/notifications/read-all
 */
exports.markSuperAdminAllRead = async (req, res) => {
  try {
    const { SuperAdminNotification } = getSuperAdminModels();
    await SuperAdminNotification.updateMany({ isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    res.json({ success: true, message: 'All platform notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
};

/**
 * @desc Export Super Admin Platform Audit Logs
 * @route GET /api/superadmin/audit-logs/export
 */
exports.exportSuperAdminAuditLogs = async (req, res) => {
  try {
    const { companyCode = 'ALL', module = 'ALL', search = '' } = req.query;
    const { SuperAdminAuditLog } = getSuperAdminModels();

    const query = {};
    if (companyCode && companyCode.toUpperCase() !== 'ALL') {
      query.companyCode = companyCode.toLowerCase().trim();
    }
    if (module && module.toUpperCase() !== 'ALL') {
      query.module = module.toUpperCase();
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ userName: regex }, { userEmail: regex }, { action: regex }];
    }

    const logs = await SuperAdminAuditLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();

    const headers = ['Date & Time', 'Company', 'User', 'Email', 'Role', 'Action', 'Module', 'Description', 'Reference ID', 'Status', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString('en-IN'),
      `"${log.companyCode || 'PLATFORM'}"`,
      `"${log.userName || ''}"`,
      `"${log.userEmail || ''}"`,
      `"${log.userRole || 'Root Super Admin'}"`,
      `"${log.action || ''}"`,
      `"${log.module || ''}"`,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      `"${log.entityId || ''}"`,
      `"${log.status || 'SUCCESS'}"`,
      `"${log.ipAddress || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="superadmin_platform_audit_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting Super Admin audit logs:', error);
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};
