import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  Bell
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    <div className="min-h-screen bg-surface-bg flex max-w-full overflow-x-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Admin Sidebar matching Sidebar.jsx */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy text-white flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Brand Banner */}
          <div className="flex h-20 items-center justify-between px-4 bg-brand-navy border-b border-white/10 shadow-sm">
            <div className="flex items-center justify-center w-full py-1">
              <img
                src="/Maruti denim logo.png"
                alt="Maruti Denim Logo"
                className="h-20 max-h-20 w-auto object-contain filter drop-shadow"
              />
            </div>
            <button className="md:hidden text-gray-300 hover:text-white ml-2" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="py-4 px-3 space-y-6">
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} className="text-blue-400" /> Administration Modules
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
                        `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-denim text-white shadow'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
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

        {/* User Footer Profile */}
        <div className="p-4 bg-brand-navy border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-denim text-white font-bold text-xs flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> Active Admin
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out Admin"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-all cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area matching Header.jsx */}
      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300 min-w-0 max-w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 items-center justify-between border-b border-border-subtle bg-surface-card px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-brand-navy text-white rounded-md uppercase tracking-wider">
                Admin Panel
              </span>
              <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">
                Maruti Denim Gate Pass Management System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NavLink
              to="/dashboard"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-brand-denim bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <UserCheck size={16} /> User Panel View
            </NavLink>

            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-denim text-white font-bold text-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-sm font-semibold text-slate-700 block leading-tight">{user?.name}</span>
                <span className="text-xs font-medium text-slate-500 block">{user?.department || 'System Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
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
