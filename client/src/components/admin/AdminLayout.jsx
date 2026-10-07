import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SidebarCollapseIcon from '../common/SidebarCollapseIcon';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  PackageCheck,
  Database,
  BarChart3,
  History,
  LogOut,
  Menu,
  X,
  UserCheck,
  Shield,
  Bell,
  Search,
  HelpCircle,
  Settings,
  ChevronDown,
  User,
  ChevronRight
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Dashboard Overview';
    if (path.includes('/admin/users')) return 'User Management';
    if (path.includes('/admin/roles')) return 'Roles & RBAC Control';
    if (path.includes('/admin/gate-passes')) return 'Gate Pass Control';
    if (path.includes('/admin/returnable-materials')) return 'Returnable & Inward Control';
    if (path.includes('/admin/master-data')) return 'Master Data Administration';
    if (path.includes('/admin/reports')) return 'MIS & Corporate Reports';
    if (path.includes('/admin/audit-logs')) return 'System Audit Logs';
    return 'Admin Dashboard';
  };

  const navItems = [
    { label: 'Dashboard Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'User Management', icon: Users, path: '/admin/users' },
    { label: 'Roles & RBAC', icon: ShieldCheck, path: '/admin/roles' },
    { label: 'Gate Pass Control', icon: FileText, path: '/admin/gate-passes' },
    { label: 'Returnable & Inwards', icon: PackageCheck, path: '/admin/returnable-materials' },
    { label: 'Master Data', icon: Database, path: '/admin/master-data' },
    { label: 'MIS & Reports', icon: BarChart3, path: '/admin/reports' },
    { label: 'System Audit Logs', icon: History, path: '/admin/audit-logs' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex max-w-full overflow-x-hidden text-[#111827]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } w-64 bg-white border-r border-[#EBEFF2] text-[#111827] flex flex-col justify-between transition-all duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Brand Banner */}
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
                  <span className="text-[10px] text-[#6B7280] block font-medium">Company Admin Console</span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button className="md:hidden text-[#6B7280] hover:text-[#111827]" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="py-5 px-3 space-y-6">
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={12} className="text-[#111827]" /> Menu
                </div>
              )}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => setSidebarOpen(false)}
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
          </div>
        </div>

        {/* Bottom Anchored Unified User Profile & Logout Section */}
        <div className="p-3 border-t border-[#EBEFF2] bg-[#FAFCFE]">
          <div className="bg-white border border-[#EBEFF2] rounded-xl overflow-hidden shadow-2xs flex flex-col">
            {/* Profile Link Row */}
            <NavLink
              to="/admin/profile"
              title={isCollapsed ? "My Profile" : undefined}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2.5'} transition-colors ${
                  isActive ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'
                }`
              }
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || 'Admin'}
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
                      {user?.name || 'Admin'}
                    </div>
                    <div className="text-[10px] font-medium text-[#6B7280] truncate mt-0.5">
                      Company Admin
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

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} transition-all duration-300 min-w-0 max-w-full`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 items-center justify-between border-b border-[#EBEFF2] bg-white px-4 sm:px-6 lg:px-8 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="-m-2 p-2 text-[#6B7280] md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F6F8FA] rounded-lg transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <SidebarCollapseIcon collapsed={isCollapsed} size={20} />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111827] leading-tight">
                {getPageTitle()}
              </h2>
              <span className="text-[11px] font-semibold text-[#6B7280]">
                {selectedCompany?.name || 'Company Administration'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <div className="hidden md:flex items-center relative w-64">
              <Search size={15} className="absolute left-3 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search for anything…"
                className="w-full bg-[#F6F8FA] border border-[#EBEFF2] text-xs text-[#111827] placeholder-[#9CA3AF] rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#111827] transition-all"
              />
            </div>

            <div className="h-6 w-px bg-[#EBEFF2]" />

            {/* Profile Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer p-1 rounded-lg"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user?.name || 'Admin'}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-[#111827] leading-tight">{user?.name || 'Admin'}</div>
                  <div className="text-[10px] font-medium text-[#6B7280]">Company Admin</div>
                </div>
                <ChevronDown size={14} className={`hidden lg:block text-[#6B7280] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Popup Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#EBEFF2] shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2.5 border-b border-[#EBEFF2] bg-[#F6F8FA]">
                    <div className="text-xs font-bold text-[#111827] truncate">{user?.name || 'Admin'}</div>
                    <div className="text-[11px] font-medium text-[#6B7280] truncate">{user?.email || user?.phone || ''}</div>
                    <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#7C3AED]/10 text-[#7C3AED]">
                      Company Admin
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/admin/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#111827] hover:bg-[#F6F8FA] transition-colors"
                    >
                      <UserCheck size={16} className="text-[#6B7280]" />
                      <span>My Profile</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#EF4444] hover:bg-[#FEE2E2]/50 transition-colors cursor-pointer text-left border-t border-[#EBEFF2]"
                    >
                      <LogOut size={16} className="text-[#EF4444]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 py-4 sm:py-6 min-w-0 max-w-full">
          <div className="px-3 sm:px-6 lg:px-8 mx-auto max-w-7xl min-w-0 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
