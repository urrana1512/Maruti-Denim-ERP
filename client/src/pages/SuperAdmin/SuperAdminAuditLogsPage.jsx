import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Download, Calendar, Loader2, AlertCircle, Eye, Shield, RefreshCw } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import AuditDetailModal from '../../components/common/AuditDetailModal';

const SuperAdminAuditLogsPage = () => {
  const outletContext = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCompanyCode = searchParams.get('companyCode') || outletContext?.currentCompany || 'ALL';

  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [companyFilter, setCompanyFilter] = useState(selectedCompanyCode);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected for modal
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setCompanyFilter(selectedCompanyCode);
  }, [selectedCompanyCode]);

  const fetchPlatformAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/superadmin/audit-logs', {
        params: {
          page,
          limit: 15,
          companyCode: companyFilter !== 'ALL' ? companyFilter : undefined,
          search: search || undefined,
          module: moduleFilter || undefined,
          action: actionFilter || undefined,
          actorRole: userRoleFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });

      if (response.data?.success) {
        setLogs(response.data.data || []);
        setTotalCount(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching platform audit logs:', err);
      setError('Failed to load platform audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, companyFilter, search, moduleFilter, actionFilter, userRoleFilter, startDate, endDate]);

  useEffect(() => {
    fetchPlatformAuditLogs();
  }, [fetchPlatformAuditLogs]);

  const handleCompanyChange = (e) => {
    const code = e.target.value;
    setCompanyFilter(code);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (code === 'ALL') {
      newParams.delete('companyCode');
    } else {
      newParams.set('companyCode', code);
    }
    setSearchParams(newParams);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await api.get('/superadmin/audit-logs/export', {
        params: {
          companyCode: companyFilter !== 'ALL' ? companyFilter : undefined,
          search: search || undefined,
          module: moduleFilter || undefined,
          action: actionFilter || undefined,
          actorRole: userRoleFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Platform_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export platform audit log CSV:', err);
      alert('Failed to generate platform audit log CSV export.');
    } finally {
      setExporting(false);
    }
  };

  const handleRowClick = (log) => {
    setSelectedAudit(log);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#EBEFF2] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-[#111827]">Platform Audit Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#111827] text-white">
              {totalCount} Monitoring Events
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Cross-company monitoring audit trail across Maruti Denim, Shri Ram Cot Fab, and Balaji Polycot. Strictly read-only.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-xl border border-[#BFDBFE]">
            <Shield size={15} /> Platform Read-Only
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={15} />}
            Export CSV
          </button>
          <button
            onClick={fetchPlatformAuditLogs}
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F6F8FA] rounded-xl border border-[#EBEFF2] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBEFF2] shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={handleCompanyChange}
            className="bg-[#F6F8FA] border border-[#EBEFF2] text-xs font-bold text-[#111827] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Companies</option>
            <option value="maruti_nandan">Maruti Nandan Denim</option>
            <option value="shri_ram">Shri Ram Cot Fab</option>
            <option value="balaji_polycot">Balaji Polycot</option>
          </select>

          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search actor, action, description or reference…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#F6F8FA] border border-[#EBEFF2] text-xs text-[#111827] placeholder-[#9CA3AF] rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#111827] transition-all"
            />
          </div>

          {/* User Role Filter */}
          <select
            value={userRoleFilter}
            onChange={(e) => { setUserRoleFilter(e.target.value); setPage(1); }}
            className="bg-[#F6F8FA] border border-[#EBEFF2] text-xs font-semibold text-[#111827] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="Company Admin">Company Admin</option>
            <option value="Super Admin">Super Admin</option>
            <option value="System">System</option>
          </select>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            className="bg-[#F6F8FA] border border-[#EBEFF2] text-xs font-semibold text-[#111827] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">All Modules</option>
            <option value="GATE_PASS">Gate Pass</option>
            <option value="INWARD">Material Inward</option>
            <option value="RETURNABLE">Returnable</option>
            <option value="USER_MANAGEMENT">User Management</option>
            <option value="AUTH">Authentication</option>
            <option value="SYSTEM">System Platform</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-[#F6F8FA] border border-[#EBEFF2] text-xs font-semibold text-[#111827] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="CANCEL">CANCEL</option>
            <option value="LOGIN">LOGIN</option>
          </select>

          {/* Date range input */}
          <div className="flex items-center gap-1.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl px-2 py-1">
            <Calendar size={13} className="text-[#9CA3AF] shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-transparent text-[11px] font-semibold text-[#111827] focus:outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Table Body */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EBEFF2] p-12 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#111827] mx-auto" />
          <p className="text-xs text-[#6B7280]">Loading platform audit logs…</p>
        </div>
      ) : error ? (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-[#DC2626] mx-auto" />
          <p className="text-xs font-semibold text-[#DC2626]">{error}</p>
          <button
            onClick={fetchPlatformAuditLogs}
            className="px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EBEFF2] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F6F8FA] text-[#9CA3AF] flex items-center justify-center mx-auto">
            <History size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#111827]">No platform activity found for the selected filters.</h3>
          <p className="text-xs text-[#6B7280]">Try adjusting company selection or filter parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EBEFF2] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EBEFF2] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEFF2] text-xs">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => handleRowClick(log)}
                    className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#4B5563] whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      }) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">
                      {log.companyId ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#F3F4F6] text-[#374151]">
                          {typeof log.companyId === 'object' ? log.companyId.name : log.companyId}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#111827] text-white">
                          Central Platform
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">
                        {log.actorName || 'System'}
                      </div>
                      <div className="text-[10px] text-[#6B7280] capitalize">
                        {log.actorRole || 'System'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#111827] text-white">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#4B5563]">
                      {log.module}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#111827] max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#6B7280]">
                      {log.entityId || log.entityType || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRowClick(log); }}
                        className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#EBEFF2] rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#EBEFF2] text-xs font-medium text-[#6B7280]">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EBEFF2] hover:bg-[#F6F8FA] disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EBEFF2] hover:bg-[#F6F8FA] disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AuditDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        auditLog={selectedAudit}
      />
    </div>
  );
};

export default SuperAdminAuditLogsPage;
