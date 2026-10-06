import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  FileText,
  PackageCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Layers,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminDashboardPage = () => {
  const { currentCompany } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchDashboardStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await superAdminService.getDashboardStats(currentCompany);
      if (res.success) {
        setData(res);
        if (isManual) toast.success('Dashboard metrics refreshed!');
      }
    } catch (err) {
      console.error('Failed to load Super Admin stats:', err);
      toast.error('Unable to fetch live platform metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [currentCompany]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const companies = data?.companies || [];
  const recentGPs = data?.recentGatePasses || [];
  const recentLogs = data?.recentActivities || [];
  const unavailableCompanies = companies.filter(c => !c.isAvailable);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              Live Telemetry Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">
              As of {data?.asOf ? new Date(data.asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Platform Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Centralized multi-company gate pass monitoring and operational telemetry across all tenant databases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
        </div>
      </div>

      {/* Database Connection Warning Banner (Graceful Degraded State Notice) */}
      {unavailableCompanies.length > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl text-amber-900 text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Partial Telemetry Warning: </span>
              {unavailableCompanies.map(c => c.name).join(', ')} database connection currently unavailable. Metrics for other tenants are loaded normally.
            </div>
          </div>
          <button
            onClick={() => fetchDashboardStats(true)}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Tenants</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900">{stats.totalCompanies || 3}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-bold">{stats.activeCompanies || 3} Active</span>
              <span>•</span>
              <span className="text-slate-400 font-medium">{stats.inactiveCompanies || 0} Inactive</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Users</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900">{stats.totalUsers || 0}</p>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className={stats.pendingUserApprovals > 0 ? 'text-amber-600 font-bold' : 'text-slate-500 font-medium'}>
                {stats.pendingUserApprovals || 0} Pending Approvals
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Gate Passes</span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900">{stats.totalGatePasses || 0}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{stats.gatePassesToday || 0} Today</span>
              <span>•</span>
              <span>{stats.gatePassesThisMonth || 0} This Month</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Returnables</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <PackageCheck size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-amber-600">{stats.pendingReturnable || 0}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-blue-600 font-bold">{stats.activeGatePasses || 0} Active Passes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Company Wise Telemetry Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-brand-denim" /> Tenant Operations Breakdown
          </h2>
          <button
            onClick={() => navigate('/superadmin/companies')}
            className="text-xs font-bold text-brand-denim hover:underline flex items-center gap-1"
          >
            Manage Companies <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div
              key={comp.code}
              className={`bg-white p-5 rounded-2xl border transition-all ${
                comp.isAvailable ? 'border-slate-200/80 shadow-sm hover:shadow-md' : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                    {comp.code === 'maruti_nandan' ? 'MND' : comp.code === 'shri_ram' ? 'SRCF' : 'BPPL'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{comp.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">{comp.code}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    comp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {comp.status}
                </span>
              </div>

              {comp.isAvailable ? (
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Users</p>
                    <p className="text-base font-black text-slate-800 mt-0.5">{comp.usersCount}</p>
                    {comp.pendingApprovals > 0 && (
                      <span className="text-[10px] text-amber-600 font-bold">{comp.pendingApprovals} Pending</span>
                    )}
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Gate Passes</p>
                    <p className="text-base font-black text-slate-800 mt-0.5">{comp.gatePassesCount}</p>
                    <span className="text-[10px] text-blue-600 font-bold">{comp.activeGatePasses} Active</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-amber-800 font-medium">
                  Database Connection Offline
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Operational Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consolidated Gate Passes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" /> Recent Cross-Company Gate Passes
            </h3>
            <button
              onClick={() => navigate('/superadmin/gate-passes')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={13} />
            </button>
          </div>

          {recentGPs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentGPs.map((gp) => (
                <div key={`${gp.tenantCode}-${gp._id}`} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{gp.gatePassNumber}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                        {gp.tenantCode === 'maruti_nandan' ? 'Maruti' : gp.tenantCode === 'shri_ram' ? 'Shri Ram' : 'Balaji'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{gp.companyName || 'Party Name'} • {gp.passType}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        gp.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {gp.status ? gp.status.toUpperCase() : 'ACTIVE'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {gp.createdAt ? new Date(gp.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-slate-400 font-medium">No recent gate passes recorded.</p>
          )}
        </div>

        {/* System Activity Audit Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" /> Platform Audit Trail
            </h3>
            <button
              onClick={() => navigate('/superadmin/audit-logs')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Full Logs <ArrowUpRight size={13} />
            </button>
          </div>

          {recentLogs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{log.userName || 'System'}</span>
                    <span className="text-slate-400 mx-1">•</span>
                    <span className="text-slate-600 font-mono text-[11px]">{log.action}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{log.tenantName || 'Platform'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-slate-400 font-medium">No system activity logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
