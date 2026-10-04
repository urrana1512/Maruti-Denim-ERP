import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { ShieldAlert, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

const SuperAdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { superAdminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter Super Admin email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await superAdminLogin(email, password);
      if (res.success) {
        toast.success(res.message || 'Super Admin authenticated successfully');
        navigate('/superadmin/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Super Admin authentication failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/Maruti denim logo.png"
            alt="Maruti Denim Logo"
            className="h-16 w-auto object-contain filter drop-shadow brightness-125"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldAlert size={14} className="text-indigo-400" /> Platform Super Admin
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Multi-Company Governance</h2>
        <p className="mt-1 text-sm text-slate-400">Global Tenant Oversight & System Provisioning</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <div className="mb-6 bg-indigo-950/60 border border-indigo-500/30 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-200">Root Governance Authentication</h3>
              <p className="text-xs text-indigo-300/70">Master Multi-Tenant Key Required</p>
            </div>
            <ShieldAlert size={26} className="text-indigo-400" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Super Admin ID
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@marutidenim.com"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Security Passcode
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Authenticate Super Admin <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/select-company')}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Company Directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
