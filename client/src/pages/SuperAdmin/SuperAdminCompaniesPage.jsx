import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  RefreshCw,
  Users,
  FileText,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminCompaniesPage = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionData, setProvisionData] = useState({
    name: '',
    code: '',
    address: '',
    gstNo: '',
    adminName: '',
    adminEmail: '',
    adminPassword: 'Admin@123'
  });
  const [provisioning, setProvisioning] = useState(false);

  // Status Toggle Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [toggling, setToggling] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getCompanies({ search, status: statusFilter });
      if (res.success) {
        setCompanies(res.companies || []);
      }
    } catch (err) {
      toast.error('Failed to load companies catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    if (!provisionData.name || !provisionData.code) {
      toast.error('Company Name and Code are required.');
      return;
    }
    setProvisioning(true);
    try {
      const res = await superAdminService.createCompany(provisionData);
      if (res.success) {
        toast.success(res.message);
        setShowProvisionModal(false);
        setProvisionData({ name: '', code: '', address: '', gstNo: '', adminName: '', adminEmail: '', adminPassword: 'Admin@123' });
        fetchCompanies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to provision company.');
    } finally {
      setProvisioning(false);
    }
  };

  const handleToggleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!confirmPassword) {
      toast.error('Please enter your Super Admin password to re-authenticate.');
      return;
    }

    setToggling(true);
    try {
      const targetStatus = selectedCompany.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await superAdminService.toggleCompanyStatus(selectedCompany.code, targetStatus, confirmPassword, reason);
      if (res.success) {
        toast.success(res.message);
        setShowStatusModal(false);
        setSelectedCompany(null);
        setConfirmPassword('');
        setReason('');
        fetchCompanies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Registry & Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Overview of provisioned corporate tenants, database statuses, assigned admins, and status controls.
          </p>
        </div>

        <button
          onClick={() => setShowProvisionModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
        >
          <Plus size={16} /> Provision New Company
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search company name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {companies.map((comp) => (
            <div
              key={comp.code}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={comp.logoUrl || '/Maruti denim logo.png'}
                      alt={comp.name}
                      className="h-10 w-10 object-contain p-1 bg-slate-50 border rounded-lg"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{comp.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">{comp.code}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      comp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Assigned Admin:</span>
                    <span className="font-bold text-slate-800">{comp.adminName || 'Admin'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Admin Email:</span>
                    <span className="font-mono text-slate-700 text-[11px]">{comp.adminEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Database:</span>
                    <span className="font-mono text-slate-600 text-[11px]">{comp.dbName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Users</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">{comp.usersCount || 0}</p>
                  </div>
                  <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Gate Passes</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">{comp.gatePassesCount || 0}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/superadmin/companies/${comp.code}/details`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  <Eye size={14} /> Telemetry & Details
                </button>

                <button
                  onClick={() => {
                    setSelectedCompany(comp);
                    setShowStatusModal(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    comp.status === 'ACTIVE'
                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <Lock size={13} />
                  {comp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Provision New Company */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Provision New Corporate Tenant</h3>
              <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maruti Nandan Denim Pvt Ltd"
                  value={provisionData.name}
                  onChange={(e) => setProvisionData({ ...provisionData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Code / Code Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. maruti_nandan"
                  value={provisionData.code}
                  onChange={(e) => setProvisionData({ ...provisionData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="24AAAAA0000A1Z5"
                    value={provisionData.gstNo}
                    onChange={(e) => setProvisionData({ ...provisionData, gstNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registered Address</label>
                  <input
                    type="text"
                    placeholder="Ahmedabad, Gujarat"
                    value={provisionData.address}
                    onChange={(e) => setProvisionData({ ...provisionData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900 mb-2">Initial Company Administrator Account</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Admin Name</label>
                    <input
                      type="text"
                      placeholder="Company Admin Name"
                      value={provisionData.adminName}
                      onChange={(e) => setProvisionData({ ...provisionData, adminName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Admin Email</label>
                    <input
                      type="email"
                      placeholder="admin@company.com"
                      value={provisionData.adminEmail}
                      onChange={(e) => setProvisionData({ ...provisionData, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisioning}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  {provisioning ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Toggle Status Re-Authentication Modal */}
      {showStatusModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 pb-2 border-b border-slate-100">
              <AlertTriangle size={22} />
              <h3 className="text-base font-bold text-slate-900">Confirm Company Status Change</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are changing status for <span className="font-bold text-slate-900">{selectedCompany.name}</span> to{' '}
              <span className="font-bold uppercase text-red-600">{selectedCompany.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}</span>.
              This is a sensitive action.
            </p>

            <form onSubmit={handleToggleStatusSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Change Note</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled maintenance / Administrative request"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Super Admin Password (Re-Authentication) *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter Super Admin Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={toggling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                >
                  {toggling ? 'Updating...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCompaniesPage;
