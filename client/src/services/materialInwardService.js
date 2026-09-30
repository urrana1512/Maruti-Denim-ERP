import api from './api';

export const materialInwardService = {
  fetchGatePass: async (gatePassNumber) => {
    const response = await api.get(`/material-inward/gate-pass/${encodeURIComponent(gatePassNumber)}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/material-inward', data);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/material-inward/${id}`);
    return response.data;
  },
  getHistory: async (gatePassNumber) => {
    const response = await api.get(`/material-inward/gate-pass/${encodeURIComponent(gatePassNumber)}/history`);
    return response.data;
  },
  approve: async (id, data = {}) => {
    const response = await api.put(`/material-inward/${id}/approve`, data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/material-inward/${id}`, data);
    return response.data;
  }
};

export const fetchGatePassByNumber = async (gatePassNumber) => {
  const response = await api.get(`/material-inward/gate-pass/${encodeURIComponent(gatePassNumber)}`);
  return response.data;
};

export const createMaterialInward = async (data) => {
  const response = await api.post('/material-inward', data);
  return response.data;
};

export const getInwardHistoryByGatePass = async (gatePassNumber) => {
  const response = await api.get(`/material-inward/gate-pass/${encodeURIComponent(gatePassNumber)}/history`);
  return response.data;
};

export const getMaterialInwardById = async (id) => {
  const response = await api.get(`/material-inward/${id}`);
  return response.data;
};

export const approveMaterialInward = async (id, data = {}) => {
  const response = await api.put(`/material-inward/${id}/approve`, data);
  return response.data;
};

export const updateMaterialInward = async (id, data) => {
  const response = await api.put(`/material-inward/${id}`, data);
  return response.data;
};
