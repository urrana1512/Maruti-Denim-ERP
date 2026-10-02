import React, { useState, useEffect } from 'react';
import { roleService } from '../../services/roleService';
import { toast } from 'sonner';
import { ShieldCheck, Plus, Edit, Trash2, Shield, X } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  { group: 'Admin Controls', perm: 'admin_access', label: 'Admin Panel Access' },
  { group: 'Admin Controls', perm: 'user_management', label: 'Manage User Accounts & Approvals' },
  { group: 'Admin Controls', perm: 'rbac_management', label: 'Manage Roles & System Permissions' },

  { group: 'Gate Pass Module', perm: 'gate_pass_read', label: 'View Gate Passes' },
  { group: 'Gate Pass Module', perm: 'gate_pass_create', label: 'Create New Gate Pass' },
  { group: 'Gate Pass Module', perm: 'gate_pass_update', label: 'Edit Existing Gate Pass' },
  { group: 'Gate Pass Module', perm: 'gate_pass_delete', label: 'Cancel / Delete Gate Pass' },
  { group: 'Gate Pass Module', perm: 'gate_pass_approve', label: 'Approve Gate Pass' },
  { group: 'Gate Pass Module', perm: 'gate_pass_close', label: 'Force Close Gate Pass' },

  { group: 'Material Inward', perm: 'material_inward_read', label: 'View Inward Receipts' },
  { group: 'Material Inward', perm: 'material_inward_create', label: 'Process Material Inward' },
  { group: 'Material Inward', perm: 'material_inward_delete', label: 'Delete Inward Receipt' },

  { group: 'Master Data', perm: 'master_data_read', label: 'View Items & Vendor Masters' },
  { group: 'Master Data', perm: 'master_data_manage', label: 'Add/Edit Master Records' },

  { group: 'MIS & Reports', perm: 'reports_view', label: 'Access MIS Reports' },
  { group: 'MIS & Reports', perm: 'reports_export', label: 'Export Reports (Excel/PDF)' },
];

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [modalRole, setModalRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await roleService.getRoles();
      if (res.success) {
        setRoles(res.roles);
      }
    } catch (err) {
      toast.error('Failed to load system roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setModalRole({});
    setRoleName('');
    setRoleDesc('');
    setSelectedPerms(['gate_pass_read', 'master_data_read']);
  };

  const openEditModal = (role) => {
    setModalRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setSelectedPerms(role.permissions || []);
  };

  const togglePermission = (perm) => {
    if (selectedPerms.includes(perm)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== perm));
    } else {
      setSelectedPerms([...selectedPerms, perm]);
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleName) {
      toast.error('Role name is required.');
      return;
    }

    try {
      if (modalRole._id) {
        const res = await roleService.updateRole(modalRole._id, {
          name: roleName,
          description: roleDesc,
          permissions: selectedPerms
        });
        if (res.success) {
          toast.success(res.message);
          setModalRole(null);
          fetchRoles();
        }
      } else {
        const res = await roleService.createRole({
          name: roleName,
          description: roleDesc,
          permissions: selectedPerms
        });
        if (res.success) {
          toast.success(res.message);
          setModalRole(null);
          fetchRoles();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving role.');
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystemRole) {
      toast.error('System roles cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete custom role '${role.name}'?`)) return;

    try {
      const res = await roleService.deleteRole(role._id);
      if (res.success) {
        toast.success(res.message);
        fetchRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting role.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Role-Based Access Control (RBAC)</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage data-driven user roles and fine-grained granular permissions</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Create Custom Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {roles.map((r) => (
          <div key={r._id} className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className={r.isSystemRole ? 'text-brand-denim' : 'text-slate-600'} size={20} />
                  <h3 className="font-bold text-brand-navy text-base">{r.name}</h3>
                </div>
                {r.isSystemRole && (
                  <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-blue-50 text-brand-denim border border-blue-100">
                    System Role
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 min-h-[36px]">{r.description || 'Enterprise Operational Role'}</p>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Granted Permissions</span>
                  <span className="text-brand-denim bg-blue-50 px-2 py-0.5 rounded font-bold text-xs">
                    {r.permissions?.length || 0} / {AVAILABLE_PERMISSIONS.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {r.permissions?.map((p) => (
                    <span key={p} className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(r)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-brand-denim bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit size={14} /> Edit Permissions
              </button>
              {!r.isSystemRole && (
                <button
                  onClick={() => handleDeleteRole(r)}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      {modalRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-brand-navy">
                {modalRole._id ? `Edit Role: ${modalRole.name}` : 'Create Custom Enterprise Role'}
              </h3>
              <button onClick={() => setModalRole(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    disabled={modalRole.isSystemRole}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Store Auditor"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-denim disabled:bg-slate-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <input
                    type="text"
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="e.g. Audits store inventory and reports"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-denim font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Select Role Permissions ({selectedPerms.length} Selected)
                </label>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-72 overflow-y-auto">
                  {['Admin Controls', 'Gate Pass Module', 'Material Inward', 'Master Data', 'MIS & Reports'].map((group) => {
                    const groupPerms = AVAILABLE_PERMISSIONS.filter((ap) => ap.group === group);
                    return (
                      <div key={group} className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupPerms.map((item) => {
                            const isChecked = selectedPerms.includes(item.perm);
                            return (
                              <label
                                key={item.perm}
                                className={`flex items-center gap-2 p-2 rounded-md border text-xs sm:text-sm cursor-pointer transition-all ${
                                  isChecked ? 'bg-white border-brand-denim text-brand-navy shadow-sm font-semibold' : 'bg-white/60 border-slate-200 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(item.perm)}
                                  className="rounded text-brand-denim focus:ring-brand-denim"
                                />
                                <span>{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setModalRole(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-navy text-white text-xs sm:text-sm font-bold rounded-md hover:bg-slate-800">
                  Save Role Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRolesPage;
