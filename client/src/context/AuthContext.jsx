import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('maruti_user_data');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedCompany, setSelectedCompanyState] = useState(() => {
    const saved = localStorage.getItem('maruti_selected_company');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback default
      }
    }
    return {
      code: 'MARUTI_NANDAN',
      name: 'MARUTI NANDAN DENIM PVT LTD',
      shortCode: 'MND',
      dbName: 'maruti_nandan_db'
    };
  });

  const [superAdmin, setSuperAdmin] = useState(() => {
    const saved = localStorage.getItem('maruti_superadmin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  const setSelectedCompany = (companyObj) => {
    setSelectedCompanyState(companyObj);
    if (companyObj) {
      localStorage.setItem('maruti_selected_company', JSON.stringify(companyObj));
    } else {
      localStorage.removeItem('maruti_selected_company');
    }
  };

  // Hydrate user profile on page reload
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('maruti_auth_token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('maruti_user_data', JSON.stringify(res.user));
            if (res.user.company) {
              setSelectedCompany(res.user.company);
            }
          }
        } catch (err) {
          console.warn('Session hydration failed:', err.message);
          localStorage.removeItem('maruti_auth_token');
          localStorage.removeItem('maruti_user_data');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.company) {
        setSelectedCompany(res.user.company);
      }
    }
    return res;
  };

  const adminLogin = async (email, password) => {
    const res = await authService.adminLogin(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.company) {
        setSelectedCompany(res.user.company);
      }
    }
    return res;
  };

  const superAdminLogin = async (email, password) => {
    const res = await authService.superAdminLogin(email, password);
    if (res.success && res.user) {
      setSuperAdmin(res.user);
    }
    return res;
  };

  const superAdminLogout = () => {
    authService.superAdminLogout();
    setSuperAdmin(null);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const roleCode = user.role?.code;
    const roleName = user.roleName || user.role?.name;

    if (roleCode === 'admin' || roleName === 'Admin') return true;
    const permissions = user.permissions || user.role?.permissions || [];
    return permissions.includes(permission);
  };

  const isAdmin = user && (user.roleName === 'Admin' || user.role?.code === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        selectedCompany,
        setSelectedCompany,
        superAdmin,
        superAdminLogin,
        superAdminLogout,
        login,
        adminLogin,
        register,
        logout,
        hasPermission,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
