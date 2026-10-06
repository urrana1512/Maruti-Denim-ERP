import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Building2,
  ArrowLeft,
  Users,
  FileText,
  PackageCheck,
  History,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminCompanyDetailPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getCompanyDetails(code);
      if (res.success) {
        setCompanyData(res);
      }
    } catch (err) {
      toast.error('Failed to load company details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const company = companyData?.company || {};
  const telemetry = companyData?.telemetry || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/superadmin/companies')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
        >
          <ArrowLeft size={16} /> Back to Companies
        </button>
        <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
          Read-Only Inspection View
        </span>
      </div>

      {/* Company Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={company.logoUrl || '/Maruti denim logo.png'}
            alt={company.name}
            className="h-16 w-16 object-contain p-2 bg-slate-50 border rounded-2xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{company.name}</h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  company.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {company.status}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 font-bold uppercase mt-1">Tenant Code: {company.code} • Database: {company.dbName}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">GSTIN: {company.gstNo || 'N/A'} • Address: {company.address || 'N/A'}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 w-full md:w-auto">
          <p className="font-bold text-slate-700">Assigned Company Administrator:</p>
          <p className="font-semibold text-slate-900">{company.adminName || 'Admin'}</p>
          <p className="font-mono text-slate-500 text-[11px]">{company.adminEmail}</p>
        </div>
      </div>

      {/* Key Telemetry Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Users</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{telemetry.usersCount || 0}</p>
          <p className="text-xs text-amber-600 font-bold mt-1">{telemetry.pendingApprovals || 0} Pending Approval</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Gate Passes</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{telemetry.gatePassesCount || 0}</p>
          <p className="text-xs text-blue-600 font-bold mt-1">{telemetry.activeGatePasses || 0} Active / Open</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Pending Returnables</span>
          <p className="text-3xl font-black text-amber-600 mt-2">{telemetry.pendingReturnable || 0}</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">{telemetry.closedGatePasses || 0} Closed Passes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Material Inward Receipts</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{telemetry.inwardCount || 0}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Tenant Database Telemetry</p>
        </div>
      </div>

      {/* Detail Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Gate Passes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-blue-600" /> Recent Gate Passes ({company.name})
          </h3>
          {telemetry.recentGatePasses && telemetry.recentGatePasses.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {telemetry.recentGatePasses.map((gp) => (
                <div key={gp._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{gp.gatePassNumber}</span>
                    <p className="text-slate-500 text-[11px]">{gp.companyName} • {gp.passType}</p>
                  </div>
                  <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 uppercase">
                    {gp.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">No gate pass records found.</p>
          )}
        </div>

        {/* User Sample (PII Masked) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Users size={16} className="text-indigo-600" /> Employee Users Sample (PII Masked)
          </h3>
          {telemetry.usersList && telemetry.usersList.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {telemetry.usersList.map((u) => (
                <div key={u._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{u.name}</span>
                    <p className="text-slate-400 text-[11px] font-mono">{u.email} • {u.roleName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">No registered users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminCompanyDetailPage;
