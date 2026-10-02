import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle2,
  PackageCheck,
  Users,
  UserCheck,
  ArrowUpRight,
  Activity,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load admin dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-card rounded-xl border border-border-subtle animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentActivities = data?.recentActivities || [];
  const returnableBreakdown = data?.returnableBreakdown || [
    { name: 'Fully Returned / Closed', value: stats.closedGatePasses || 0, color: '#10b981' },
    { name: 'Partially Returned', value: 0, color: '#f59e0b' },
    { name: 'Pending Returnable', value: stats.pendingGatePasses || 0, color: '#ef4444' }
  ];

  const totalBreakdown = returnableBreakdown.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">System Admin Overview</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Real-time enterprise metrics, user approvals, and audit statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-md border border-border-subtle shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={16} /> Refresh Data
          </button>
          <Link
            to="/admin/users?status=PENDING_APPROVAL"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserCheck size={16} /> Approve Users ({stats.pendingUserApprovals || 0})
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid matching user panel Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Total Gate Passes</span>
            <div className="p-3 bg-brand-denim-light rounded-full text-brand-denim">
              <FileText size={20} />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-navy mt-2">{stats.totalGatePasses || 0}</h3>
          <div className="mt-3 text-xs sm:text-sm text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>All historical & active passes</span>
            <Link to="/admin/gate-passes" className="text-brand-denim hover:underline font-semibold flex items-center">
              View All <ArrowUpRight size={14} className="ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Active / Pending Return</span>
            <div className="p-3 bg-amber-50 rounded-full text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">{stats.pendingGatePasses || 0}</h3>
          <div className="mt-3 text-xs sm:text-sm text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Returnable items outside</span>
            <Link to="/admin/returnable-materials" className="text-amber-600 hover:underline font-semibold flex items-center">
              Track Inward <ArrowUpRight size={14} className="ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Closed Gate Passes</span>
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">{stats.closedGatePasses || 0}</h3>
          <div className="mt-3 text-xs sm:text-sm text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Fully returned & archived</span>
            <span className="font-semibold text-emerald-700">100% Completed</span>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Total Registered Users</span>
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              <Users size={20} />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-navy mt-2">{stats.totalUsers || 0}</h3>
          <div className="mt-3 text-xs sm:text-sm text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Enterprise user accounts</span>
            <Link to="/admin/users" className="text-indigo-600 hover:underline font-semibold flex items-center">
              Manage Users <ArrowUpRight size={14} className="ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Pending User Approvals</span>
            <div className="p-3 bg-rose-50 rounded-full text-rose-600">
              <UserCheck size={20} />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2">{stats.pendingUserApprovals || 0}</h3>
          <div className="mt-3 text-xs sm:text-sm text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Awaiting Admin verification</span>
            <Link to="/admin/users?status=PENDING_APPROVAL" className="text-rose-600 hover:underline font-semibold flex items-center">
              Review Requests <ArrowUpRight size={14} className="ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Quick Shortcuts</span>
            <div className="p-3 bg-slate-100 rounded-full text-slate-700">
              <SlidersHorizontal size={20} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/gate-pass/add" className="px-3 py-2 bg-brand-navy text-white text-xs font-semibold rounded-md text-center hover:bg-slate-800 transition-colors">
              + New Pass
            </Link>
            <Link to="/admin/roles" className="px-3 py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded-md text-center hover:bg-slate-200 transition-colors">
              Manage RBAC
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Card */}
        <div className="bg-surface-card p-5 sm:p-6 rounded-xl border border-border-subtle shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-brand-navy mb-1">Returnable Status Breakdown</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">Stock status distribution</p>

            <div className="space-y-4 py-2">
              {returnableBreakdown.map((item, idx) => {
                const percentage = Math.round(((item.value || 0) / totalBreakdown) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                      <span className="text-slate-700 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-900">{item.value || 0} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center font-medium">
            Real-time database status
          </div>
        </div>

        {/* Activity Audit Log Feed */}
        <div className="bg-surface-card p-5 sm:p-6 rounded-xl border border-border-subtle shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-brand-navy">Recent System Audit Feed</h2>
              <p className="text-xs sm:text-sm text-slate-500">Live operational & security action logs</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs sm:text-sm text-brand-denim font-semibold hover:underline">
              View Audit Trail →
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-400 py-6 text-center">No recent audit log entries recorded.</p>
            ) : (
              recentActivities.map((log) => (
                <div key={log._id} className="p-3 bg-surface-bg rounded-lg border border-border-subtle flex items-start justify-between text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <Activity size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-500 ml-1">by {log.userName || log.userEmail || 'System'}</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {log.details ? JSON.stringify(log.details) : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
