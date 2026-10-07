import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SidebarCollapseIcon from '../common/SidebarCollapseIcon';
import {
  LayoutDashboard,
  FileText,
  PlusSquare,
  ArrowRightLeft,
  BarChart3,
  X,
  Database,
  Building2,
  Layers,
  Shield,
  UserCheck,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { user, logout, hasPermission, isAdmin, selectedCompany } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', perm: null },
    { label: 'Add Gate Pass', icon: PlusSquare, path: '/gate-pass/add', perm: 'gate_pass_create' },
    { label: 'Manage Gate Pass', icon: FileText, path: '/gate-pass/manage', perm: 'gate_pass_read' },
    { label: 'Material Inward', icon: ArrowRightLeft, path: '/material-inward', perm: 'material_inward_read' },
    { label: 'Reports & MIS', icon: BarChart3, path: '/reports', perm: 'reports_view' }
  ];

  const masterNavItems = [
    { label: 'Item Description', icon: Layers, path: '/master-data/items', perm: 'master_data_read' },
    { label: 'Vendor Name', icon: Building2, path: '/master-data/vendors', perm: 'master_data_read' }
  ];

  const visibleNavItems = navItems.filter((i) => !i.perm || hasPermission(i.perm));
  const visibleMasterItems = masterNavItems.filter((i) => !i.perm || hasPermission(i.perm));

  const sidebarClass = `fixed inset-y-0 left-0 z-50 ${
    isCollapsed ? 'md:w-20' : 'md:w-64'
  } w-64 bg-white border-r border-[#EBEFF2] text-[#111827] flex flex-col justify-between transition-all duration-300 ease-in-out md:translate-x-0 ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={sidebarClass}>
        <div>
          {/* Top Brand Logo Banner */}
          <div className="flex h-20 items-center justify-between px-3.5 bg-white border-b border-[#EBEFF2]">
            <div className="flex items-center gap-3 py-1 overflow-hidden">
              <img
                src={selectedCompany?.logoUrl || '/Maruti denim logo.png'}
                alt={selectedCompany?.name || 'Company Logo'}
                className="h-10 max-h-10 w-auto object-contain shrink-0"
              />
              {!isCollapsed && (
                <div className="truncate">
                  <span className="text-xs font-bold text-[#111827] block truncate">
                    {selectedCompany?.name || 'Maruti Denim'}
                  </span>
                  <span className="text-[10px] text-[#6B7280] block font-medium">Gate Pass System</span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button className="md:hidden text-[#6B7280] hover:text-[#111827] ml-2" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="py-5 px-3 space-y-6">
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Menu
                </div>
              )}
              <nav className="space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-xs font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#F3F4F6] text-[#111827] font-bold shadow-2xs'
                            : 'text-[#6B7280] hover:bg-[#F6F8FA] hover:text-[#111827]'
                        }`
                      }
                    >
                      <Icon className={`${isCollapsed ? 'm-0' : 'mr-3'} h-4 w-4 flex-shrink-0`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {visibleMasterItems.length > 0 && (
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                    <Database size={12} className="text-[#6B7280]" /> Master Data
                  </div>
                )}
                <nav className="space-y-1">
                  {visibleMasterItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        title={isCollapsed ? item.label : undefined}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-xs font-medium rounded-lg transition-all ${
                            isActive
                              ? 'bg-[#F3F4F6] text-[#111827] font-bold shadow-2xs'
                              : 'text-[#6B7280] hover:bg-[#F6F8FA] hover:text-[#111827]'
                          }`
                        }
                      >
                        <Icon className={`${isCollapsed ? 'm-0' : 'mr-3'} h-4 w-4 flex-shrink-0`} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            )}

            {isAdmin && (
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={12} className="text-[#111827]" /> Administration
                  </div>
                )}
                <nav className="space-y-1">
                  <NavLink
                    to="/admin/dashboard"
                    title={isCollapsed ? "Admin Panel" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-xs font-bold rounded-lg bg-[#111827] text-white hover:bg-[#1F2937] transition-all shadow-xs`}
                  >
                    <Shield className={`${isCollapsed ? 'm-0' : 'mr-3'} h-4 w-4 text-white`} />
                    {!isCollapsed && <span>Admin Panel</span>}
                  </NavLink>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Anchored Unified User Profile & Logout Section */}
        <div className="p-3 border-t border-[#EBEFF2] bg-[#FAFCFE]">
          <div className="bg-white border border-[#EBEFF2] rounded-xl overflow-hidden shadow-2xs flex flex-col">
            {/* Profile Link Row */}
            <NavLink
              to="/profile"
              title={isCollapsed ? "My Profile" : undefined}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2.5'} transition-colors ${
                  isActive ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'
                }`
              }
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || 'User'}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
              )}

              {!isCollapsed && (
                <>
                  <div className="truncate text-left min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#111827] truncate leading-tight">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-[10px] font-medium text-[#6B7280] truncate mt-0.5">
                      {user?.designation || user?.roleName || user?.department || 'Employee'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
                </>
              )}
            </NavLink>

            {/* Integrated Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center py-2' : 'justify-center gap-2 py-2 px-3'
              } text-xs font-semibold text-[#EF4444] hover:bg-[#FEE2E2]/60 border-t border-[#EBEFF2] transition-colors cursor-pointer`}
            >
              <LogOut size={14} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
