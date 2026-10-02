const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Overview route (consolidated fetch for fast dashboard load)
router.get('/overview', dashboardController.getFullDashboard);

// Individual section routes
router.get('/summary', dashboardController.getSummary);
router.get('/status-distribution', dashboardController.getStatusDistribution);
router.get('/gate-pass-trends', dashboardController.getGatePassTrends);
router.get('/material-return-summary', dashboardController.getMaterialReturnSummary);
router.get('/return-trends', dashboardController.getReturnTrends);
router.get('/overdue-returns', dashboardController.getOverdueReturns);
router.get('/vendor-analytics', dashboardController.getVendorAnalytics);
router.get('/item-analytics', dashboardController.getItemAnalytics);
router.get('/department-analytics', dashboardController.getDepartmentAnalytics);
router.get('/recent-gate-passes', dashboardController.getRecentGatePasses);
router.get('/recent-inwards', dashboardController.getRecentInwards);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/action-required', dashboardController.getActionRequired);

module.exports = router;
