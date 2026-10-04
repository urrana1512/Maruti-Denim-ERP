const express = require('express');
const router = express.Router();
const {
  superAdminLogin,
  getSuperAdminMe,
  getSuperAdminDashboardStats,
  getCompanies,
  createCompany,
  toggleCompanyStatus,
  getSuperAdminAuditLogs
} = require('../controllers/superAdminController');
const { protectSuperAdmin } = require('../middleware/superAdminAuthMiddleware');

// Public Super Admin Login
router.post('/login', superAdminLogin);

// Protected Super Admin Routes
router.get('/me', protectSuperAdmin, getSuperAdminMe);
router.get('/dashboard-stats', protectSuperAdmin, getSuperAdminDashboardStats);
router.get('/companies', protectSuperAdmin, getCompanies);
router.post('/companies', protectSuperAdmin, createCompany);
router.patch('/companies/:code/status', protectSuperAdmin, toggleCompanyStatus);
router.get('/audit-logs', protectSuperAdmin, getSuperAdminAuditLogs);

module.exports = router;
