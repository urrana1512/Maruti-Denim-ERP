import axios from 'axios';

const API_URL = '/api/master-data';

export const masterDataService = {
  // Items
  getItems: async (params = {}) => {
    const res = await axios.get(`${API_URL}/items`, { params });
    return res.data;
  },

  getActiveItems: async () => {
    const res = await axios.get(`${API_URL}/items/active`);
    return res.data;
  },

  getItemById: async (id) => {
    const res = await axios.get(`${API_URL}/items/${id}`);
    return res.data;
  },

  createItem: async (data) => {
    const res = await axios.post(`${API_URL}/items`, data);
    return res.data;
  },

  updateItem: async (id, data) => {
    const res = await axios.put(`${API_URL}/items/${id}`, data);
    return res.data;
  },

  updateItemStatus: async (id, status) => {
    const res = await axios.patch(`${API_URL}/items/${id}/status`, { status });
    return res.data;
  },

  deleteItem: async (id) => {
    const res = await axios.delete(`${API_URL}/items/${id}`);
    return res.data;
  },

  importItems: async (items) => {
    const res = await axios.post(`${API_URL}/items/import`, { items });
    return res.data;
  },

  // Vendors
  getVendors: async (params = {}) => {
    const res = await axios.get(`${API_URL}/vendors`, { params });
    return res.data;
  },

  getActiveVendors: async () => {
    const res = await axios.get(`${API_URL}/vendors/active`);
    return res.data;
  },

  getVendorById: async (id) => {
    const res = await axios.get(`${API_URL}/vendors/${id}`);
    return res.data;
  },

  createVendor: async (data) => {
    const res = await axios.post(`${API_URL}/vendors`, data);
    return res.data;
  },

  updateVendor: async (id, data) => {
    const res = await axios.put(`${API_URL}/vendors/${id}`, data);
    return res.data;
  },

  updateVendorStatus: async (id, status) => {
    const res = await axios.patch(`${API_URL}/vendors/${id}/status`, { status });
    return res.data;
  },

  deleteVendor: async (id) => {
    const res = await axios.delete(`${API_URL}/vendors/${id}`);
    return res.data;
  },

  // Audit history
  getAuditHistory: async (entityType, entityId) => {
    const res = await axios.get(`${API_URL}/audit/${entityType}/${entityId}`);
    return res.data;
  }
};
