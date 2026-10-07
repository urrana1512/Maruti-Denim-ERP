import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { roleService } from '../../services/roleService';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Shield,
  Phone,
  Mail,
  Building2,
  AlertTriangle,
  X,
  RefreshCw
} from 'lucide-react';

const DEPARTMENTS = ['ALL', 'Store', 'Purchase', 'Maintenance', 'Accounts', 'Operations', 'Quality Control', 'IT', 'HR & Admin', 'Admin'];

const AdminUsersPage = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [approveModalUser, setApproveModalUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', department: '', designation: '', roleId: '' });

  const [deleteModalUser, setDeleteModalUser] = useState(null);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        adminService.getUsers({ search, status: statusFilter, department: deptFilter, role: roleFilter }),
        roleService.getRoles()
      ]);
      if (uRes.success) setUsers(uRes.users);
      if (rRes.success) setRoles(rRes.roles);
    } catch (err) {
      toast.error('Error fetching user accounts or roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, [statusFilter, deptFilter, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsersAndRoles();
  };

  const handleApprove = async () => {
    if (!approveModalUser) return;
    try {
      const res = await adminService.approveUser(approveModalUser._id, selectedRoleId);
      if (res.success) {
        toast.success(res.message);
        setApproveModalUser(null);
        fetchUsersAndRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleReject = async () => {
    if (!rejectModalUser) return;
    try {
      const res = await adminService.rejectUser(rejectModalUser._id, rejectionReason);
      if (res.success) {
        toast.success(res.message);
        setRejectModalUser(null);
        fetchUsersAndRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    }
  };

  const handleToggleStatus = async (user, newStatus) => {
    try {
      const res = await adminService.toggleUserStatus(user._id, newStatus);
      if (res.success) {
        toast.success(res.message);
        fetchUsersAndRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status toggle failed.');
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;
    try {
      const res = await adminService.updateUser(editModalUser._id, editForm);
      if (res.success) {
        toast.success(res.message);
        setEditModalUser(null);
        fetchUsersAndRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating user.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalUser) return;
    try {
      const res = await adminService.deleteUser(deleteModalUser._id);
      if (res.success) {
        toast.success(res.message);
        setDeleteModalUser(null);
        fetchUsersAndRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'User deletion failed.');
    }
  };

  const openEditModal = (user) => {
    setEditModalUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      designation: user.designation,
      roleId: user.role?._id || ''
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Active</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">Pending Approval</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      case 'INACTIVE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-200 text-slate-700 border border-slate-300">Deactivated</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Enterprise User Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Approve registrations, assign RBAC roles, edit profiles, and activate accounts</p>
        </div>
        <button
          onClick={fetchUsersAndRoles}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-md border border-border-subtle shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={16} /> Refresh List
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-card p-3 sm:p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or designation..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-border-subtle rounded-md focus:ring-1 focus:ring-brand-denim outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-navy text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
            <Filter size={16} /> Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-border-subtle rounded-md bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Active / Approved</option>
            <option value="INACTIVE">Deactivated</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-border-subtle rounded-md bg-white text-slate-700 font-medium"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-surface-card rounded-xl border border-border-subtle shadow-sm overflow-hidden min-w-0 max-w-full">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-brand-navy">No user accounts found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Try adjusting search criteria or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-subtle">
              <thead className="bg-surface-bg text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left">Employee</th>
                  <th className="px-6 py-3 text-left">Contact</th>
                  <th className="px-6 py-3 text-left">Department & Role</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Registered Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border-subtle text-sm text-slate-700">
                {users.map((u) => {
                  const currentAdmin = (() => {
                    try { return JSON.parse(localStorage.getItem('maruti_user') || '{}'); } catch (e) { return {}; }
                  })();
                  const isSelf = (u._id && currentAdmin._id && u._id === currentAdmin._id) ||
                                 (u.email && currentAdmin.email && u.email.toLowerCase() === currentAdmin.email.toLowerCase());

                  return (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-brand-navy text-sm sm:text-base">{u.name}</div>
                          {isSelf && (
                            <span className="text-[10px] uppercase font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{u.designation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Mail size={14} className="text-slate-400" /> {u.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-xs">
                          <Phone size={14} className="text-slate-400" /> {u.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 size={14} className="text-slate-400" /> {u.department}
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold mt-1 border border-blue-100">
                          <Shield size={12} /> {u.roleName || u.role?.name || 'Department Staff'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(u.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs sm:text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => {
                                  setApproveModalUser(u);
                                  setSelectedRoleId(u.role?._id || roles[0]?._id || '');
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs shadow-sm cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectModalUser(u)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md text-xs shadow-sm cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {(u.status === 'APPROVED' || u.status === 'ACTIVE') && !isSelf && (
                            <button
                              onClick={() => handleToggleStatus(u, 'INACTIVE')}
                              title="Deactivate Account"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md border border-amber-200 transition-colors cursor-pointer"
                            >
                              <UserX size={16} />
                            </button>
                          )}

                          {u.status === 'INACTIVE' && !isSelf && (
                            <button
                              onClick={() => handleToggleStatus(u, 'APPROVED')}
                              title="Activate Account"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <UserCheck size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit User Details"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors cursor-pointer"
                          >
                            <Edit size={16} />
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => setDeleteModalUser(u)}
                              title="Delete User"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVE USER MODAL */}
      {approveModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-brand-navy">Approve User Account</h3>
              <button onClick={() => setApproveModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Approve registration for <strong>{approveModalUser.name}</strong> ({approveModalUser.email}).
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Security Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white font-medium"
              >
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} — {r.description || 'Standard Role'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setApproveModalUser(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-md">
                Cancel
              </button>
              <button onClick={handleApprove} className="px-4 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-md hover:bg-emerald-700">
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT USER MODAL */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-rose-900">Reject User Registration</h3>
              <button onClick={() => setRejectModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Provide a reason for declining registration for <strong>{rejectModalUser.name}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Employee details could not be verified with HR."
              className="w-full p-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalUser(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-md">
                Cancel
              </button>
              <button onClick={handleReject} className="px-4 py-2 bg-rose-600 text-white text-xs sm:text-sm font-bold rounded-md hover:bg-rose-700">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-brand-navy">Edit Employee Profile</h3>
              <button onClick={() => setEditModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editForm.roleId}
                  onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-white font-medium"
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setEditModalUser(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-navy text-white font-bold rounded-md hover:bg-slate-800">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-brand-navy">Delete User Account</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete the account for <strong>{deleteModalUser.name}</strong> ({deleteModalUser.email})?
              This action will be recorded in the security audit trail.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteModalUser(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-md">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-rose-600 text-white text-xs sm:text-sm font-bold rounded-md hover:bg-rose-700">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
