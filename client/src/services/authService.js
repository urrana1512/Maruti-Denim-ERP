import api from './api';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('maruti_auth_token', res.data.token);
      localStorage.setItem('maruti_user_data', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  adminLogin: async (email, password) => {
    const res = await api.post('/auth/admin-login', { email, password });
    if (res.data.token) {
      localStorage.setItem('maruti_auth_token', res.data.token);
      localStorage.setItem('maruti_user_data', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout request completed with local cleanup');
    } finally {
      localStorage.removeItem('maruti_auth_token');
      localStorage.removeItem('maruti_user_data');
    }
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (resetToken, newPassword) => {
    const res = await api.post('/auth/reset-password', { resetToken, newPassword });
    return res.data;
  }
};
