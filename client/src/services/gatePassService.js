import api from './api';

export const gatePassService = {
  create: async (data) => {
    const response = await api.post('/gate-passes', data);
    return response.data;
  },
  getAll: async (params) => {
    const response = await api.get('/gate-passes', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/gate-passes/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/gate-passes/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/gate-passes/${id}`);
    return response.data;
  }
};
