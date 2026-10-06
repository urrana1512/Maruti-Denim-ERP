import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Building2,
  RefreshCw,
  UserCheck,
  Lock,
  XCircle,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminCompanyAdminsPage = () => {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);

  // Reassign Modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('Admin@123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getCompanyAdmins();
      if (res.success) {
        setAdmins(res.admins || []);
      }
    } catch (err) {
      toast.error('Failed to load company administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenReassignModal = (admin) => {
    setSelectedAdmin(admin);
    setNewAdminName(admin.adminName || '');
    setNewAdminEmail(admin.adminEmail || '');
    setNewAdminPassword('Admin@123');
    setConfirmPassword('');
    setReason('');
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!newAdminEmail || !confirmPassword) {
      toast.error('Admin email and Super Admin password confirmation are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await superAdminService.reassignCompanyAdmin({
        companyCode: selectedAdmin.companyCode,
        adminName: newAdminName,
        adminEmail: newAdminEmail,
        adminPassword: newAdminPassword,
        confirmPassword,
        reason
      });

      if (res.success) {
        toast.success(res.message);
        setShowReassignModal(false);
        fetchAdmins();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign company admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Administrator Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Monitor assigned corporate Company Administrators and execute secure admin reassignment workflows.
          </p>
        </div>

        <button
          onClick={fetchAdmins}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      {/* Admin Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {admins.map((adm) => (
            <div key={adm.companyCode} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <img
                      src={adm.logoUrl || '/Maruti denim logo.png'}
                      alt={adm.companyName}
                      className="h-9 w-9 object-contain p-1 bg-slate-50 border rounded-lg"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{adm.companyName}</h3>
                      <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">{adm.companyCode}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {adm.status}
                  </span>
                </div>

                <div className="pt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <UserCheck size={16} className="text-sky-600" />
                    <span>{adm.adminName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Mail size={14} className="text-slate-400" />
                    <span>{adm.adminEmailMasked}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Phone size={14} className="text-slate-400" />
                    <span>{adm.adminPhoneMasked}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <p><span className="font-bold text-slate-700">Company Status:</span> {adm.companyStatus}</p>
                    <p><span className="font-bold text-slate-700">Last Active:</span> {adm.lastLoginAt ? new Date(adm.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenReassignModal(adm)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Lock size={14} /> Reassign / Change Admin
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reassign Admin Modal with Password Re-Authentication */}
      {showReassignModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <ShieldCheck size={20} />
                <h3 className="text-base font-bold text-slate-900">Reassign Company Administrator</h3>
              </div>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reassigning Administrator for <span className="font-bold text-slate-900">{selectedAdmin.companyName}</span>.
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Admin Email Address *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Set New Admin Password</label>
                <input
                  type="text"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Reassignment</label>
                <input
                  type="text"
                  placeholder="e.g. Administrator replacement requested by company"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="font-bold text-red-700 block mb-1">Super Admin Password (Security Confirmation) *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your Super Admin Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCompanyAdminsPage;
