import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import { Search, RefreshCw } from 'lucide-react';

const MODULES = ['ALL', 'AUTH', 'USER', 'ROLE', 'GATE_PASS', 'MATERIAL_INWARD', 'MASTER_DATA', 'SYSTEM'];

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs({ search, module: moduleFilter });
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">System Audit & Security Logs</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Immutable audit trail of user approvals, role updates, force closures, and system actions</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-md border border-border-subtle shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={16} /> Refresh Logs
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-surface-card p-3 sm:p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by user, action, target ID..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-border-subtle rounded-md focus:ring-1 focus:ring-brand-denim outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-navy text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-border-subtle rounded-md bg-white text-slate-700 font-medium"
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? 'All Modules' : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-surface-card rounded-xl border border-border-subtle shadow-sm overflow-hidden min-w-0 max-w-full">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No audit log entries recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-subtle">
              <thead className="bg-surface-bg text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left">Timestamp</th>
                  <th className="px-6 py-3 text-left">User / Actor</th>
                  <th className="px-6 py-3 text-left">Module & Action</th>
                  <th className="px-6 py-3 text-left">Target ID</th>
                  <th className="px-6 py-3 text-left">Action Details</th>
                  <th className="px-6 py-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border-subtle text-sm text-slate-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs sm:text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.userName || log.userEmail || 'System'}</div>
                      <div className="text-xs text-brand-denim font-semibold">{log.userRole || 'Admin'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-bold rounded uppercase bg-slate-100 text-slate-800 border border-slate-200 mr-2">
                        {log.module}
                      </span>
                      <span className="font-bold text-slate-900">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {log.targetId || '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
