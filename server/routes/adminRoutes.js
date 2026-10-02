const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getUsers,
  approveUser,
  rejectUser,
  toggleUserStatus,
  updateUser,
  deleteUser,
  getAuditLogs,
  forceCloseGatePass
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// Protect all admin routes with authentication + admin privilege
router.use(protect);
router.use(requireAdmin);

router.get('/dashboard-stats', getAdminDashboardStats);

// User Management Routes
router.get('/users', getUsers);
router.post('/users/:id/approve', approveUser);
router.post('/users/:id/reject', rejectUser);
router.patch('/users/:id/status', toggleUserStatus);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Audit Log Routes
router.get('/audit-logs', getAuditLogs);

// Gate Pass Force Closure
router.post('/gate-passes/:id/force-close', forceCloseGatePass);

module.exports = router;
