import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, Briefcase, Lock, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
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
  const [step, setStep] = useState(1); // 1: Details, 2: OTP, 3: Create Password, 4: Success
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

  // Timers
  const [otpTimer, setOtpTimer] = useState(600); // 10 min OTP expiry
  const [cooldownTimer, setCooldownTimer] = useState(60); // 60s resend cooldown
  const [isCooldownActive, setIsCooldownActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (step === 2 && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  // Resend Cooldown Timer
  useEffect(() => {
    let timer;
    if (step === 2 && cooldownTimer > 0) {
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

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // STEP 1: Submit Registration Details -> Send OTP
  const handleStep1Submit = async (e) => {
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
        setStep(2);
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

  // STEP 2: Verify OTP
  const handleStep2VerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpValue.length < 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.registerStep2VerifyOtp(registrationToken, otpValue);

      if (res.success) {
        setVerifiedToken(res.verifiedRegistrationToken);
        setStep(3);
        toast.success('Email verified successfully! Please set a strong password.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid verification code.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 Resend OTP
  const handleResendOtp = async () => {
    if (isCooldownActive) return;
    setErrorMessage('');
    setLoading(true);

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

  // STEP 3: Create Password & Finish Registration
  const handleStep3CreatePassword = async (e) => {
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
        setStep(4);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <img src="/Maruti denim logo.png" alt="Maruti Denim Logo" className="h-16 w-auto mx-auto object-contain mb-3 filter drop-shadow" />
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Registration Portal</h2>
        <p className="mt-1 text-sm text-slate-600">Register to access the Maruti Denim Gate Pass Management System</p>
      </div>

      {/* Wizard Progress Indicator */}
      {step <= 3 && (
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span className={step >= 1 ? 'text-brand-denim font-bold' : ''}>1. Personal Info</span>
            <span className={step >= 2 ? 'text-brand-denim font-bold' : ''}>2. Email Verification</span>
            <span className={step >= 3 ? 'text-brand-denim font-bold' : ''}>3. Create Password</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-navy h-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">

          {/* STEP 1: Personal Registration Details */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={handleStep1Submit}>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Step 1: Account Information</h3>
                  <p className="text-xs text-slate-500">Provide your official employee details</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-denim">
                  <User size={18} />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gmail / Corporate Email
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rajesh@gmail.com"
                      className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 size={18} />
                    </div>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim bg-white"
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
                    Designation
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase size={18} />
                    </div>
                    <input
                      type="text"
                      name="designation"
                      required
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Purchase Officer"
                      className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-navy hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-denim disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Verify Email & Continue <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Email OTP Verification */}
          {step === 2 && (
            <form className="space-y-4 text-center" onSubmit={handleStep2VerifyOtp}>
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-denim">
                  <ShieldCheck size={24} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900">Step 2: Enter Verification Code</h3>
              <p className="text-xs text-slate-600">
                We sent a 6-digit OTP code to <strong className="text-slate-900">{maskedEmail}</strong>.
              </p>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700 text-left">
                  {errorMessage}
                </div>
              )}

              <OtpInput value={otpValue} onChange={setOtpValue} disabled={loading} />

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

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all inline-flex items-center justify-center"
                >
                  <ArrowLeft size={14} className="mr-1" /> Edit Info
                </button>

                <button
                  type="submit"
                  disabled={loading || otpValue.length < 6}
                  className="w-2/3 py-2.5 px-4 bg-brand-navy text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Create Password */}
          {step === 3 && (
            <form className="space-y-4" onSubmit={handleStep3CreatePassword}>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Step 3: Create Account Password</h3>
                  <p className="text-xs text-slate-500">Email verified! Set your account password.</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Lock size={18} />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Create Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 10 chars, uppercase, number, symbol"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter created password"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">Passwords do not match</p>
                )}
              </div>

              <PasswordStrengthMeter password={formData.password} />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || formData.password !== formData.confirmPassword}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Complete Registration & Submit for Approval'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Email Verified Successfully!</h3>
              <p className="text-sm text-slate-600">Your account registration is now <strong className="text-amber-700 font-bold">Pending Admin Approval</strong>.</p>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900 space-y-1.5">
                <p className="font-bold text-amber-950">Next Steps:</p>
                <p>• An Administrator has been notified of your registration request.</p>
                <p>• Once an Admin reviews and approves your account, your access will be activated.</p>
                <p>• You will receive an email notification when your account is ready for sign in.</p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-brand-navy text-white font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-all text-sm mt-4"
              >
                Proceed to Login Page
              </Link>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-denim hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
