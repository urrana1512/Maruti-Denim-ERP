import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Settings,
  Shield,
  Key,
  Laptop,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminSettingsPage = () => {
  const { superAdmin } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await superAdminService.getSessions();
        if (res.success) {
          setSessions(res.sessions || []);
        }
      } catch (e) {}
    };
    fetchSessions();
  }, []);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    setUpdating(true);
    try {
      const res = await superAdminService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      if (res.success) {
        toast.success(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Security & Profile Settings</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Root security controls, credential management, active session management, and 2FA status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <UserCheck className="text-sky-600" size={20} />
            <h3 className="text-base font-bold text-slate-900">Super Admin Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Administrator Name</p>
              <p className="font-bold text-slate-900 text-sm">{superAdmin?.name || 'Platform Super Administrator'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Root Account Email</p>
              <p className="font-mono font-bold text-indigo-700 text-sm">{superAdmin?.email}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Platform Privilege Level</p>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                SUPER_ADMIN (FULL PLATFORM MONITORING)
              </span>
            </div>
          </div>
        </div>

        {/* 2FA & Security Hardening Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Shield className="text-indigo-600" size={20} />
            <h3 className="text-base font-bold text-slate-900">Security Hardening Status</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 font-medium">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span>Password Re-Authentication Enabled for Sensitive Actions</span>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-900 font-medium">
              <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0" />
              <span>Tamper-Evident Append-Only Audit Trail Active</span>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-indigo-900 font-medium">
              <CheckCircle2 size={18} className="text-indigo-600 flex-shrink-0" />
              <span>Privacy-First PII Minimization Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <Key className="text-amber-600" size={20} />
          <h3 className="text-base font-bold text-slate-900">Update Super Admin Password</h3>
        </div>

        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs max-w-lg">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Current Password *</label>
            <input
              type="password"
              required
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">New Password *</label>
            <input
              type="password"
              required
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            {updating ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Active Sessions Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <Laptop className="text-slate-700" size={20} />
          <h3 className="text-base font-bold text-slate-900">Active Super Admin Login Sessions</h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{sess.device}</span>
                  {sess.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Current Session
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">IP Address: {sess.ipAddress}</p>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPage;
