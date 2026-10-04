const jwt = require('jsonwebtoken');
const { getSuperAdminModels, getTenantModels } = require('../config/connectionManager');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Super Admin Login
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

    await SuperAdminAuditLog.create({
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      action: 'SUPER_ADMIN_LOGIN',
      module: 'PLATFORM',
      ipAddress: req.ip || req.connection?.remoteAddress
    });

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
 * Get Super Admin Me Profile
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
        role: 'SUPER_ADMIN'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error loading Super Admin profile.' });
  }
};

/**
 * Get Platform Aggregated Dashboard Stats (Live Fan-Out across Tenant DBs)
 * @route GET /api/superadmin/dashboard-stats
 */
exports.getSuperAdminDashboardStats = async (req, res) => {
  try {
    const { Company } = getSuperAdminModels();
    const companies = await Company.find({}).sort({ createdAt: 1 });

    let totalUsers = 0;
    let pendingUserApprovals = 0;
    let totalGatePasses = 0;
    let activeGatePasses = 0;
    let pendingReturnable = 0;

    // Fan-out query execution per company DB with timeout boundary
    const companyStats = await Promise.all(
      companies.map(async (company) => {
        try {
          const tenantModels = getTenantModels(company.code, company.dbName);
          
          const uCount = await tenantModels.User.countDocuments();
          const uPending = await tenantModels.User.countDocuments({ status: 'PENDING_APPROVAL' });
          const gpCount = await tenantModels.GatePass.countDocuments();
          const gpActive = await tenantModels.GatePass.countDocuments({ status: 'active', returnStatus: { $ne: 'FULLY_RETURNED' } });
          const gpPendingReturn = await tenantModels.GatePass.countDocuments({ returnStatus: 'PENDING' });

          totalUsers += uCount;
          pendingUserApprovals += uPending;
          totalGatePasses += gpCount;
          activeGatePasses += gpActive;
          pendingReturnable += gpPendingReturn;

          return {
            _id: company._id,
            name: company.name,
            code: company.code,
            address: company.address,
            gstNo: company.gstNo,
            status: company.status,
            adminEmail: company.adminEmail,
            usersCount: uCount,
            pendingApprovals: uPending,
            gatePassesCount: gpCount,
            activeGatePasses: gpActive,
            pendingReturnable: gpPendingReturn,
            isAvailable: true
          };
        } catch (err) {
          console.warn(`[SuperAdmin Stats Warning] Failed reading ${company.code}: ${err.message}`);
          return {
            _id: company._id,
            name: company.name,
            code: company.code,
            address: company.address,
            gstNo: company.gstNo,
            status: company.status,
            adminEmail: company.adminEmail,
            usersCount: 0,
            pendingApprovals: 0,
            gatePassesCount: 0,
            activeGatePasses: 0,
            pendingReturnable: 0,
            isAvailable: false
          };
        }
      })
    );

    const activeCompaniesCount = companies.filter((c) => c.status === 'ACTIVE').length;
    const inactiveCompaniesCount = companies.length - activeCompaniesCount;

    res.status(200).json({
      success: true,
      stats: {
        totalCompanies: companies.length,
        activeCompanies: activeCompaniesCount,
        inactiveCompanies: inactiveCompaniesCount,
        totalUsers,
        pendingUserApprovals,
        totalGatePasses,
        activeGatePasses,
        pendingReturnable
      },
      companies: companyStats
    });
  } catch (error) {
    console.error('Error fetching Super Admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error loading Super Admin dashboard.', error: error.message });
  }
};

/**
 * Get All Companies
 * @route GET /api/superadmin/companies
 */
exports.getCompanies = async (req, res) => {
  try {
    const { Company } = getSuperAdminModels();
    const companies = await Company.find({}).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: companies.length, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading companies list.' });
  }
};

/**
 * Provision New Company
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

    // Provision tenant DB: initialize Mongoose models & seed initial roles & company Admin
    const tenantModels = getTenantModels(cleanCode, dbName);

    // Seed default Admin role in new tenant database
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

    // Seed company Admin user account in new tenant database
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
 * Toggle Company Status (Activate / Deactivate)
 * @route PATCH /api/superadmin/companies/:code/status
 */
exports.toggleCompanyStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const { status } = req.body; // 'ACTIVE' | 'INACTIVE'

    const { Company, SuperAdminAuditLog } = getSuperAdminModels();
    const cleanCode = String(code).toLowerCase().trim();

    const company = await Company.findOne({ code: cleanCode });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
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
      details: { companyName: company.name, newStatus },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(200).json({
      success: true,
      message: `Company '${company.name}' status set to ${newStatus}.`,
      company
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating company status.' });
  }
};

/**
 * Get Platform Audit Logs
 * @route GET /api/superadmin/audit-logs
 */
exports.getSuperAdminAuditLogs = async (req, res) => {
  try {
    const { SuperAdminAuditLog } = getSuperAdminModels();
    const logs = await SuperAdminAuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading platform audit logs.' });
  }
};
