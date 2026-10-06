import api from './api';

export const superAdminService = {
  getDashboardStats: async (companyCode = 'ALL', timeframe = 'all') => {
    const res = await api.get('/superadmin/dashboard-stats', { params: { companyCode, timeframe } });
    return res.data;
  },

  getCompanies: async (params = {}) => {
    const res = await api.get('/superadmin/companies', { params });
    return res.data;
  },

  getCompanyDetails: async (code) => {
    const res = await api.get(`/superadmin/companies/${code}/details`);
    return res.data;
  },

  createCompany: async (companyData) => {
    const res = await api.post('/superadmin/companies', companyData);
    return res.data;
  },

  toggleCompanyStatus: async (code, status, confirmPassword, reason = '') => {
    const res = await api.patch(`/superadmin/companies/${code}/status`, { status, confirmPassword, reason });
    return res.data;
  },

  getConsolidatedGatePasses: async (params = {}) => {
    const res = await api.get('/superadmin/gate-passes', { params });
    return res.data;
  },

  getConsolidatedInwardReturnables: async (params = {}) => {
    const res = await api.get('/superadmin/inward-returnables', { params });
    return res.data;
  },

  getConsolidatedUsers: async (params = {}) => {
    const res = await api.get('/superadmin/users', { params });
    return res.data;
  },

  getUserDetails: async (companyCode, userId) => {
    const res = await api.get(`/superadmin/users/${companyCode}/${userId}`);
    return res.data;
  },

  getCompanyAdmins: async () => {
    const res = await api.get('/superadmin/company-admins');
    return res.data;
  },

  reassignCompanyAdmin: async (adminData) => {
    const res = await api.post('/superadmin/company-admins/reassign', adminData);
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await api.get('/superadmin/audit-logs', { params });
    return res.data;
  },

  getAlerts: async () => {
    const res = await api.get('/superadmin/alerts');
    return res.data;
  },

  getAnalytics: async (companyCode = 'ALL') => {
    const res = await api.get('/superadmin/reports/analytics', { params: { companyCode } });
    return res.data;
  },

  exportReport: async (reportType = 'gatepasses', companyCode = 'ALL') => {
    const response = await api.get('/superadmin/reports/export', {
      params: { reportType, companyCode },
      responseType: 'blob'
    });
    return response.data;
  },

  changePassword: async (passwordData) => {
    const res = await api.post('/superadmin/profile/change-password', passwordData);
    return res.data;
  },

  getSessions: async () => {
    const res = await api.get('/superadmin/sessions');
    return res.data;
  }
};
