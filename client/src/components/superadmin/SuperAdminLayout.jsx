import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SidebarCollapseIcon from '../common/SidebarCollapseIcon';
import HeaderSearchBar from '../common/HeaderSearchBar';
import api from '../../services/api';
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
  UserCheck,
  User,
  ChevronRight,
  Bell,
  CheckCheck,
  Loader2
} from 'lucide-react';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const { superAdmin, superAdminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCompany = searchParams.get('companyCode') || 'ALL';

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/superadmin/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching superadmin unread notification count:', err);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get('/superadmin/notifications?limit=6');
      if (res.data?.success) {
        setRecentNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching superadmin recent notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const handleToggleNotifMenu = () => {
    if (!notifMenuOpen) {
      fetchRecentNotifications();
    }
    setNotifMenuOpen(!notifMenuOpen);
    setProfileMenuOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/superadmin/notifications/read-all');
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking superadmin notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/superadmin/notifications/${notif._id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }
    setNotifMenuOpen(false);
    navigate(notif.actionUrl || '/superadmin/notifications');
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
    if (path.includes('/superadmin/notifications')) return 'Platform Notifications Inbox';
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
    { label: 'Notifications', icon: Bell, path: '/superadmin/notifications' },
    { label: 'Reports & Analytics', icon: BarChart3, path: '/superadmin/reports' },
    { label: 'Platform Audit Logs', icon: History, path: '/superadmin/audit-logs' },
    { label: 'System Alerts', icon: AlertTriangle, path: '/superadmin/alerts' },
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
              <div className="p-2 bg-[#111827] text-white rounded-lg shadow-xs shrink-0">
                <Globe size={20} />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <span className="text-xs font-bold text-[#111827] block tracking-wide uppercase">
                    Platform Console
                  </span>
                  <span className="text-[10px] text-[#6B7280] block font-semibold uppercase">
                    Super Administrator
                  </span>
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
                  const targetPath = currentCompany !== 'ALL' ? `${item.path}?companyCode=${currentCompany}` : item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={targetPath}
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

        {/* Bottom Anchored Profile & Logout */}
        <div className="p-3 border-t border-[#EBEFF2] bg-[#FAFCFE]">
          <div className="bg-white border border-[#EBEFF2] rounded-xl overflow-hidden shadow-2xs flex flex-col">
            <NavLink
              to={currentCompany !== 'ALL' ? `/superadmin/profile?companyCode=${currentCompany}` : '/superadmin/profile'}
              title={isCollapsed ? "Profile & Security" : undefined}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2.5'} transition-colors ${
                  isActive ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'
                }`
              }
            >
              {superAdmin?.avatarUrl ? (
                <img
                  src={superAdmin.avatarUrl}
                  alt={superAdmin?.name || 'Super Admin'}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {superAdmin?.name ? superAdmin.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
              )}

              {!isCollapsed && (
                <>
                  <div className="truncate text-left min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#111827] truncate leading-tight">
                      {superAdmin?.name || 'Super Admin'}
                    </div>
                    <div className="text-[10px] font-medium text-[#6B7280] truncate mt-0.5">
                      Root Super Admin
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
                </>
              )}
            </NavLink>

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
                Maruti Denim Group Central Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Dynamic Search Bar */}
            <HeaderSearchBar isSuperAdmin={true} />

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

            {/* Audit Logs Direct Header Icon (Section 7) */}
            <Link
              to="/superadmin/audit-logs"
              aria-label="Platform Audit Logs"
              title="Platform Audit Logs"
              className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F6F8FA] rounded-lg transition-colors cursor-pointer"
            >
              <History size={18} />
            </Link>

            {/* Notification Bell Icon & Dropdown (Section 7) */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={handleToggleNotifMenu}
                aria-label={`Notifications (${unreadCount} unread)`}
                title="Platform Notifications"
                className="relative p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F6F8FA] rounded-lg transition-colors cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-1 rounded-full bg-[#EF4444] text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Compact Notification Dropdown Panel */}
              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#EBEFF2] shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                  <div className="px-4 py-3 border-b border-[#EBEFF2] bg-[#F8FAFC] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111827]">Platform Alerts</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-[#059669] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck size={13} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#EBEFF2]">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#111827]" /> Loading notifications…
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#6B7280]">
                        You're all caught up. No system notifications.
                      </div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-[#F9FAFB] transition-colors cursor-pointer flex gap-3 ${
                            !notif.isRead ? 'bg-[#F0FDF4]/50' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {!notif.isRead ? (
                              <span className="w-2 h-2 rounded-full bg-[#059669] block mt-1.5" />
                            ) : (
                              <Bell size={14} className="text-[#9CA3AF]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-xs font-bold ${!notif.isRead ? 'text-[#111827]' : 'text-[#4B5563]'}`}>
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF] shrink-0 font-mono">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-[#EBEFF2] bg-[#F8FAFC] text-center">
                    <Link
                      to="/superadmin/notifications"
                      onClick={() => setNotifMenuOpen(false)}
                      className="text-xs font-bold text-[#111827] hover:underline"
                    >
                      View all platform alerts →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-[#EBEFF2]" />

            {/* Profile Dropdown Container — Avatar ONLY per Section 7 */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label={`Profile menu — ${superAdmin?.name || 'Super Admin'}, Root Super Admin`}
                title={`${superAdmin?.name || 'Super Admin'} (Root Super Admin)`}
                className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#111827]/20 transition-all cursor-pointer focus:outline-none"
              >
                {superAdmin?.avatarUrl ? (
                  <img
                    src={superAdmin.avatarUrl}
                    alt={superAdmin?.name || 'Super Admin'}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {superAdmin?.name ? superAdmin.name.charAt(0).toUpperCase() : <User size={14} />}
                  </div>
                )}
              </button>

              {/* Popup Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#EBEFF2] shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2.5 border-b border-[#EBEFF2] bg-[#F6F8FA]">
                    <div className="text-xs font-bold text-[#111827] truncate">{superAdmin?.name || 'Super Admin'}</div>
                    <div className="text-[11px] font-medium text-[#6B7280] truncate">{superAdmin?.email || 'superadmin@marutidenim.com'}</div>
                    <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#111827] text-white">
                      Root Super Admin
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/superadmin/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#111827] hover:bg-[#F6F8FA] transition-colors"
                    >
                      <UserCheck size={16} className="text-[#6B7280]" />
                      <span>Profile & Security</span>
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
