const dashboardService = require('../services/dashboardService');

/**
 * Controller to handle all dashboard API requests
 */
const getFullDashboard = async (req, res) => {
  try {
    const filters = req.query || {};

    const [
      summary,
      statusDistribution,
      gatePassTrends,
      materialReturnSummary,
      returnTrends,
      overdueReturns,
      vendorAnalytics,
      itemAnalytics,
      departmentAnalytics,
      recentGatePasses,
      recentInwards,
      recentActivity,
      actionRequired
    ] = await Promise.all([
      dashboardService.getDashboardSummary(filters),
      dashboardService.getStatusDistribution(filters),
      dashboardService.getGatePassTrends(filters),
      dashboardService.getMaterialReturnSummary(filters),
      dashboardService.getReturnTrends(filters),
      dashboardService.getOverdueReturns(filters),
      dashboardService.getVendorAnalytics(filters),
      dashboardService.getItemAnalytics(filters),
      dashboardService.getDepartmentAnalytics(filters),
      dashboardService.getRecentGatePasses(10),
      dashboardService.getRecentInwards(10),
      dashboardService.getRecentActivity(15),
      dashboardService.getActionRequired(10)
    ]);

    res.json({
      success: true,
      data: {
        summary,
        statusDistribution,
        gatePassTrends,
        materialReturnSummary,
        returnTrends,
        overdueReturns,
        vendorAnalytics,
        itemAnalytics,
        departmentAnalytics,
        recentGatePasses,
        recentInwards,
        recentActivity,
        actionRequired
      }
    });
  } catch (error) {
    console.error('Error fetching full dashboard overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.query);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary', error: error.message });
  }
};

const getStatusDistribution = async (req, res) => {
  try {
    const distribution = await dashboardService.getStatusDistribution(req.query);
    res.json({ success: true, data: distribution });
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status distribution', error: error.message });
  }
};

const getGatePassTrends = async (req, res) => {
  try {
    const trends = await dashboardService.getGatePassTrends(req.query);
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Error fetching gate pass trends:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gate pass trends', error: error.message });
  }
};

const getMaterialReturnSummary = async (req, res) => {
  try {
    const returnSummary = await dashboardService.getMaterialReturnSummary(req.query);
    res.json({ success: true, data: returnSummary });
  } catch (error) {
    console.error('Error fetching material return summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch material return summary', error: error.message });
  }
};

const getReturnTrends = async (req, res) => {
  try {
    const trends = await dashboardService.getReturnTrends(req.query);
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Error fetching return trends:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch return trends', error: error.message });
  }
};

const getOverdueReturns = async (req, res) => {
  try {
    const overdue = await dashboardService.getOverdueReturns(req.query);
    res.json({ success: true, data: overdue });
  } catch (error) {
    console.error('Error fetching overdue returns:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overdue returns', error: error.message });
  }
};

const getVendorAnalytics = async (req, res) => {
  try {
    const analytics = await dashboardService.getVendorAnalytics(req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor analytics', error: error.message });
  }
};

const getItemAnalytics = async (req, res) => {
  try {
    const analytics = await dashboardService.getItemAnalytics(req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching item analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item analytics', error: error.message });
  }
};

const getDepartmentAnalytics = async (req, res) => {
  try {
    const analytics = await dashboardService.getDepartmentAnalytics(req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching department analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department analytics', error: error.message });
  }
};

const getRecentGatePasses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const gatePasses = await dashboardService.getRecentGatePasses(limit);
    res.json({ success: true, data: gatePasses });
  } catch (error) {
    console.error('Error fetching recent gate passes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent gate passes', error: error.message });
  }
};

const getRecentInwards = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const inwards = await dashboardService.getRecentInwards(limit);
    res.json({ success: true, data: inwards });
  } catch (error) {
    console.error('Error fetching recent inwards:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent inwards', error: error.message });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const activity = await dashboardService.getRecentActivity(limit);
    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity', error: error.message });
  }
};

const getActionRequired = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const actions = await dashboardService.getActionRequired(limit);
    res.json({ success: true, data: actions });
  } catch (error) {
    console.error('Error fetching action required list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch action required items', error: error.message });
  }
};

module.exports = {
  getFullDashboard,
  getSummary,
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
