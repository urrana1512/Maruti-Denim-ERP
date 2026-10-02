import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard-stats');
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  approveUser: async (userId, roleId) => {
    const res = await api.post(`/admin/users/${userId}/approve`, { roleId });
    return res.data;
  },

  rejectUser: async (userId, rejectionReason) => {
    const res = await api.post(`/admin/users/${userId}/reject`, { rejectionReason });
    return res.data;
  },

  toggleUserStatus: async (userId, status) => {
    const res = await api.patch(`/admin/users/${userId}/status`, { status });
    return res.data;
  },

  updateUser: async (userId, data) => {
    const res = await api.put(`/admin/users/${userId}`, data);
    return res.data;
  },

  deleteUser: async (userId) => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  forceCloseGatePass: async (gatePassId, reason) => {
    const res = await api.post(`/admin/gate-passes/${gatePassId}/force-close`, { reason });
    return res.data;
  }
};
