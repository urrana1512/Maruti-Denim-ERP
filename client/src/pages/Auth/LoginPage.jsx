import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Building2, CheckCircle2, ArrowLeft, UserPlus, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const { login, selectedCompany, setSelectedCompany } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Select Company, 2: Login Details
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load public active companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await authService.getPublicCompanies();
        if (res.success && res.data) {
          setCompanies(res.data);
          if (!selectedCompany && res.data.length > 0) {
            setSelectedCompany(res.data[0]);
          }
        }
      } catch (err) {
        setCompanies([
          { code: 'MARUTI_NANDAN', name: 'MARUTI NANDAN DENIM PVT LTD', shortCode: 'MND', status: 'ACTIVE' },
          { code: 'SHRI_RAM_COT_FAB', name: 'SHRI RAM COT FAB', shortCode: 'SRCF', status: 'ACTIVE' },
          { code: 'BALAJI_POLYCOT', name: 'BALAJI POLYCOT PVT. LTD.', shortCode: 'BPPL', status: 'ACTIVE' }
        ]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSelectCompany = (comp) => {
    setSelectedCompany(comp);
    toast.success(`Selected ${comp.name}`);
  };

  const handleProceedToCredentials = () => {
    if (!selectedCompany) {
      toast.error('Please select a company to continue.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success(res.message || 'Logged in successfully!');
        if (res.user?.roleName === 'Admin' || res.user?.role?.code === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Decorative Floating Ambient Glowing Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Single Centered 3D Card Container */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-3d overflow-hidden relative z-10 transition-all duration-300">
        
        {/* Card Header & Brand Branding */}
        <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-textile-pattern opacity-15 pointer-events-none" />
          
          <div className="relative z-10 flex justify-center mb-3">
            <img
              src="/Maruti denim logo.png"
              alt="Maruti Denim Logo"
              className="h-12 w-auto object-contain filter drop-shadow brightness-110"
            />
          </div>

          <h1 className="relative z-10 text-xl font-black uppercase tracking-wider text-white">
            Maruti Denim
          </h1>
          <p className="relative z-10 text-xs text-blue-200 mt-0.5">
            Gate Pass Management System
          </p>

          {/* Active Company Badge Banner */}
          {selectedCompany && (
            <div className="relative z-10 mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold border border-white/15">
              <Building2 size={13} className="shrink-0 text-amber-400" />
              <span className="truncate max-w-[200px]">{selectedCompany.name}</span>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-white hover:underline text-[11px] font-normal cursor-pointer ml-1"
                >
                  (Change)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Body Workspace */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* STEP 1: Select Operating Company */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 1: Select Operating Company
                </span>
                <span className="text-xs font-bold text-brand-denim bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  1 of 2
                </span>
              </div>

              {loadingCompanies ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-brand-denim border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.map((comp) => {
                    const isSelected = selectedCompany?.code === comp.code;
                    return (
                      <div
                        key={comp.code}
                        onClick={() => handleSelectCompany(comp)}
                        className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between shadow-3d-hover ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-brand-navy'
                            }`}
                          >
                            {comp.shortCode}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs leading-snug">{comp.name}</h4>
                            <p className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              Code: {comp.code}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="text-emerald-400 shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToCredentials}
                disabled={!selectedCompany}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-3d-hover"
              >
                Continue to Login Credentials ({selectedCompany?.shortCode || 'Select'})
                <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          )}

          {/* STEP 2: Enter Sign In Credentials */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 2: Sign In Credentials
                </span>
                <span className="text-xs font-bold text-brand-denim bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  2 of 2
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@marutidenim.com"
                    className="block w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim focus:border-brand-denim transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-brand-denim hover:underline font-semibold">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim focus:border-brand-denim transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-denim focus:ring-brand-denim border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2.5 block text-xs font-medium text-slate-700 cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-3 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all inline-flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft size={14} className="mr-1" /> Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-3d-hover"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      SIGN IN <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Link — No mention of Admin Panel Login */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              New employee?{' '}
              <Link to="/register" className="font-bold text-brand-denim hover:underline">
                Register for an account
              </Link>
            </p>
          </div>
        </div>

        {/* Card Footer Copyright */}
        <div className="bg-slate-50 p-3 text-center text-[11px] text-slate-400 border-t border-slate-100">
          © {new Date().getFullYear()} Maruti Denim Group. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
