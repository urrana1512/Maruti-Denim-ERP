const express = require('express');
const router = express.Router();
const {
  superAdminLogin,
  getSuperAdminMe,
  changeSuperAdminPassword,
  getSuperAdminSessions,
  getSuperAdminDashboardStats,
  getCompanies,
  getCompanyDetails,
  createCompany,
  toggleCompanyStatus,
  getConsolidatedGatePasses,
  getConsolidatedInwardReturnables,
  getConsolidatedUsers,
  getUserDetails,
  getCompanyAdmins,
  reassignCompanyAdmin,
  getSuperAdminAuditLogs,
  getSuperAdminAlerts,
  getSuperAdminAnalytics,
  exportSuperAdminReport
} = require('../controllers/superAdminController');
const {
  getSuperAdminProfile,
  updateSuperAdminPersonal,
  uploadSuperAdminAvatar,
  changeSuperAdminPassword: changeSuperAdminPass
} = require('../controllers/superAdminProfileController');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// 1. Authentication & Security Profile
router.post('/login', superAdminLogin);
router.get('/me', protectSuperAdmin, getSuperAdminMe);
router.get('/profile', protectSuperAdmin, getSuperAdminProfile);
router.put('/profile/personal', protectSuperAdmin, updateSuperAdminPersonal);
router.post('/profile/avatar', protectSuperAdmin, uploadAvatar, uploadSuperAdminAvatar);
router.post('/profile/change-password', protectSuperAdmin, changeSuperAdminPass);
router.get('/sessions', protectSuperAdmin, getSuperAdminSessions);

// 2. Dashboard & Telemetry
router.get('/dashboard-stats', protectSuperAdmin, getSuperAdminDashboardStats);

// 3. Company Management & Read-Only Inspection
router.get('/companies', protectSuperAdmin, getCompanies);
router.get('/companies/:code/details', protectSuperAdmin, getCompanyDetails);
router.post('/companies', protectSuperAdmin, createCompany);
router.patch('/companies/:code/status', protectSuperAdmin, toggleCompanyStatus);

// 4. Consolidated Operational Monitoring
router.get('/gate-passes', protectSuperAdmin, getConsolidatedGatePasses);
router.get('/inward-returnables', protectSuperAdmin, getConsolidatedInwardReturnables);

// 5. Users & Company Admin Monitoring
router.get('/users', protectSuperAdmin, getConsolidatedUsers);
router.get('/users/:companyCode/:userId', protectSuperAdmin, getUserDetails);
router.get('/company-admins', protectSuperAdmin, getCompanyAdmins);
router.post('/company-admins/reassign', protectSuperAdmin, reassignCompanyAdmin);

// 6. Reports, Audit Logs & Alerts
router.get('/audit-logs', protectSuperAdmin, getSuperAdminAuditLogs);
router.get('/alerts', protectSuperAdmin, getSuperAdminAlerts);
router.get('/reports/analytics', protectSuperAdmin, getSuperAdminAnalytics);
router.get('/reports/export', protectSuperAdmin, exportSuperAdminReport);

module.exports = router;
