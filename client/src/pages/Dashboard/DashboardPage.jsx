import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

import GreetingHeader from '../../components/common/GreetingHeader';
import ActivityHeatmapChart from '../../components/common/ActivityHeatmapChart';
import StatusDonutChart from '../../components/common/StatusDonutChart';
import TaskApprovalCard from '../../components/common/TaskApprovalCard';
import ActivityTimelineCard from '../../components/common/ActivityTimelineCard';
import PendingReturnsCard from '../../components/common/PendingReturnsCard';

import KPICards from '../../components/dashboard/KPICards';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import QuickActions from '../../components/dashboard/QuickActions';
import ActionRequired from '../../components/dashboard/ActionRequired';
import OverdueReturnsTable from '../../components/dashboard/OverdueReturnsTable';
import VendorAnalytics from '../../components/dashboard/VendorAnalytics';
import ItemAnalytics from '../../components/dashboard/ItemAnalytics';
import RecentGatePasses from '../../components/dashboard/RecentGatePasses';
import RecentMaterialInward from '../../components/dashboard/RecentMaterialInward';

import { fetchDashboardOverview } from '../../services/dashboardService';

const DashboardPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    range: searchParams.get('range') || 'last30days',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    vendor: searchParams.get('vendor') || 'All',
    department: searchParams.get('department') || 'All'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    summary: {},
    statusDistribution: [],
    gatePassTrends: [],
    materialReturnSummary: {},
    returnTrends: [],
    overdueReturns: [],
    vendorAnalytics: [],
    itemAnalytics: [],
    recentGatePasses: [],
    recentInwards: [],
    recentActivity: [],
    actionRequired: []
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchDashboardOverview(filters);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard metrics');
      }
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
      setError(err.response?.data?.message || err.message || 'Network error fetching dashboard');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = {};
    if (newFilters.range) params.range = newFilters.range;
    if (newFilters.fromDate) params.fromDate = newFilters.fromDate;
    if (newFilters.toDate) params.toDate = newFilters.toDate;
    if (newFilters.vendor && newFilters.vendor !== 'All') params.vendor = newFilters.vendor;
    if (newFilters.department && newFilters.department !== 'All') params.department = newFilters.department;
    setSearchParams(params, { replace: true });
  };

  const handleExportReport = () => {
    toast.info('Generating Gate Pass Executive Report...');
    window.print();
  };

  // Format Status Donut segments strictly from real database metrics
  const statusSegments = (data.statusDistribution && data.statusDistribution.length > 0)
    ? data.statusDistribution.map(s => ({ label: s.name, count: s.value, color: s.color }))
    : [
        { label: 'Pending / Open', count: data.summary.pendingGatePasses || 0, color: '#7C3AED' },
        { label: 'Approved Passes', count: data.summary.approvedGatePasses || 0, color: '#0EA5E9' },
        { label: 'In Progress / Out', count: Math.round(data.summary.materialCurrentlyOut || 0), color: '#F59E0B' },
        { label: 'Closed / Returned', count: data.summary.fullyReturnedClosed || 0, color: '#10B981' }
      ];

  return (
    <div className="pb-12 min-w-0 max-w-full space-y-6">
      {/* 1. Page Greeting Header */}
      <GreetingHeader
        userName={user?.name}
        roleTitle={user?.roleName || user?.department || 'Employee Panel'}
        onPrimaryAction={handleExportReport}
        actionLabel="Export Report"
      />

      {/* 2. Top KPI Cards Row */}
      <KPICards summary={data.summary} loading={loading} role="employee" />

      {/* 3. Primary GitHub Contribution Activity with Right-Side Date Inspector */}
      <div className="mb-6">
        <ActivityHeatmapChart
          title="Gate Pass Creation & Material Inward Movement Activity"
          data={[...(data.recentGatePasses || []), ...(data.recentInwards || [])]}
        />
      </div>

      {/* 4. Secondary Donut Chart & Action Required */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <StatusDonutChart
            title="Gate Pass Status Distribution"
            totalCount={data.summary.totalGatePasses || 0}
            segments={statusSegments}
          />
        </div>
        <div className="lg:col-span-7">
          <ActionRequired
            items={data.actionRequired}
            loading={loading}
            error={error}
            onRetry={loadData}
          />
        </div>
      </div>

      {/* 4. Bottom 3-Column List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaskApprovalCard tasks={data.actionRequired} />
        <ActivityTimelineCard activities={data.recentActivity} />
        <PendingReturnsCard items={data.overdueReturns} />
      </div>

      {/* 5. Filter Controls & Quick Actions */}
      <div className="bg-white border border-[#EBEFF2] rounded-xl p-4 shadow-2xs">
        <div className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-3">
          Filter Dashboard & Operations
        </div>
        <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />
        <div className="mt-4 pt-4 border-t border-[#EBEFF2]">
          <QuickActions />
        </div>
      </div>

      {/* 6. Action Required Detail Section */}
      <ActionRequired
        items={data.actionRequired}
        loading={loading}
        error={error}
        onRetry={loadData}
      />

      {/* 7. Overdue Returns Table */}
      <OverdueReturnsTable
        items={data.overdueReturns}
        loading={loading}
        error={error}
        onRetry={loadData}
      />

      {/* 8. Vendor & Item Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <VendorAnalytics
            data={data.vendorAnalytics}
            loading={loading}
            error={error}
            onRetry={loadData}
          />
        </div>
        <div className="lg:col-span-7">
          <ItemAnalytics
            data={data.itemAnalytics}
            loading={loading}
            error={error}
            onRetry={loadData}
          />
        </div>
      </div>

      {/* 9. Recent Gate Passes & Inwards */}
      <RecentGatePasses
        items={data.recentGatePasses}
        loading={loading}
        error={error}
        onRetry={loadData}
      />
      <RecentMaterialInward
        items={data.recentInwards}
        loading={loading}
        error={error}
        onRetry={loadData}
      />
    </div>
  );
};

export default DashboardPage;
