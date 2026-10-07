import api from './api';

export const profileService = {
  // Get Current Profile
  getProfile: async () => {
    const res = await api.get('/profile');
    return res.data;
  },

  // Update Personal Info
  updatePersonalInfo: async (data) => {
    const res = await api.put('/profile/personal', data);
    return res.data;
  },

  // Upload Avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  // Remove Avatar
  removeAvatar: async () => {
    const res = await api.delete('/profile/avatar');
    return res.data;
  },

  // Request Email Change (Step-Up Verification)
  requestEmailChange: async (currentPassword, newEmail) => {
    const res = await api.post('/profile/email/request-change', { currentPassword, newEmail });
    return res.data;
  },

  // Verify Email Change OTP
  verifyEmailChange: async (otp) => {
    const res = await api.post('/profile/email/verify-change', { otp });
    return res.data;
  },

  // Change Password
  changePassword: async (currentPassword, newPassword) => {
    const res = await api.put('/profile/password', { currentPassword, newPassword });
    return res.data;
  },

  // Update Preferences
  updatePreferences: async (preferences) => {
    const res = await api.put('/profile/preferences', preferences);
    return res.data;
  },

  // Super Admin Profile endpoints
  getSuperAdminProfile: async () => {
    const res = await api.get('/superadmin/profile');
    return res.data;
  },

  updateSuperAdminPersonal: async (data) => {
    const res = await api.put('/superadmin/profile/personal', data);
    return res.data;
  },

  uploadSuperAdminAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post('/superadmin/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  removeSuperAdminAvatar: async () => {
    const res = await api.delete('/superadmin/profile/avatar');
    return res.data;
  },

  changeSuperAdminPassword: async (currentPassword, newPassword) => {
    const res = await api.post('/superadmin/profile/change-password', { currentPassword, newPassword });
    return res.data;
  }
};
