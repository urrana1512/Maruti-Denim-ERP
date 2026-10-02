import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import { Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Reset Form
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter email.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        toast.success(res.message);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      toast.error('Token and new password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(resetToken, newPassword);
      if (res.success) {
        toast.success(res.message);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img src="/Maruti denim logo.png" alt="Maruti Denim Logo" className="h-16 w-auto mx-auto object-contain mb-3 filter drop-shadow" />
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password Reset Security</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {step === 1 && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-slate-600 mb-4">
                Enter your registered corporate email address below to receive a secure single-use password reset token.
              </p>
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@marutidenim.com"
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-navy text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 cursor-pointer"
              >
                {loading ? 'Sending Token...' : 'Generate Reset Token'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-4">
                <p className="font-semibold">Reset Token Generated!</p>
                <p className="truncate font-mono mt-1 text-[11px] bg-white p-1.5 rounded border border-blue-200 select-all">
                  {resetToken}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Single-Use Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token here"
                  className="block w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                />
              </div>

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
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-denim"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-emerald-700 cursor-pointer"
              >
                {loading ? 'Updating Password...' : 'Confirm New Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Password Reset Complete</h3>
              <p className="text-xs text-slate-600">Your account password has been updated. You can now log in with your new password.</p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-lg shadow-sm"
              >
                Proceed to Login
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
