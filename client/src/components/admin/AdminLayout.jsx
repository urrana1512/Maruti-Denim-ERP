import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Settings
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    { label: 'My Profile', icon: UserCheck, path: '/admin/profile' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex max-w-full overflow-x-hidden text-[#111827]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#EBEFF2] text-[#111827] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Brand Banner */}
          <div className="flex h-20 items-center justify-between px-4 bg-white border-b border-[#EBEFF2]">
            <div className="flex items-center gap-3 py-1 overflow-hidden">
              <img
                src={selectedCompany?.logoUrl || '/Maruti denim logo.png'}
                alt={selectedCompany?.name || 'Company Logo'}
                className="h-12 max-h-12 w-auto object-contain"
              />
              <div className="truncate">
                <span className="text-xs font-bold text-[#111827] block truncate">
                  {selectedCompany?.name || 'Maruti Denim'}
                </span>
                <span className="text-[10px] text-[#6B7280] block font-medium">Company Admin Console</span>
              </div>
            </div>
            <button className="md:hidden text-[#6B7280] hover:text-[#111827]" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="py-5 px-3 space-y-6">
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} className="text-[#111827]" /> Menu
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#F3F4F6] text-[#111827] font-bold shadow-2xs'
                            : 'text-[#6B7280] hover:bg-[#F6F8FA] hover:text-[#111827]'
                        }`
                      }
                    >
                      <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Anchored Nav Items (No dark mode toggle) */}
        <div className="p-3 border-t border-[#EBEFF2] space-y-1">
          <button className="w-full flex items-center px-3 py-2 text-xs font-medium text-[#6B7280] hover:bg-[#F6F8FA] hover:text-[#111827] rounded-lg transition-all cursor-pointer">
            <HelpCircle className="mr-3 h-4 w-4" />
            Help Center
          </button>
          <button className="w-full flex items-center px-3 py-2 text-xs font-medium text-[#6B7280] hover:bg-[#F6F8FA] hover:text-[#111827] rounded-lg transition-all cursor-pointer">
            <Settings className="mr-3 h-4 w-4" />
            Setting
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300 min-w-0 max-w-full">
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

            {/* User Panel Switcher Button */}
            <NavLink
              to="/dashboard"
              className="text-xs font-semibold text-[#111827] bg-[#F6F8FA] hover:bg-[#EBEFF2] px-3 py-2 rounded-lg border border-[#EBEFF2] transition-colors flex items-center gap-1.5"
            >
              <UserCheck size={15} /> User Panel View
            </NavLink>

            <div className="h-6 w-px bg-[#EBEFF2]" />

            {/* Profile Menu */}
            <div className="flex items-center gap-2.5">
              <NavLink to="/admin/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user?.name || 'Admin'}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-bold text-[#111827] block leading-tight">{user?.name || 'Admin'}</span>
                  <span className="text-[10px] text-[#6B7280] block font-medium">Company Admin</span>
                </div>
              </NavLink>

              <button
                onClick={handleLogout}
                title="Sign Out Admin"
                className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer ml-1"
              >
                <LogOut size={16} />
              </button>
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
