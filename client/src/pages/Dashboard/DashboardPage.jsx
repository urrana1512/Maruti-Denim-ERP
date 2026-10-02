import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import QuickActions from '../../components/dashboard/QuickActions';
import KPICards from '../../components/dashboard/KPICards';
import ActionRequired from '../../components/dashboard/ActionRequired';
import GatePassStatusChart from '../../components/dashboard/GatePassStatusChart';
import GatePassTrendChart from '../../components/dashboard/GatePassTrendChart';
import MaterialReturnOverview from '../../components/dashboard/MaterialReturnOverview';
import ReturnTrendChart from '../../components/dashboard/ReturnTrendChart';
import OverdueReturnsTable from '../../components/dashboard/OverdueReturnsTable';
import VendorAnalytics from '../../components/dashboard/VendorAnalytics';
import ItemAnalytics from '../../components/dashboard/ItemAnalytics';
import DepartmentAnalytics from '../../components/dashboard/DepartmentAnalytics';
import RecentGatePasses from '../../components/dashboard/RecentGatePasses';
import RecentMaterialInward from '../../components/dashboard/RecentMaterialInward';
import RecentActivityTimeline from '../../components/dashboard/RecentActivityTimeline';

import { fetchDashboardOverview } from '../../services/dashboardService';

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params or defaults
  const [filters, setFilters] = useState({
    range: searchParams.get('range') || 'last30days',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    vendor: searchParams.get('vendor') || 'All',
    department: searchParams.get('department') || 'All'
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Consolidated dashboard data state
  const [data, setData] = useState({
    summary: {},
    statusDistribution: [],
    gatePassTrends: [],
    materialReturnSummary: {},
    returnTrends: [],
    overdueReturns: [],
    vendorAnalytics: [],
    itemAnalytics: [],
    departmentAnalytics: [],
    recentGatePasses: [],
    recentInwards: [],
    recentActivity: [],
    actionRequired: []
  });

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetchDashboardOverview(filters);
      if (res.success && res.data) {
        setData(res.data);
        setLastUpdated(new Date());
        if (isManualRefresh) {
          toast.success('Dashboard metrics refreshed');
        }
      } else {
        setError(res.message || 'Failed to load dashboard metrics');
      }
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
      setError(err.response?.data?.message || err.message || 'Network error fetching dashboard');
      toast.error('Failed to update dashboard data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync URL query string when filters change
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

  return (
    <div className="pb-12 min-w-0 max-w-full">
      {/* 1. Header */}
      <DashboardHeader
        lastUpdated={lastUpdated}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        actionRequiredCount={data.actionRequired?.length || 0}
      />

      {/* 2. Global Filters */}
      <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* 3. Quick Actions */}
      <QuickActions />

      {/* 4. KPI Cards */}
      <KPICards summary={data.summary} loading={loading} />

      {/* 5. Action Required */}
      <ActionRequired
        items={data.actionRequired}
        loading={loading}
        error={error}
        onRetry={() => loadData(true)}
      />

      {/* 6. Charts Grid: Gate Pass Status Distribution & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-5">
          <GatePassStatusChart
            data={data.statusDistribution}
            loading={loading}
            error={error}
            onRetry={() => loadData(true)}
          />
        </div>
        <div className="lg:col-span-7">
          <GatePassTrendChart
            data={data.gatePassTrends}
            loading={loading}
            error={error}
            onRetry={() => loadData(true)}
          />
        </div>
      </div>

      {/* 7. Material Return Overview */}
      <MaterialReturnOverview
        data={data.materialReturnSummary}
        loading={loading}
        error={error}
        onRetry={() => loadData(true)}
      />

      {/* 8. Return Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-12">
          <ReturnTrendChart
            data={data.returnTrends}
            loading={loading}
            error={error}
            onRetry={() => loadData(true)}
          />
        </div>
      </div>

      {/* 9. Overdue Returns Table */}
      <OverdueReturnsTable
        items={data.overdueReturns}
        loading={loading}
        error={error}
        onRetry={() => loadData(true)}
      />

      {/* 10. Vendor & Item Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-5">
          <VendorAnalytics
            data={data.vendorAnalytics}
            loading={loading}
            error={error}
            onRetry={() => loadData(true)}
          />
        </div>
        <div className="lg:col-span-7">
          <ItemAnalytics
            data={data.itemAnalytics}
            loading={loading}
            error={error}
            onRetry={() => loadData(true)}
          />
        </div>
      </div>

      {/* 11. Department Analytics (Hides if empty) */}
      <DepartmentAnalytics
        data={data.departmentAnalytics}
        loading={loading}
        error={error}
        onRetry={() => loadData(true)}
      />

      {/* 12. Recent Gate Passes */}
      <RecentGatePasses
        items={data.recentGatePasses}
        loading={loading}
        error={error}
        onRetry={() => loadData(true)}
      />

      {/* 13. Recent Material Inward */}
      <RecentMaterialInward
        items={data.recentInwards}
        loading={loading}
        error={error}
        onRetry={() => loadData(true)}
      />

      {/* 14. Audit / Activity Timeline */}
      <RecentActivityTimeline
        items={data.recentActivity}
        loading={loading}
        error={error}
        onRetry={() => loadData(true)}
      />
    </div>
  );
};

export default DashboardPage;
