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

  // Registration 4-Step Flow
  registerStep1Initiate: async (registrationData) => {
    const res = await api.post('/auth/register/step1-initiate', registrationData);
    return res.data;
  },

  registerStep2VerifyOtp: async (registrationToken, otp) => {
    const res = await api.post('/auth/register/step2-verify-otp', { registrationToken, otp });
    return res.data;
  },

  registerResendOtp: async (registrationToken) => {
    const res = await api.post('/auth/register/resend-otp', { registrationToken });
    return res.data;
  },

  registerStep3CreatePassword: async (verifiedRegistrationToken, password, confirmPassword) => {
    const res = await api.post('/auth/register/step3-create-password', {
      verifiedRegistrationToken,
      password,
      confirmPassword
    });
    return res.data;
  },

  // Forgot Password 3-Step Flow
  forgotPasswordStep1Request: async (email) => {
    const res = await api.post('/auth/forgot-password/step1-request', { email });
    return res.data;
  },

  forgotPasswordStep2VerifyOtp: async (resetRequestToken, otp) => {
    const res = await api.post('/auth/forgot-password/step2-verify-otp', { resetRequestToken, otp });
    return res.data;
  },

  forgotPasswordResendOtp: async (resetRequestToken) => {
    const res = await api.post('/auth/forgot-password/resend-otp', { resetRequestToken });
    return res.data;
  },

  forgotPasswordStep3ResetPassword: async (verifiedResetToken, newPassword, confirmPassword) => {
    const res = await api.post('/auth/forgot-password/step3-reset-password', {
      verifiedResetToken,
      newPassword,
      confirmPassword
    });
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
  }
};
