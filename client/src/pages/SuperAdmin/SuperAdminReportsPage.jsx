import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminReportsPage = () => {
  const { currentCompany } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState([]);
  const [exportType, setExportType] = useState('gatepasses');
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getAnalytics(currentCompany);
      if (res.success) {
        setAnalytics(res.analytics || []);
      }
    } catch (err) {
      toast.error('Failed to load platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentCompany]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await superAdminService.exportReport(exportType, currentCompany);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SuperAdmin_${exportType}_Report_${currentCompany.toUpperCase()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Reports & Consolidated Analytics</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Cross-company operational metrics, gate pass trends, and Excel reporting with company attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <Building2 size={15} className="text-sky-600" />
          <span>Active Scope: {currentCompany === 'ALL' ? 'All Companies' : currentCompany.toUpperCase()}</span>
        </div>
      </div>

      {/* Export Section Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-sky-400" size={20} />
            <h3 className="text-base font-bold">Consolidated Excel Export Center</h3>
          </div>
          <p className="text-xs text-slate-300">
            Export unified records for {currentCompany === 'ALL' ? 'all 3 companies' : currentCompany.toUpperCase()} directly to Excel format.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="gatepasses">Gate Passes Report</option>
            <option value="users">User Monitoring Report</option>
          </select>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-900 font-black text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? 'Generating...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analytics.map((item) => (
            <div key={item.companyCode} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">{item.companyName}</h3>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.companyCode}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Gate Passes</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{item.totalGatePasses}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Active Gate Passes</p>
                  <p className="text-lg font-black text-blue-600 mt-0.5">{item.activeGatePasses}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Returnable Passes</p>
                  <p className="text-lg font-black text-amber-600 mt-0.5">{item.returnableGatePasses}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Users</p>
                  <p className="text-lg font-black text-indigo-600 mt-0.5">{item.totalUsers}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminReportsPage;
