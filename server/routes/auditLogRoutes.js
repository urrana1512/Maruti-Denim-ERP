const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getMyActivity,
  getCompanyAuditLogs,
  getRecordTimeline,
  exportAuditLogs,
  rejectModification
} = require('../controllers/auditLogController');

router.use(protect);

// Employee Activity Log (Own activity)
router.get('/my-activity', getMyActivity);

// Record Timeline
router.get('/timeline/:module/:entityId', getRecordTimeline);

// Company Admin Audit Logs (Company-Wide)
router.get('/', requireAdmin, getCompanyAuditLogs);
router.get('/export', requireAdmin, exportAuditLogs);

// Immutability Safety: Reject any modification attempts
router.use((req, res, next) => {
  if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return rejectModification(req, res);
  }
  next();
});

module.exports = router;
