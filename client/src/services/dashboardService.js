import api from './api';

export const fetchDashboardOverview = async (params = {}) => {
  const response = await api.get('/dashboard/overview', { params });
  return response.data;
};

export const fetchDashboardSummary = async (params = {}) => {
  const response = await api.get('/dashboard/summary', { params });
  return response.data;
};

export const fetchStatusDistribution = async (params = {}) => {
  const response = await api.get('/dashboard/status-distribution', { params });
  return response.data;
};

export const fetchGatePassTrends = async (params = {}) => {
  const response = await api.get('/dashboard/gate-pass-trends', { params });
  return response.data;
};

export const fetchMaterialReturnSummary = async (params = {}) => {
  const response = await api.get('/dashboard/material-return-summary', { params });
  return response.data;
};

export const fetchReturnTrends = async (params = {}) => {
  const response = await api.get('/dashboard/return-trends', { params });
  return response.data;
};

export const fetchOverdueReturns = async (params = {}) => {
  const response = await api.get('/dashboard/overdue-returns', { params });
  return response.data;
};

export const fetchVendorAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/vendor-analytics', { params });
  return response.data;
};

export const fetchItemAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/item-analytics', { params });
  return response.data;
};

export const fetchDepartmentAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/department-analytics', { params });
  return response.data;
};

export const fetchRecentGatePasses = async (params = {}) => {
  const response = await api.get('/dashboard/recent-gate-passes', { params });
  return response.data;
};

export const fetchRecentInwards = async (params = {}) => {
  const response = await api.get('/dashboard/recent-inwards', { params });
  return response.data;
};

export const fetchRecentActivity = async (params = {}) => {
  const response = await api.get('/dashboard/recent-activity', { params });
  return response.data;
};

export const fetchActionRequired = async (params = {}) => {
  const response = await api.get('/dashboard/action-required', { params });
  return response.data;
};
