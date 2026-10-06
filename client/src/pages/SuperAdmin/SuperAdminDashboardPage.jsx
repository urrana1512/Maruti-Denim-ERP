import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { superAdminService } from '../../services/superAdminService';

import GreetingHeader from '../../components/common/GreetingHeader';
import {
  Building2,
  Users,
  FileText,
  Clock,
  PackageCheck,
  CheckCircle2,
  ArrowDownLeft,
  AlertCircle,
  Filter,
  Calendar,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Globe,
  AlertTriangle,
  Server,
  Layers,
  Database,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Info,
  Check
} from 'lucide-react';

const SuperAdminDashboardPage = () => {
  const { superAdmin } = useAuth();
  const { currentCompany: contextCompany } = useOutletContext() || {};
  const navigate = useNavigate();

  // Filters State
  const [companyFilter, setCompanyFilter] = useState(contextCompany || 'ALL');
  const [timeframe, setTimeframe] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Main Dashboard Data State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Search & Pagination States for Recent Tables
  const [gpSearch, setGpSearch] = useState('');
  const [gpStatusFilter, setGpStatusFilter] = useState('ALL');
  const [gpPage, setGpPage] = useState(1);

  const [inwardSearch, setInwardSearch] = useState('');
  const [inwardStatusFilter, setInwardStatusFilter] = useState('ALL');
  const [inwardPage, setInwardPage] = useState(1);

  // Modals for Read-Only Inspection
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [selectedInward, setSelectedInward] = useState(null);

  // Sync context company with state if changed from top layout header
  useEffect(() => {
    if (contextCompany && contextCompany !== companyFilter) {
      setCompanyFilter(contextCompany);
    }
  }, [contextCompany]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getDashboardStats(
        companyFilter,
        timeframe,
        timeframe === 'custom' ? startDate : undefined,
        timeframe === 'custom' ? endDate : undefined
      );
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load Super Admin stats:', err);
      toast.error('Unable to fetch live platform metrics from company databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [companyFilter, timeframe, startDate, endDate]);

  const stats = data?.stats || {};
  const companies = data?.companies || [];
  const trends = data?.trends || [];
  const statusDistribution = data?.statusDistribution || [];
  const inwardOverview = data?.inwardOverview || {};
  const recentGPs = data?.recentGatePasses || [];
  const recentInwards = data?.recentInwardEntries || [];
  const recentLogs = data?.recentActivities || [];
  const alerts = data?.alerts || [];

  const handleExport = () => {
    toast.info('Generating Super Admin Consolidated Governance Report...');
    window.print();
  };

  // Helper formatting dates
  const formatDateStr = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Filtered recent gate passes
  const filteredGatePasses = recentGPs.filter((gp) => {
    const matchesSearch =
      !gpSearch ||
      gp.gatePassNumber?.toLowerCase().includes(gpSearch.toLowerCase()) ||
      gp.companyName?.toLowerCase().includes(gpSearch.toLowerCase()) ||
      gp.partyName?.toLowerCase().includes(gpSearch.toLowerCase()) ||
      gp.createdBy?.toLowerCase().includes(gpSearch.toLowerCase());

    const matchesStatus =
      gpStatusFilter === 'ALL' ||
      gp.status?.toUpperCase() === gpStatusFilter.toUpperCase() ||
      gp.returnStatus?.toUpperCase() === gpStatusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const paginatedGPs = filteredGatePasses.slice((gpPage - 1) * 5, gpPage * 5);
  const gpTotalPages = Math.ceil(filteredGatePasses.length / 5) || 1;

  // Filtered recent inward entries
  const filteredInwards = recentInwards.filter((mi) => {
    const matchesSearch =
      !inwardSearch ||
      mi.inwardNumber?.toLowerCase().includes(inwardSearch.toLowerCase()) ||
      mi.gatePassNumber?.toLowerCase().includes(inwardSearch.toLowerCase()) ||
      mi.supplierName?.toLowerCase().includes(inwardSearch.toLowerCase()) ||
      mi.challanNo?.toLowerCase().includes(inwardSearch.toLowerCase());

    const matchesStatus =
      inwardStatusFilter === 'ALL' || mi.status?.toUpperCase() === inwardStatusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const paginatedInwards = filteredInwards.slice((inwardPage - 1) * 5, inwardPage * 5);
  const inwardTotalPages = Math.ceil(filteredInwards.length / 5) || 1;

  // Status Badge Helper
  const getStatusBadge = (statusStr) => {
    const s = String(statusStr || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE' || s === 'OPEN') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Active</span>;
    }
    if (s === 'PARTIALLY_RETURNED') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Partial Return</span>;
    }
    if (s === 'CLOSED' || s === 'FULLY_RETURNED' || s === 'COMPLETED') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Closed</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{s}</span>;
  };

  // Max value for trend SVG chart calculation
  const maxTrendVal = Math.max(...trends.map((t) => t.total || 0), 5);

  return (
    <div className="pb-16 min-w-0 max-w-full space-y-6 text-[#111827]">
      {/* 1. Page Greeting Header */}
      <GreetingHeader
        userName={superAdmin?.name}
        roleTitle="Root Super Administrator • Central Monitoring Console"
        onPrimaryAction={handleExport}
        actionLabel="Export Governance Report"
      />

      {/* 2. Global Filters Bar (Company & Date Range) */}
      <div className="bg-white border border-[#EBEFF2] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#111827] text-white rounded-xl shadow-xs">
              <Filter size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Global Filter & Monitoring Scope</h3>
              <p className="text-xs text-[#6B7280]">Consolidated telemetry across Maruti Denim, Shri Ram, and Balaji Polycot</p>
            </div>
          </div>

          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="self-start md:self-auto px-3.5 py-2 bg-[#F6F8FA] hover:bg-[#EBEFF2] border border-[#EBEFF2] rounded-xl text-xs font-bold text-[#111827] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#EBEFF2]">
          {/* Company Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1">Target Company</label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827] transition-all cursor-pointer"
              >
                <option value="ALL">All Companies (Consolidated)</option>
                <option value="maruti_nandan">Maruti Nandan Denim PVT. LTD.</option>
                <option value="shri_ram">Shri Ram Cot Fab</option>
                <option value="balaji_polycot">Balaji Polycot</option>
              </select>
            </div>
          </div>

          {/* Timeframe Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1">Reporting Period</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827] transition-all cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="prev_month">Previous Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs (If Custom Selected) */}
          {timeframe === 'custom' && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#111827]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#111827]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. 8 KPI Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Companies */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-sky-600 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Total Companies</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Registered Group Tenants</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 shrink-0">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.totalCompanies || 3}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">100% Online</span>
          </div>
        </div>

        {/* Card 2: Total Employees */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-indigo-600 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Total Employees</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Users in Selected Scope</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.totalUsers || 0}</span>
            <span className="text-[10px] font-semibold text-[#6B7280]">Group Staff</span>
          </div>
        </div>

        {/* Card 3: Total Gate Passes */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-purple-600 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Gate Passes Created</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Within Selected Period</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 shrink-0">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.totalGatePassesInPeriod || 0}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">In Selected Range</span>
          </div>
        </div>

        {/* Card 4: Active Gate Passes */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-blue-600 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Active Gate Passes</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Currently Open & Active</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 shrink-0">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.activeGatePasses || 0}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Active Field Passes</span>
          </div>
        </div>

        {/* Card 5: Partially Returned */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Partially Returned</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Partial Inward Fulfilled</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <PackageCheck size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.partiallyReturned || 0}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">In Progress</span>
          </div>
        </div>

        {/* Card 6: Closed Gate Passes */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-emerald-600 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Closed Gate Passes</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Fully Returned & Archived</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.closedGatePasses || 0}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Completed</span>
          </div>
        </div>

        {/* Card 7: Total Inward Entries */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-teal-600 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Total Inward Entries</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Inward Transactions</p>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 shrink-0">
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.totalInwardEntries || 0}</span>
            <span className="text-[10px] font-semibold text-[#6B7280]">Inward Logs</span>
          </div>
        </div>

        {/* Card 8: Pending Returnable Items */}
        <div className="bg-white border border-[#EBEFF2] border-l-4 border-l-rose-600 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#111827]">Pending Returnables</span>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Outstanding Return Items</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 shrink-0">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#EBEFF2] flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#EF4444] tracking-tight">{stats.pendingReturnableCount || 0}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Requires Follow-up</span>
          </div>
        </div>
      </div>

      {/* 4. Gate Pass Activity Trends (Section C) & Status Distribution Donut (Section D) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gate Pass Activity Trends Line Chart */}
        <div className="lg:col-span-2 bg-white border border-[#EBEFF2] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Activity size={18} className="text-[#111827]" /> Gate Pass Activity Trends Over Time
                </h3>
                <p className="text-xs text-[#6B7280]">Daily gate pass creation telemetry for selected period</p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-bold">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Maruti</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Shri Ram</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Balaji</div>
              </div>
            </div>

            {/* SVG Interactive Trend Chart */}
            <div className="h-56 w-full pt-4 relative flex items-end justify-between gap-1 border-b border-[#EBEFF2]">
              {trends.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#9CA3AF]">
                  No trend data recorded for selected period.
                </div>
              ) : (
                trends.map((point, idx) => {
                  const heightPercent = Math.max((point.total / maxTrendVal) * 100, 8);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-[#111827] text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg z-20 whitespace-nowrap">
                        <span>{point.date}: {point.total} Passes</span>
                        <span className="text-[9px] text-slate-300">M: {point.maruti} | SR: {point.shriRam} | B: {point.balaji}</span>
                      </div>

                      {/* Bar / Column */}
                      <div className="w-full max-w-[18px] bg-slate-100 rounded-t-sm relative overflow-hidden transition-all duration-300 group-hover:opacity-90" style={{ height: `${heightPercent}%` }}>
                        <div className="w-full bg-purple-600 absolute bottom-0" style={{ height: `${point.total ? (point.maruti / point.total) * 100 : 0}%` }} />
                        <div className="w-full bg-sky-500 absolute" style={{ bottom: `${point.total ? (point.maruti / point.total) * 100 : 0}%`, height: `${point.total ? (point.shriRam / point.total) * 100 : 0}%` }} />
                        <div className="w-full bg-amber-500 absolute" style={{ bottom: `${point.total ? ((point.maruti + point.shriRam) / point.total) * 100 : 0}%`, height: `${point.total ? (point.balaji / point.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Date Labels below chart */}
            <div className="flex justify-between pt-2 text-[10px] font-bold text-[#6B7280]">
              <span>{trends[0]?.date || 'Start Date'}</span>
              <span>{trends[Math.floor(trends.length / 2)]?.date || 'Mid Period'}</span>
              <span>{trends[trends.length - 1]?.date || 'End Date'}</span>
            </div>
          </div>
        </div>

        {/* Gate Pass Status Distribution Donut Chart */}
        <div className="bg-white border border-[#EBEFF2] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827] mb-1">Gate Pass Status Distribution</h3>
            <p className="text-xs text-[#6B7280] mb-4">Breakdown of active, partial & closed passes</p>

            {/* SVG Donut */}
            <div className="flex justify-center items-center relative my-4">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" className="stroke-slate-100" strokeWidth="12" fill="transparent" />
                  {(() => {
                    const totalCount = statusDistribution.reduce((acc, s) => acc + s.count, 0) || 1;
                    let cumulative = 0;
                    const r = 38;
                    const c = 2 * Math.PI * r;

                    return statusDistribution.map((seg, i) => {
                      const dashArray = `${(seg.count / totalCount) * c} ${c}`;
                      const dashOffset = -cumulative;
                      cumulative += (seg.count / totalCount) * c;

                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r={r}
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      );
                    });
                  })()}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase">Total Passes</span>
                  <span className="text-2xl font-black text-[#111827]">
                    {statusDistribution.reduce((acc, s) => acc + s.count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 bg-[#F6F8FA] p-3 rounded-xl border border-[#EBEFF2] text-xs">
            {statusDistribution.map((seg, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="font-semibold text-[#111827]">{seg.label}</span>
                </div>
                <span className="font-bold text-[#111827]">{seg.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Company-Wise Comparison (Section E) */}
      <div className="bg-white border border-[#EBEFF2] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Layers size={18} className="text-[#111827]" /> Group Company Comparison & Database Telemetry
            </h3>
            <p className="text-xs text-[#6B7280]">Side-by-side performance matrix for Maruti Denim, Shri Ram, and Balaji Polycot</p>
          </div>

          <Link to="/superadmin/companies" className="text-xs font-bold text-[#111827] hover:underline flex items-center gap-1">
            Manage Tenants <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div
              key={comp.code}
              className={`p-4 rounded-xl border transition-all ${
                comp.isAvailable ? 'bg-[#F6F8FA] border-[#EBEFF2] hover:border-[#D1D5DB]' : 'bg-rose-50/40 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EBEFF2]">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {comp.code === 'maruti_nandan' ? 'MND' : comp.code === 'shri_ram' ? 'SRCF' : 'BPPL'}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-[#111827] truncate">{comp.name}</h4>
                    <span className="text-[10px] text-[#6B7280] font-mono">{comp.code}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    comp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {comp.status}
                </span>
              </div>

              {comp.isAvailable ? (
                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-[#6B7280] font-medium">Gate Passes (Period)</span>
                    <span className="font-bold text-[#111827]">{comp.gatePassesInPeriod || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-[#6B7280] font-medium">Active Passes</span>
                    <span className="font-bold text-blue-700">{comp.activeGatePasses || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-[#6B7280] font-medium">Partially Returned</span>
                    <span className="font-bold text-amber-700">{comp.partiallyReturned || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-[#6B7280] font-medium">Closed Passes</span>
                    <span className="font-bold text-emerald-700">{comp.closedGatePasses || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-[#6B7280] font-medium">Registered Staff</span>
                    <span className="font-bold text-[#111827]">{comp.usersCount || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-[#6B7280] font-medium">Inward Transactions</span>
                    <span className="font-bold text-teal-700">{comp.inwardInPeriod || 0}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6B7280] font-medium">Pending Returnables</span>
                    <span className="font-bold text-rose-700">{comp.pendingReturnable || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-rose-600 font-bold space-y-1">
                  <Database size={20} className="mx-auto text-rose-500" />
                  <p>Database Connectivity Offline</p>
                  <span className="text-[10px] text-slate-500 font-normal">Check connection settings</span>
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-[#EBEFF2] flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <Database size={12} className={comp.isAvailable ? 'text-emerald-600' : 'text-rose-500'} />
                  {comp.isAvailable ? 'DB Connected' : 'DB Offline'}
                </span>
                <Link to={`/superadmin/companies/${comp.code}/details`} className="font-bold text-[#111827] hover:underline">
                  Full Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Inward & Returnables Overview (Section F) */}
      <div className="bg-white border border-[#EBEFF2] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <PackageCheck size={18} className="text-[#111827]" /> Inward & Returnables Material Overview
            </h3>
            <p className="text-xs text-[#6B7280]">Tracking returnable field inventory and outstanding items across companies</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              {inwardOverview.pendingReturnableCount || 0} Pending Returns
            </span>
            <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold">
              {inwardOverview.overdueReturnableCount || 0} Overdue
            </span>
          </div>
        </div>

        {/* Pending Returnables Table */}
        <div className="overflow-x-auto border border-[#EBEFF2] rounded-xl">
          <table className="min-w-full divide-y divide-[#EBEFF2] text-xs">
            <thead className="bg-[#F6F8FA] text-[#6B7280] font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Gate Pass No</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Expected Return Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created By</th>
                <th className="px-4 py-3 text-right">Read-Only Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EBEFF2] font-medium text-[#111827]">
              {(inwardOverview.pendingRecords || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#9CA3AF]">
                    No outstanding pending returnable records found.
                  </td>
                </tr>
              ) : (
                (inwardOverview.pendingRecords || []).map((rec) => (
                  <tr key={`${rec.tenantCode}-${rec._id}`} className="hover:bg-[#F6F8FA]">
                    <td className="px-4 py-3 font-bold text-[#111827]">{rec.gatePassNumber}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                        {rec.tenantName || rec.tenantCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{formatDateStr(rec.expectedReturnDate)}</td>
                    <td className="px-4 py-3">{getStatusBadge(rec.returnStatus)}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{rec.createdBy || 'Staff'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedGatePass(rec)}
                        className="px-2.5 py-1 bg-[#F6F8FA] hover:bg-[#EBEFF2] border border-[#EBEFF2] text-[#111827] font-bold rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Recent Gate Passes Table (Section G) */}
      <div className="bg-white border border-[#EBEFF2] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <FileText size={18} className="text-[#111827]" /> Recent Gate Passes Monitoring
            </h3>
            <p className="text-xs text-[#6B7280]">Consolidated gate pass registry across all three companies</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search pass no, party..."
                value={gpSearch}
                onChange={(e) => { setGpSearch(e.target.value); setGpPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl text-xs focus:outline-none"
              />
            </div>

            <select
              value={gpStatusFilter}
              onChange={(e) => { setGpStatusFilter(e.target.value); setGpPage(1); }}
              className="px-2.5 py-1.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl text-xs font-semibold text-[#111827] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PARTIALLY_RETURNED">Partial Return</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#EBEFF2] rounded-xl">
          <table className="min-w-full divide-y divide-[#EBEFF2] text-xs">
            <thead className="bg-[#F6F8FA] text-[#6B7280] font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Gate Pass No</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Party / Vendor</th>
                <th className="px-4 py-3 text-left">Vehicle No</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EBEFF2] font-medium text-[#111827]">
              {paginatedGPs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-[#9CA3AF]">
                    No matching gate pass records found.
                  </td>
                </tr>
              ) : (
                paginatedGPs.map((gp) => (
                  <tr key={`${gp.tenantCode}-${gp._id}`} className="hover:bg-[#F6F8FA]">
                    <td className="px-4 py-3 font-bold text-[#111827]">{gp.gatePassNumber}</td>
                    <td className="px-4 py-3 font-semibold">{gp.tenantName || gp.tenantCode}</td>
                    <td className="px-4 py-3 font-mono">{formatDateStr(gp.createdAt)}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{gp.partyName || gp.companyName || '-'}</td>
                    <td className="px-4 py-3 font-mono">{gp.vehicleNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                        {gp.passType}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(gp.status || gp.returnStatus)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedGatePass(gp)}
                        className="px-2.5 py-1 bg-[#F6F8FA] hover:bg-[#EBEFF2] border border-[#EBEFF2] text-[#111827] font-bold rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {gpTotalPages > 1 && (
          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-[#6B7280]">Page {gpPage} of {gpTotalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setGpPage((p) => Math.max(1, p - 1))}
                disabled={gpPage === 1}
                className="p-1.5 border rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setGpPage((p) => Math.min(gpTotalPages, p + 1))}
                disabled={gpPage === gpTotalPages}
                className="p-1.5 border rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 8. Recent Inward Activity Table (Section H) */}
      <div className="bg-white border border-[#EBEFF2] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <ArrowDownLeft size={18} className="text-[#111827]" /> Recent Inward Transactions Stream
            </h3>
            <p className="text-xs text-[#6B7280]">Consolidated material inward records</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search inward, supplier..."
                value={inwardSearch}
                onChange={(e) => { setInwardSearch(e.target.value); setInwardPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#EBEFF2] rounded-xl">
          <table className="min-w-full divide-y divide-[#EBEFF2] text-xs">
            <thead className="bg-[#F6F8FA] text-[#6B7280] font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Inward Entry No</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Gate Pass Ref</th>
                <th className="px-4 py-3 text-left">Supplier / Party</th>
                <th className="px-4 py-3 text-left">Challan / Invoice</th>
                <th className="px-4 py-3 text-left">Entry Date</th>
                <th className="px-4 py-3 text-left">Received Qty</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EBEFF2] font-medium text-[#111827]">
              {paginatedInwards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-[#9CA3AF]">
                    No recent material inward records found.
                  </td>
                </tr>
              ) : (
                paginatedInwards.map((mi) => (
                  <tr key={`${mi.tenantCode}-${mi._id}`} className="hover:bg-[#F6F8FA]">
                    <td className="px-4 py-3 font-bold text-[#111827]">{mi.inwardNumber || '-'}</td>
                    <td className="px-4 py-3 font-semibold">{mi.tenantName || mi.tenantCode}</td>
                    <td className="px-4 py-3 font-bold text-[#111827]">{mi.gatePassNumber}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{mi.supplierName || mi.companyName || '-'}</td>
                    <td className="px-4 py-3 font-mono">{mi.challanNo || '-'}</td>
                    <td className="px-4 py-3 font-mono">{formatDateStr(mi.entryDate || mi.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">{mi.totalQuantityReceived || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedInward(mi)}
                        className="px-2.5 py-1 bg-[#F6F8FA] hover:bg-[#EBEFF2] border border-[#EBEFF2] text-[#111827] font-bold rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {inwardTotalPages > 1 && (
          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-[#6B7280]">Page {inwardPage} of {inwardTotalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setInwardPage((p) => Math.max(1, p - 1))}
                disabled={inwardPage === 1}
                className="p-1.5 border rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setInwardPage((p) => Math.min(inwardTotalPages, p + 1))}
                disabled={inwardPage === inwardTotalPages}
                className="p-1.5 border rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 9. Global Audit Log & System Alerts (Sections J & K) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Security Audit Feed */}
        <div className="bg-white border border-[#EBEFF2] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={15} className="text-[#111827]" /> Group System Audit Stream
              </h4>
              <p className="text-[11px] text-[#6B7280]">Live operational & security logs across databases</p>
            </div>
            <Link to="/superadmin/audit-logs" className="text-xs font-bold text-[#111827] hover:underline">
              All Audit Logs →
            </Link>
          </div>

          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] py-6 text-center">No system events logged recently.</p>
            ) : (
              recentLogs.slice(0, 6).map((log) => (
                <div key={log._id} className="p-2.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#111827]">{log.userName || 'User'}</span>
                    <span className="text-[#6B7280] ml-2 text-[11px]">{log.action}</span>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{log.tenantName || 'Platform'}</p>
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Alerts & Operational Exceptions */}
        <div className="bg-white border border-[#EBEFF2] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-500" /> Platform Operational Alerts
              </h4>
              <p className="text-[11px] text-[#6B7280]">Active system exceptions and monitoring alerts</p>
            </div>
            <Link to="/superadmin/alerts" className="text-xs font-bold text-[#111827] hover:underline">
              View All Alerts →
            </Link>
          </div>

          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 font-semibold">
                <Check className="mx-auto mb-1" size={20} />
                All tenant databases and operations are running smoothly with no active alerts!
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    alt.severity === 'danger'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : alt.severity === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">{alt.title}</span>
                    <p className="text-[11px] mt-0.5">{alt.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* READ-ONLY GATE PASS INSPECTION MODAL */}
      {selectedGatePass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#EBEFF2]">
            <div className="flex items-center justify-between border-b border-[#EBEFF2] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Gate Pass Inspection (Read-Only)</h3>
                <span className="text-xs text-[#6B7280]">{selectedGatePass.gatePassNumber}</span>
              </div>
              <button onClick={() => setSelectedGatePass(null)} className="text-[#9CA3AF] hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Owning Company</span>
                  <p className="font-bold text-[#111827] mt-0.5">{selectedGatePass.tenantName || selectedGatePass.companyName}</p>
                </div>
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Pass Type</span>
                  <p className="font-bold text-[#111827] mt-0.5">{selectedGatePass.passType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Party / Vendor Name</span>
                  <p className="font-bold text-[#111827] mt-0.5">{selectedGatePass.partyName || selectedGatePass.companyName || '-'}</p>
                </div>
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Vehicle Number</span>
                  <p className="font-bold text-[#111827] font-mono mt-0.5">{selectedGatePass.vehicleNumber || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Created By</span>
                  <p className="font-bold text-[#111827] mt-0.5">{selectedGatePass.createdBy || 'Staff'}</p>
                </div>
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Current Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedGatePass.status || selectedGatePass.returnStatus)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EBEFF2]">
              <button
                onClick={() => setSelectedGatePass(null)}
                className="px-4 py-2 bg-[#111827] text-white font-bold rounded-xl text-xs"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY INWARD ENTRY INSPECTION MODAL */}
      {selectedInward && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#EBEFF2]">
            <div className="flex items-center justify-between border-b border-[#EBEFF2] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Inward Transaction Inspection (Read-Only)</h3>
                <span className="text-xs text-[#6B7280]">{selectedInward.inwardNumber || 'Inward Entry'}</span>
              </div>
              <button onClick={() => setSelectedInward(null)} className="text-[#9CA3AF] hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Company</span>
                  <p className="font-bold text-[#111827] mt-0.5">{selectedInward.tenantName || selectedInward.companyName}</p>
                </div>
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Gate Pass Ref</span>
                  <p className="font-bold text-[#111827] mt-0.5">{selectedInward.gatePassNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Supplier / Vendor</span>
                  <p className="font-bold text-[#111827] mt-0.5">{selectedInward.supplierName || '-'}</p>
                </div>
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Challan / Invoice No</span>
                  <p className="font-bold text-[#111827] font-mono mt-0.5">{selectedInward.challanNo || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Total Qty Received</span>
                  <p className="font-bold text-teal-700 text-sm mt-0.5">{selectedInward.totalQuantityReceived || '-'}</p>
                </div>
                <div className="p-3 bg-[#F6F8FA] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Entry Date</span>
                  <p className="font-bold text-[#111827] font-mono mt-0.5">{formatDateStr(selectedInward.entryDate || selectedInward.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EBEFF2]">
              <button
                onClick={() => setSelectedInward(null)}
                className="px-4 py-2 bg-[#111827] text-white font-bold rounded-xl text-xs"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboardPage;
