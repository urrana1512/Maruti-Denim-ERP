import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Filter, Calendar, Loader2, AlertCircle, Eye, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import AuditDetailModal from '../../components/common/AuditDetailModal';

const EmployeeActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected for modal
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchMyActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/audit-logs/my-activity', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          module: moduleFilter || undefined,
          action: actionFilter || undefined,
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
      console.error('Error fetching employee activity history:', err);
      setError('Failed to load your activity history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, moduleFilter, actionFilter, startDate, endDate]);

  useEffect(() => {
    fetchMyActivity();
  }, [fetchMyActivity]);

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
            <h1 className="text-xl font-extrabold text-[#111827]">My Activity History</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#111827]/10 text-[#111827]">
              {totalCount} Events
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Personal audit history of actions taken within your account. Immutable and permanent.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-3 py-1.5 rounded-xl border border-[#A7F3D0]">
          <ShieldCheck size={16} /> Immutable Audit Record
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBEFF2] shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search description or reference…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#F6F8FA] border border-[#EBEFF2] text-xs text-[#111827] placeholder-[#9CA3AF] rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#111827] transition-all"
            />
          </div>

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
            <option value="AUTH">Authentication</option>
            <option value="PROFILE">Profile & Password</option>
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
            <option value="CANCEL">CANCEL</option>
            <option value="SUBMIT">SUBMIT</option>
            <option value="LOGIN">LOGIN</option>
            <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
          </select>

          {/* Date range inputs */}
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

      {/* Activity Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EBEFF2] p-12 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#111827] mx-auto" />
          <p className="text-xs text-[#6B7280]">Loading your activity history…</p>
        </div>
      ) : error ? (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-[#DC2626] mx-auto" />
          <p className="text-xs font-semibold text-[#DC2626]">{error}</p>
          <button
            onClick={fetchMyActivity}
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
          <h3 className="text-sm font-bold text-[#111827]">No activity yet — You don't have any activity to display.</h3>
          <p className="text-xs text-[#6B7280]">Actions like creating gate passes or updating profile settings will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EBEFF2] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EBEFF2] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
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
                    <td className="py-3.5 px-4 font-bold">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#111827] text-white">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#4B5563]">
                      {log.module}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#111827] max-w-md truncate">
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

export default EmployeeActivityPage;
