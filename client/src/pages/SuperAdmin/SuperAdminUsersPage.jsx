import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  Lock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminUsersPage = () => {
  const { currentCompany } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [status, setStatus] = useState('ALL');
  const [role, setRole] = useState('ALL');
  const [search, setSearch] = useState('');

  // PII Inspection Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getConsolidatedUsers({
        companyCode: currentCompany,
        status,
        role,
        search,
        page,
        limit: 15
      });
      if (res.success) {
        setUsers(res.users || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      toast.error('Failed to load consolidated user records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentCompany, status, role, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleInspectUser = async (u) => {
    setLoadingUserDetail(true);
    try {
      const res = await superAdminService.getUserDetails(u.companyCode, u._id);
      if (res.success) {
        setSelectedUser(res.user);
        toast.info(`Full PII unmasked for inspection (Audit entry logged).`);
      }
    } catch (err) {
      toast.error('Failed to load unmasked user details.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform User Monitoring & Governance</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Cross-company user registry with Privacy-First PII minimization in list views.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700">
          <Shield size={15} />
          <span>PII Minimization Active (Emails & Phones Masked)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search name, designation, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved / Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Owning Company</th>
                  <th className="py-3.5 px-4">Employee Name</th>
                  <th className="py-3.5 px-4">Email (Masked)</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">PII Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={`${u.companyCode}-${u._id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {u.companyTitle}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{u.emailMasked}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{u.department || 'General'}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{u.roleName || 'Staff'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'APPROVED' || u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspectUser(u)}
                        disabled={loadingUserDetail}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ml-auto"
                        title="Unmask PII Details (Logs Audit Entry)"
                      >
                        <Eye size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            No user accounts found matching criteria.
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Showing page {page} of {totalPages} ({total} total users)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single User Inspection Modal (Unmasked Full PII + Audit Warning) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">User PII Unmasked Inspection</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <span>Security Note: Access to unmasked PII has been logged to the platform audit trail.</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Full Name</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedUser.name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Owning Tenant</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedUser.companyName}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 font-mono">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase font-sans">Full Email Address</p>
                  <p className="font-bold text-indigo-700">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase font-sans">Full Phone Number</p>
                  <p className="font-bold text-slate-800">{selectedUser.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Department & Designation</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedUser.department} • {selectedUser.designation}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Account Status</p>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedUser.status}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
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

export default SuperAdminUsersPage;
