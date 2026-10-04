import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:5000/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token and selected x-company-code header
api.interceptors.request.use(
  (config) => {
    const isSuperAdminReq = config.url && config.url.includes('/superadmin');
    const superAdminToken = localStorage.getItem('maruti_superadmin_token');
    const userToken = localStorage.getItem('maruti_auth_token');

    if (isSuperAdminReq && superAdminToken) {
      config.headers.Authorization = `Bearer ${superAdminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }

    const savedCompanyStr = localStorage.getItem('maruti_selected_company');
    if (savedCompanyStr) {
      try {
        const savedCompany = JSON.parse(savedCompanyStr);
        if (savedCompany?.code) {
          config.headers['x-company-code'] = savedCompany.code;
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthPage) {
        localStorage.removeItem('maruti_auth_token');
        localStorage.removeItem('maruti_user_data');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
