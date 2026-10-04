import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  FileText,
  ArrowRightLeft,
  Plus,
  Power,
  LogOut,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

const SuperAdminDashboardPage = () => {
  const { superAdmin, superAdminLogout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    companies: [],
    totals: {
      totalCompanies: 0,
      activeCompanies: 0,
      totalUsers: 0,
      totalGatePasses: 0,
      totalMaterialInward: 0
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Company Provisioning Form
  const [form, setForm] = useState({
    code: '',
    name: '',
    shortCode: '',
    dbName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: 'Admin@123',
    adminPhone: '9876543210'
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await authService.getSuperAdminDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load Super Admin dashboard');
      if (err.response?.status === 401) {
        superAdminLogout();
        navigate('/superadmin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleStatus = async (company) => {
    const nextStatus = !company.isActive;
    try {
      const res = await authService.toggleCompanyStatus(company._id, nextStatus);
      if (res.success) {
        toast.success(res.message);
        loadDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company status');
    }
  };

  const handleProvisionCompany = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.shortCode || !form.adminEmail) {
      toast.error('Please complete all required company details');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.onboardCompany(form);
      if (res.success) {
        toast.success(res.message || 'Company provisioned successfully!');
        setShowModal(false);
        setForm({
          code: '',
          name: '',
          shortCode: '',
          dbName: '',
          adminName: '',
          adminEmail: '',
          adminPassword: 'Admin@123',
          adminPhone: '9876543210'
        });
        loadDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to onboard company');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = data.companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="/Maruti denim logo.png"
            alt="Maruti Denim Logo"
            className="h-10 w-auto object-contain filter drop-shadow brightness-125"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white leading-tight">Maruti Denim Super Admin</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                GLOBAL PLATFORM
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Company Architecture Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-200 block">{superAdmin?.name || 'Super Admin'}</span>
            <span className="text-[10px] text-slate-400">{superAdmin?.email}</span>
          </div>
          <button
            onClick={() => {
              superAdminLogout();
              navigate('/superadmin/login');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut size={14} /> Exit Portal
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Companies</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {data.totals.activeCompanies} / {data.totals.totalCompanies}
              </h3>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> {data.totals.activeCompanies} Active Databases
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 size={24} />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global User Accounts</p>
              <h3 className="text-2xl font-bold text-white mt-1">{data.totals.totalUsers}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Across all active tenants</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gate Passes Issued</p>
              <h3 className="text-2xl font-bold text-white mt-1">{data.totals.totalGatePasses}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Combined multi-company passes</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText size={24} />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Material Inward Records</p>
              <h3 className="text-2xl font-bold text-white mt-1">{data.totals.totalMaterialInward}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Combined inward logs</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowRightLeft size={24} />
            </div>
          </div>
        </div>

        {/* Section Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tenant or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} /> Onboard New Tenant Company
          </button>
        </div>

        {/* Companies Table */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Provisioned Company Tenants</h3>
              <p className="text-xs text-slate-400">Physical & Logical DB separation architecture</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">gatepass_superadmin_db</span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-400">Gathering live multi-company statistics...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Company & Code</th>
                    <th className="px-6 py-3.5">Database URI</th>
                    <th className="px-6 py-3.5">Total Users</th>
                    <th className="px-6 py-3.5">Gate Passes</th>
                    <th className="px-6 py-3.5">Inward Records</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCompanies.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                            {c.shortCode}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm">{c.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">Code: {c.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <Database size={13} className="text-indigo-400" />
                          <span>{c.dbName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{c.stats?.usersCount ?? 0}</td>
                      <td className="px-6 py-4 font-bold text-white">{c.stats?.gatePassesCount ?? 0}</td>
                      <td className="px-6 py-4 font-bold text-white">{c.stats?.materialInwardCount ?? 0}</td>
                      <td className="px-6 py-4">
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle size={12} /> SUSPENDED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            c.isActive
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          <Power size={13} />
                          {c.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Onboard Company Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                <h3 className="font-bold text-white text-base">Provision New Enterprise Tenant</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProvisionCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BALAJI POLYCOT PVT. LTD."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BALAJI_POLYCOT"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BPPL"
                    value={form.shortCode}
                    onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white uppercase focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Database Name (Auto-assigned if empty)</label>
                <input
                  type="text"
                  placeholder="e.g. balaji_polycot_db"
                  value={form.dbName}
                  onChange={(e) => setForm({ ...form, dbName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="font-bold text-indigo-300 mb-2">Initial Tenant Admin Credentials</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Admin Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@balajipolycot.com"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Initial Password *</label>
                    <input
                      type="text"
                      required
                      placeholder="Admin@123"
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles size={14} /> Provision Tenant
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboardPage;
