import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Lock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Check,
  LogIn
} from 'lucide-react';
import OtpInput from '../../components/common/OtpInput';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';

const DEPARTMENTS = [
  'Store',
  'Purchase',
  'Maintenance',
  'Accounts',
  'Operations',
  'Quality Control',
  'IT',
  'HR & Admin'
];

const RegisterPage = () => {
  const { selectedCompany, setSelectedCompany } = useAuth();

  const [step, setStep] = useState(1); // 1: Select Company, 2: Details, 3: OTP, 4: Password, 5: Success
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Store',
    designation: '',
    password: '',
    confirmPassword: ''
  });

  const [registrationToken, setRegistrationToken] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');

  // OTP Error/Success Animation States
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Timers
  const [otpTimer, setOtpTimer] = useState(600); // 10 min OTP expiry
  const [cooldownTimer, setCooldownTimer] = useState(60); // 60s resend cooldown
  const [isCooldownActive, setIsCooldownActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Load companies for Step 1
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

  // OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (step === 3 && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  // Resend Cooldown Timer
  useEffect(() => {
    let timer;
    if (step === 3 && cooldownTimer > 0) {
      timer = setInterval(() => {
        setCooldownTimer((prev) => prev - 1);
      }, 1000);
    } else if (cooldownTimer === 0) {
      setIsCooldownActive(false);
    }
    return () => clearInterval(timer);
  }, [step, cooldownTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleSelectCompany = (comp) => {
    setSelectedCompany(comp);
    toast.success(`Selected ${comp.name}`);
  };

  const handleProceedToDetails = () => {
    if (!selectedCompany) {
      toast.error('Please select a company to continue.');
      return;
    }
    setStep(2);
  };

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // STEP 2: Submit Registration Details -> Send OTP
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name || !formData.email || !formData.phone || !formData.department || !formData.designation) {
      toast.error('Please fill in all registration fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.registerStep1Initiate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation
      });

      if (res.success) {
        setRegistrationToken(res.registrationToken);
        setMaskedEmail(res.maskedEmail || formData.email);
        setOtpTimer(res.expiresInSeconds || 600);
        setCooldownTimer(60);
        setIsCooldownActive(true);
        setOtpError(false);
        setOtpSuccess(false);
        setStep(3);
        toast.success(res.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initiate registration.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Verify OTP
  const handleStep3VerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpValue.length < 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setOtpError(false);

    try {
      const res = await authService.registerStep2VerifyOtp(registrationToken, otpValue);

      if (res.success) {
        setOtpSuccess(true);
        setVerifiedToken(res.verifiedRegistrationToken);
        toast.success('Email verified successfully!');
        setTimeout(() => {
          setStep(4);
        }, 400);
      }
    } catch (err) {
      setOtpError(true);
      const msg = err.response?.data?.message || 'Invalid verification code.';
      setErrorMessage(msg);
      toast.error(msg);
      setTimeout(() => setOtpError(false), 1000);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 Resend OTP
  const handleResendOtp = async () => {
    if (isCooldownActive) return;
    setErrorMessage('');
    setLoading(true);
    setOtpError(false);

    try {
      const res = await authService.registerResendOtp(registrationToken);
      if (res.success) {
        setOtpTimer(600);
        setCooldownTimer(60);
        setIsCooldownActive(true);
        setOtpValue('');
        toast.success(res.message || 'Fresh OTP sent to your email.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 4: Create Password & Finish Registration
  const handleStep4CreatePassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in both password fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 10) {
      setErrorMessage('Password must be at least 10 characters long.');
      toast.error('Password must be at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.registerStep3CreatePassword(
        verifiedToken,
        formData.password,
        formData.confirmPassword
      );

      if (res.success) {
        setStep(5);
        toast.success('Account created! Awaiting Admin Approval.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create password.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Company' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Verify' },
    { num: 4, label: 'Password' }
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Decorative Floating Ambient Glowing Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Single Centered 3D Card Container */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-3d overflow-hidden relative z-10 transition-all duration-300">
        
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
            Employee Registration
          </h1>
          <p className="relative z-10 text-xs text-blue-200 mt-0.5">
            Maruti Denim Gate Pass Management System
          </p>

          {/* Active Company Badge Banner */}
          {selectedCompany && (
            <div className="relative z-10 mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold border border-white/15">
              <Building2 size={13} className="shrink-0 text-amber-400" />
              <span className="truncate max-w-[200px]">{selectedCompany.name}</span>
              {step > 1 && (
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

        {/* 4-Step Connected Progress Line */}
        {step <= 4 && (
          <div className="bg-slate-100/80 px-6 py-3 border-b border-slate-200/80">
            <div className="flex items-center justify-between relative max-w-xs mx-auto">
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-300 z-0" />
              <div
                className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-slate-900 z-0 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />

              {stepsList.map((s) => {
                const isDone = step > s.num;
                const isCurrent = step === s.num;
                return (
                  <div key={s.num} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                        isDone
                          ? 'bg-slate-900 text-white ring-2 ring-slate-900'
                          : isCurrent
                          ? 'bg-brand-denim text-white ring-4 ring-blue-100 shadow-md animate-pulse-glow'
                          : 'bg-white text-slate-400 border-2 border-slate-300'
                      }`}
                    >
                      {isDone ? <Check size={13} /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] font-semibold mt-1 ${
                        isCurrent ? 'text-slate-900 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card Body Workspace */}
        <div className="p-6 sm:p-8 space-y-5">
          
          {/* STEP 1: Select Operating Company */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 1: Select Operating Company
                </span>
                <span className="text-xs font-bold text-brand-denim bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  1 of 4
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
                onClick={handleProceedToDetails}
                disabled={!selectedCompany}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-3d-hover"
              >
                Next: Enter Employee Details ({selectedCompany?.shortCode || 'Select'})
                <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          )}

          {/* STEP 2: Personal Registration Details */}
          {step === 2 && (
            <form className="space-y-4" onSubmit={handleStep2Submit}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 2: Account Details
                </span>
                <span className="text-xs font-bold text-brand-denim bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  2 of 4
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gmail / Email *
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rajesh@gmail.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 size={18} />
                    </div>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim font-medium"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Designation *
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase size={18} />
                    </div>
                    <input
                      type="text"
                      name="designation"
                      required
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Purchase Officer"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim font-medium"
                    />
                  </div>
                </div>
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
                  className="w-2/3 flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-3d-hover"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Verify Email OTP <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Email OTP Verification */}
          {step === 3 && (
            <form className="space-y-4 text-center" onSubmit={handleStep3VerifyOtp}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-left">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 3: Verification Code
                </span>
                <span className="text-xs font-bold text-brand-denim bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  3 of 4
                </span>
              </div>

              <div className="flex justify-center my-1">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-denim shadow-sm">
                  <ShieldCheck size={24} />
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                We sent a 6-digit OTP code to <strong className="text-slate-900">{maskedEmail}</strong> for {selectedCompany?.name}.
              </p>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 text-left">
                  {errorMessage}
                </div>
              )}

              <OtpInput
                value={otpValue}
                onChange={setOtpValue}
                disabled={loading}
                isError={otpError}
                isSuccess={otpSuccess}
              />

              <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                <span>Code expires in: <strong className="font-mono text-slate-800">{formatTime(otpTimer)}</strong></span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isCooldownActive || loading}
                  className="inline-flex items-center font-semibold text-brand-denim hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  <RefreshCw size={12} className="mr-1" />
                  {isCooldownActive ? `Resend OTP (${cooldownTimer}s)` : 'Resend OTP'}
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 px-3 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all inline-flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft size={14} className="mr-1" /> Edit Details
                </button>

                <button
                  type="submit"
                  disabled={loading || otpValue.length < 6}
                  className="w-2/3 py-3.5 px-4 bg-slate-900 text-white text-sm font-bold rounded-2xl shadow-md hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center shadow-3d-hover"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify Code & Continue'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Create Password */}
          {step === 4 && (
            <form className="space-y-4" onSubmit={handleStep4CreatePassword}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 4: Password Setup
                </span>
                <span className="text-xs font-bold text-brand-denim bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  4 of 4
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Create Password *
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 10 chars, uppercase, number, symbol"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter created password"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-denim font-medium"
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">Passwords do not match</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                    <Check size={12} /> Passwords match
                  </p>
                )}
              </div>

              <PasswordStrengthMeter password={formData.password} />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || formData.password !== formData.confirmPassword}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-3d-hover"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Complete Registration & Submit'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: Success Screen */}
          {step === 5 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Registration Submitted!</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Your employee account under <strong className="text-slate-900">{selectedCompany?.name}</strong> is now <strong className="text-amber-700 font-bold">Pending Admin Approval</strong>.
              </p>

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 space-y-1.5 shadow-sm">
                <p className="font-bold text-amber-950">Next Steps:</p>
                <p>• Company Administrators have been notified of your registration request.</p>
                <p>• Once approved, your account will be activated and an email notification sent.</p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-slate-900 text-white font-bold rounded-2xl shadow-md hover:bg-slate-800 transition-all text-sm mt-4 shadow-3d-hover"
              >
                Proceed to Sign In
              </Link>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-denim hover:underline">
                Sign In
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

export default RegisterPage;
