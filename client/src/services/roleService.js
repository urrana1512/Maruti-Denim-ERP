import api from './api';

export const roleService = {
  getRoles: async () => {
    const res = await api.get('/roles');
    return res.data;
  },

  createRole: async (roleData) => {
    const res = await api.post('/roles', roleData);
    return res.data;
  },

  updateRole: async (roleId, roleData) => {
    const res = await api.put(`/roles/${roleId}`, roleData);
    return res.data;
  },

  deleteRole: async (roleId) => {
    const res = await api.delete(`/roles/${roleId}`);
    return res.data;
  }
};
