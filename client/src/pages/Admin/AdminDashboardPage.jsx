import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

import GreetingHeader from '../../components/common/GreetingHeader';
import ActivityHeatmapChart from '../../components/common/ActivityHeatmapChart';
import StatusDonutChart from '../../components/common/StatusDonutChart';
import KPICards from '../../components/dashboard/KPICards';

import {
  UserCheck,
  ShieldAlert,
  FileText,
  PackageCheck,
  Users,
  Activity,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  PlusCircle,
  Building2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { user, selectedCompany } = useAuth();
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
      toast.error('Failed to load company admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats || {};
  const recentActivities = data?.recentActivities || [];

  const handleExport = () => {
    toast.info('Generating Company Operational Summary Report...');
    window.print();
  };

  const summaryData = {
    totalGatePasses: stats.totalGatePasses || 0,
    pendingGatePasses: stats.pendingUserApprovals || stats.pendingGatePasses || 0,
    returnablePending: stats.pendingGatePasses || 0,
    fullyReturnedClosed: stats.closedGatePasses || 0,
    totalUsers: stats.totalUsers || 0
  };

  const statusSegments = [
    { label: 'Pending Approval', count: stats.pendingGatePasses || 0, color: '#7C3AED' },
    { label: 'Approved & Active', count: stats.approvedGatePasses || 0, color: '#0EA5E9' },
    { label: 'Returnable Out', count: stats.activeReturnables || 0, color: '#F59E0B' },
    { label: 'Fully Closed', count: stats.closedGatePasses || 0, color: '#10B981' }
  ];

  return (
    <div className="pb-12 min-w-0 max-w-full space-y-6">
      {/* 1. Greeting Header Personalized to Company Admin */}
      <GreetingHeader
        userName={user?.name}
        roleTitle={`${selectedCompany?.name || 'Company'} Administration Console`}
        onPrimaryAction={handleExport}
        actionLabel="Export Company Report"
      />

      {/* 2. Company Operational KPI Cards */}
      <KPICards summary={summaryData} loading={loading} role="admin" />

      {/* 3. Company Admin Operational Action Toolbar */}
      <div className="bg-white border border-[#EBEFF2] rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#F6F8FA] border border-[#EBEFF2] rounded-lg text-[#111827]">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#111827]">Company Governance Shortcuts</h4>
            <p className="text-[11px] text-[#6B7280]">Quick actions for company staff and gate pass operations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/users?status=PENDING_APPROVAL"
            className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
          >
            <UserCheck size={15} />
            <span>Review Staff Registrations ({stats.pendingUserApprovals || 0})</span>
          </Link>

          <Link
            to="/gate-pass/add"
            className="inline-flex items-center gap-1.5 bg-[#F6F8FA] hover:bg-[#EBEFF2] text-[#111827] text-xs font-bold px-3 py-2 rounded-lg border border-[#EBEFF2] transition-colors"
          >
            <PlusCircle size={15} />
            <span>Create New Pass</span>
          </Link>

          <Link
            to="/admin/roles"
            className="inline-flex items-center gap-1.5 bg-[#F6F8FA] hover:bg-[#EBEFF2] text-[#111827] text-xs font-bold px-3 py-2 rounded-lg border border-[#EBEFF2] transition-colors"
          >
            <ShieldAlert size={15} />
            <span>Manage RBAC Roles</span>
          </Link>
        </div>
      </div>

      {/* 4. Company Operations Activity Heatmap */}
      <ActivityHeatmapChart
        title={`${selectedCompany?.name || 'Company'} Material Movement Activity`}
        data={recentActivities}
      />

      {/* 5. Company Returnable Status & User Approvals Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Returnable Donut Chart */}
        <div className="lg:col-span-6">
          <StatusDonutChart
            title="Company Gate Pass Status Distribution"
            totalCount={stats.totalGatePasses || 0}
            segments={statusSegments}
            onViewAll={() => window.location.assign('/admin/gate-passes')}
          />
        </div>

        {/* Pending Staff Registration Approval Queue */}
        <div className="lg:col-span-6 glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEFF2] mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <UserCheck size={16} className="text-[#7C3AED]" /> Staff Approval Queue
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  New employee account registration requests requiring admin verification
                </p>
              </div>
              <Link
                to="/admin/users?status=PENDING_APPROVAL"
                className="text-xs font-bold text-[#111827] hover:underline"
              >
                View All ({stats.pendingUserApprovals || 0}) →
              </Link>
            </div>

            {stats.pendingUserApprovals > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center">
                      R
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111827]">Rajesh Patel</div>
                      <div className="text-[10px] text-[#6B7280]">Store & Inventory • Store Officer</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/admin/users?status=PENDING_APPROVAL"
                      className="px-3 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Approve Staff
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-[#9CA3AF] space-y-1">
                <CheckCircle2 size={32} className="mx-auto text-[#10B981]" />
                <p className="font-bold text-[#111827]">All Staff Registrations Approved</p>
                <p className="text-[11px] text-[#6B7280]">No pending registration requests requiring action.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#EBEFF2] text-[11px] text-[#6B7280] flex items-center justify-between">
            <span>Role Assignment & Verification</span>
            <span className="font-bold text-[#111827]">Company Admin Scope</span>
          </div>
        </div>
      </div>

      {/* 6. Company System Audit Trail */}
      <div className="glass-card bg-white p-5 sm:p-6 rounded-xl border border-[#EBEFF2] shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Activity size={18} className="text-[#111827]" /> Company User Audit Feed
            </h3>
            <p className="text-xs text-[#6B7280]">Audit trail of staff actions, approvals, and material passes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              className="px-3 py-1.5 bg-[#F6F8FA] hover:bg-[#EBEFF2] text-[#111827] text-xs font-semibold rounded-lg border border-[#EBEFF2] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} /> Refresh Feed
            </button>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-bold text-[#111827] hover:underline"
            >
              Full Audit Logs →
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] py-6 text-center">No recent audit log entries recorded.</p>
          ) : (
            recentActivities.slice(0, 5).map((log) => (
              <div key={log._id} className="p-3 bg-[#F6F8FA] rounded-xl border border-[#EBEFF2] flex items-start justify-between text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white border border-[#EBEFF2] rounded-lg text-[#111827] shrink-0 mt-0.5">
                    <Activity size={15} />
                  </div>
                  <div>
                    <span className="font-bold text-[#111827]">{log.action}</span>
                    <span className="text-[#6B7280] ml-1.5">by {log.userName || log.userEmail || 'Staff'}</span>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {log.details ? JSON.stringify(log.details) : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-[#9CA3AF] font-medium whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
