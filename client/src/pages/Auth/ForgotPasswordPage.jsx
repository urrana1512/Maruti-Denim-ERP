import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import { Mail, ArrowLeft, KeyRound, CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import OtpInput from '../../components/common/OtpInput';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password, 4: Success
  const [email, setEmail] = useState('');
  const [resetRequestToken, setResetRequestToken] = useState('');
  const [verifiedResetToken, setVerifiedResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Timers
  const [otpTimer, setOtpTimer] = useState(600);
  const [cooldownTimer, setCooldownTimer] = useState(60);
  const [isCooldownActive, setIsCooldownActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // OTP Expiry Countdown
  useEffect(() => {
    let timer;
    if (step === 2 && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  // Resend Cooldown
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // STEP 1: Request Password Reset OTP
  const handleStep1Request = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPasswordStep1Request(email);
      if (res.success) {
        setResetRequestToken(res.resetRequestToken);
        setMaskedEmail(res.maskedEmail || email);
        setOtpTimer(res.expiresInSeconds || 600);
        setCooldownTimer(60);
        setIsCooldownActive(true);
        setStep(2);
        toast.success(res.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing password reset request.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify Reset OTP
  const handleStep2VerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpValue.length < 6) {
      toast.error('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPasswordStep2VerifyOtp(resetRequestToken, otpValue);
      if (res.success) {
        setVerifiedResetToken(res.verifiedResetToken);
        setStep(3);
        toast.success('OTP verified successfully! Please enter your new password.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP code.';
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
      const res = await authService.forgotPasswordResendOtp(resetRequestToken);
      if (res.success) {
        setOtpTimer(600);
        setCooldownTimer(60);
        setIsCooldownActive(true);
        setOtpValue('');
        toast.success(res.message || 'Fresh OTP code sent.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend reset OTP.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleStep3ResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || !confirmPassword) {
      toast.error('Please enter both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    if (newPassword.length < 10) {
      setErrorMessage('Password must be at least 10 characters long.');
      toast.error('Password must be at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPasswordStep3ResetPassword(
        verifiedResetToken,
        newPassword,
        confirmPassword
      );

      if (res.success) {
        setStep(4);
        toast.success('Password updated! Please log in.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img src="/Maruti denim logo.png" alt="Maruti Denim Logo" className="h-16 w-auto mx-auto object-contain mb-3 filter drop-shadow" />
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password Reset Security</h2>
        <p className="mt-1 text-sm text-slate-600">Enterprise Self-Service Security Recovery</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">

          {/* STEP 1: Enter Registered Email */}
          {step === 1 && (
            <form onSubmit={handleStep1Request} className="space-y-4">
              <p className="text-xs text-slate-600 mb-4">
                Enter your registered corporate email address below to receive a secure 6-digit OTP verification code.
              </p>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="name@marutidenim.com"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-navy text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send Password Reset OTP'
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify Reset OTP */}
          {step === 2 && (
            <form onSubmit={handleStep2VerifyOtp} className="space-y-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <KeyRound size={24} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900">Enter Password Reset OTP</h3>
              <p className="text-xs text-slate-600">
                If <strong className="text-slate-900">{maskedEmail}</strong> is registered, a single-use 6-digit OTP code was sent.
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
                  <ArrowLeft size={14} className="mr-1" /> Back
                </button>

                <button
                  type="submit"
                  disabled={loading || otpValue.length < 6}
                  className="w-2/3 py-2.5 px-4 bg-brand-navy text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify Reset OTP'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form onSubmit={handleStep3ResetPassword} className="space-y-4">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Set New Password</h3>
                  <p className="text-xs text-slate-500">OTP verified. Enter your new password.</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-denim">
                  <ShieldCheck size={18} />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Min 10 chars, uppercase, number, symbol"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Re-enter new password"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">Passwords do not match</p>
                )}
              </div>

              <PasswordStrengthMeter password={newPassword} />

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword}
                className="w-full py-2.5 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Update Password & Invalidate Other Sessions'
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Password Reset Complete</h3>
              <p className="text-xs text-slate-600">
                Your password has been updated securely. All previous active login sessions for your account have been invalidated.
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-all"
              >
                Proceed to Sign In
              </Link>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link to="/login" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft size={14} className="mr-1" /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
