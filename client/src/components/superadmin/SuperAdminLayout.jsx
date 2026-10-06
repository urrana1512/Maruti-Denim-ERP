import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  PackageCheck,
  Users,
  ShieldCheck,
  BarChart3,
  History,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Filter,
  Globe
} from 'lucide-react';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { superAdmin, superAdminLogout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCompany = searchParams.get('companyCode') || 'ALL';

  const handleCompanyChange = (e) => {
    const code = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (code === 'ALL') {
      newParams.delete('companyCode');
    } else {
      newParams.set('companyCode', code);
    }
    setSearchParams(newParams);
  };

  const handleLogout = () => {
    superAdminLogout();
    navigate('/superadmin/login');
  };

  const navItems = [
    { label: 'Platform Dashboard', icon: LayoutDashboard, path: '/superadmin/dashboard' },
    { label: 'Company Overview', icon: Building2, path: '/superadmin/companies' },
    { label: 'All Gate Passes', icon: FileText, path: '/superadmin/gate-passes' },
    { label: 'Inward & Returnables', icon: PackageCheck, path: '/superadmin/inward-returnables' },
    { label: 'User Monitoring', icon: Users, path: '/superadmin/users' },
    { label: 'Company Admins', icon: ShieldCheck, path: '/superadmin/company-admins' },
    { label: 'Reports & Analytics', icon: BarChart3, path: '/superadmin/reports' },
    { label: 'Platform Audit Logs', icon: History, path: '/superadmin/audit-logs' },
    { label: 'System Alerts', icon: AlertTriangle, path: '/superadmin/alerts' },
    { label: 'Profile & Security', icon: Settings, path: '/superadmin/settings' }
  ];

  return (
    <div className="min-h-screen bg-surface-bg flex max-w-full overflow-x-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Super Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy text-white flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Brand Banner */}
          <div className="flex h-20 items-center justify-between px-4 bg-brand-navy border-b border-white/10 shadow-sm">
            <div className="flex items-center gap-2 py-1">
              <div className="p-2 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-lg text-white shadow-md">
                <Globe size={22} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide uppercase">Platform Console</h1>
                <p className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider">Super Administrator</p>
              </div>
            </div>
            <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="py-4 px-3 space-y-6">
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} className="text-sky-400" /> Platform Monitoring
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  // Preserve companyCode searchParam in nav links if present
                  const targetPath = currentCompany !== 'ALL' ? `${item.path}?companyCode=${currentCompany}` : item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={targetPath}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-denim text-white shadow-md font-semibold'
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs shadow flex-shrink-0">
              {superAdmin?.name ? superAdmin.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{superAdmin?.name || 'Super Admin'}</p>
              <p className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block animate-pulse"></span> Super Administrator
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out Super Admin"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-all cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
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
              <span className="text-xs font-bold px-2.5 py-1 bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-md uppercase tracking-wider shadow-sm">
                Super Admin Console
              </span>
              <span className="text-sm font-medium text-slate-500 hidden lg:inline-block">
                Maruti Denim Group Central Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Company Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <Filter size={15} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline-block">Company Filter:</span>
              <select
                value={currentCompany}
                onChange={handleCompanyChange}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">🏢 All Companies (Consolidated)</option>
                <option value="maruti_nandan">🔵 Maruti Nandan Denim</option>
                <option value="shri_ram">🟢 Shri Ram Cot Fab</option>
                <option value="balaji_polycot">🟠 Balaji Polycot</option>
              </select>
            </div>

            {/* Profile pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                SA
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-slate-800">{superAdmin?.name || 'Platform Admin'}</p>
                <p className="text-[10px] text-slate-500">Root Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-surface-bg min-w-0">
          <Outlet context={{ currentCompany }} />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
