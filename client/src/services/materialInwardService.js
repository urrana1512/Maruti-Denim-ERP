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
