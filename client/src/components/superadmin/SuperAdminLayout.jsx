import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  Globe,
  Search,
  HelpCircle,
  UserCheck
} from 'lucide-react';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { superAdmin, superAdminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/superadmin/dashboard')) return 'Platform Dashboard Overview';
    if (path.includes('/superadmin/companies')) return 'Company Directory & Overview';
    if (path.includes('/superadmin/gate-passes')) return 'Group Gate Pass Monitoring';
    if (path.includes('/superadmin/inward-returnables')) return 'Group Inward & Returnables';
    if (path.includes('/superadmin/users')) return 'Cross-Company User Monitoring';
    if (path.includes('/superadmin/company-admins')) return 'Company Administrators';
    if (path.includes('/superadmin/reports')) return 'Group MIS & Analytics';
    if (path.includes('/superadmin/audit-logs')) return 'Platform Audit Logs';
    if (path.includes('/superadmin/alerts')) return 'System Security Alerts';
    if (path.includes('/superadmin/settings')) return 'Platform Settings & Security';
    return 'Super Admin Console';
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
    { label: 'Profile & Security', icon: UserCheck, path: '/superadmin/profile' },
    { label: 'Platform Settings', icon: Settings, path: '/superadmin/settings' }
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex max-w-full overflow-x-hidden text-[#111827]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Super Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#EBEFF2] text-[#111827] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Brand Banner */}
          <div className="flex h-20 items-center justify-between px-4 bg-white border-b border-[#EBEFF2]">
            <div className="flex items-center gap-3 py-1 overflow-hidden">
              <div className="p-2 bg-[#111827] text-white rounded-lg shadow-xs shrink-0">
                <Globe size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-[#111827] block tracking-wide uppercase">
                  Platform Console
                </span>
                <span className="text-[10px] text-[#6B7280] block font-semibold uppercase">
                  Super Administrator
                </span>
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
                  const targetPath = currentCompany !== 'ALL' ? `${item.path}?companyCode=${currentCompany}` : item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={targetPath}
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

        {/* Bottom Anchored Nav Items */}
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
                Maruti Denim Group Central Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="hidden lg:flex items-center relative w-56">
              <Search size={15} className="absolute left-3 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search platform…"
                className="w-full bg-[#F6F8FA] border border-[#EBEFF2] text-xs text-[#111827] placeholder-[#9CA3AF] rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#111827] transition-all"
              />
            </div>

            {/* Global Company Filter Dropdown */}
            <div className="flex items-center gap-2 bg-[#F6F8FA] border border-[#EBEFF2] rounded-lg px-3 py-1.5 shadow-2xs">
              <Filter size={14} className="text-[#6B7280]" />
              <span className="text-xs font-semibold text-[#6B7280] hidden sm:inline-block">Company:</span>
              <select
                value={currentCompany}
                onChange={handleCompanyChange}
                className="bg-transparent text-xs font-bold text-[#111827] focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Companies (Consolidated)</option>
                <option value="maruti_nandan">Maruti Nandan Denim</option>
                <option value="shri_ram">Shri Ram Cot Fab</option>
                <option value="balaji_polycot">Balaji Polycot</option>
              </select>
            </div>

            <div className="h-6 w-px bg-[#EBEFF2]" />

            {/* Profile pill */}
            <div className="flex items-center gap-2.5">
              <NavLink to="/superadmin/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                {superAdmin?.avatarUrl ? (
                  <img
                    src={superAdmin.avatarUrl}
                    alt={superAdmin?.name || 'Super Admin'}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {superAdmin?.name ? superAdmin.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-bold text-[#111827] block leading-tight">{superAdmin?.name || 'Super Admin'}</span>
                  <span className="text-[10px] text-[#6B7280] block font-medium">Root Super Admin</span>
                </div>
              </NavLink>

              <button
                onClick={handleLogout}
                title="Sign Out Super Admin"
                className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer ml-1"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 py-4 sm:py-6 min-w-0 max-w-full bg-[#F6F8FA]">
          <div className="px-3 sm:px-6 lg:px-8 mx-auto max-w-7xl min-w-0 w-full">
            <Outlet context={{ currentCompany }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
