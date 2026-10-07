import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, LogOut, Shield, User, UserCheck, History, CheckCheck, Loader2, FileText, PackageCheck, AlertCircle } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SidebarCollapseIcon from '../common/SidebarCollapseIcon';
import HeaderSearchBar from '../common/HeaderSearchBar';
import api from '../../services/api';

const Header = ({ setIsOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isSuperAdmin, selectedCompany } = useAuth();
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count & recent notifications
  const fetchUnreadCount = async () => {
    try {
      const endpoint = isSuperAdmin ? '/superadmin/notifications/unread-count' : '/notifications/unread-count';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const endpoint = isSuperAdmin ? '/superadmin/notifications?limit=6' : '/notifications?limit=6';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setRecentNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread count every 60 seconds safely
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  const handleToggleNotifMenu = () => {
    if (!notifMenuOpen) {
      fetchRecentNotifications();
    }
    setNotifMenuOpen(!notifMenuOpen);
    setProfileMenuOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      const endpoint = isSuperAdmin ? '/superadmin/notifications/read-all' : '/notifications/read-all';
      await api.patch(endpoint);
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const endpoint = isSuperAdmin ? `/superadmin/notifications/${notif._id}/read` : `/notifications/${notif._id}/read`;
        await api.patch(endpoint);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }
    setNotifMenuOpen(false);
    const targetUrl = notif.actionUrl || (isSuperAdmin ? '/superadmin/notifications' : '/notifications');
    navigate(targetUrl);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard Overview';
    if (path.includes('/gate-pass/add')) return 'Create Gate Pass';
    if (path.includes('/gate-pass/manage')) return 'Manage Gate Passes';
    if (path.includes('/material-inward')) return 'Material Inward';
    if (path.includes('/reports')) return 'Reports & MIS Analytics';
    if (path.includes('/master-data/items')) return 'Item Master Management';
    if (path.includes('/master-data/vendors')) return 'Vendor Master Management';
    if (path.includes('/notifications')) return 'Notifications Inbox';
    if (path.includes('/my-activity')) return 'My Activity History';
    if (path.includes('/admin/audit-logs')) return 'Company Audit Logs';
    return 'Dashboard Overview';
  };

  // Determine Audit page route and tooltip label based on role
  const getAuditConfig = () => {
    if (isSuperAdmin) {
      return { path: '/superadmin/audit-logs', label: 'Platform Audit Logs' };
    }
    if (isAdmin) {
      return { path: '/admin/audit-logs', label: 'Audit Logs' };
    }
    return { path: '/my-activity', label: 'My Activity' };
  };

  const auditConfig = getAuditConfig();
  const notificationsPath = isSuperAdmin ? '/superadmin/notifications' : '/notifications';

  return (
    <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 items-center justify-between border-b border-[#EBEFF2] bg-white px-4 sm:px-6 lg:px-8 shadow-2xs">
      {/* Left Title & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="-m-2 p-2 text-[#6B7280] hover:text-[#111827] md:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {setIsCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F6F8FA] rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <SidebarCollapseIcon collapsed={isCollapsed} size={20} />
          </button>
        )}

        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#111827] leading-tight">
            {getPageTitle()}
          </h2>
          {selectedCompany && (
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {selectedCompany.name}
            </span>
          )}
        </div>
      </div>

      {/* Right Header Controls Cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Dynamic Search Bar */}
        <HeaderSearchBar isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />

        {/* Audit / Activity Icon (Section 7) */}
        <Link
          to={auditConfig.path}
          aria-label={auditConfig.label}
          title={auditConfig.label}
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
            title="Notifications"
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
                  <span className="text-xs font-bold text-[#111827]">Notifications</span>
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

              {/* Notification List Body */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#EBEFF2]">
                {loadingNotifs ? (
                  <div className="p-6 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#111827]" /> Loading notifications…
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6B7280]">
                    You're all caught up. No new notifications.
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

              {/* Footer View All Link */}
              <div className="p-2.5 border-t border-[#EBEFF2] bg-[#F8FAFC] text-center">
                <Link
                  to={notificationsPath}
                  onClick={() => setNotifMenuOpen(false)}
                  className="text-xs font-bold text-[#111827] hover:underline"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {isAdmin && !isSuperAdmin && (
          <Link
            to="/admin/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Shield size={14} /> Admin Panel
          </Link>
        )}

        <div className="h-6 w-px bg-[#EBEFF2]" />

        {/* Profile Dropdown Container — Avatar ONLY per Section 7 */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-label={`Profile menu — ${user?.name || 'User'}, ${user?.roleName || user?.role || 'Employee'}`}
            title={`${user?.name || 'User'} (${user?.roleName || user?.role || 'Employee'})`}
            className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#111827]/20 transition-all cursor-pointer focus:outline-none"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
            )}
          </button>

          {/* Popup Profile Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-[#EBEFF2] shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2.5 border-b border-[#EBEFF2] bg-[#F6F8FA]">
                <div className="text-xs font-bold text-[#111827] truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] font-medium text-[#6B7280] truncate">{user?.email || user?.phone || ''}</div>
                <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#111827]/10 text-[#111827]">
                  {user?.roleName || user?.department || 'Employee'}
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
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
  );
};

export default Header;
