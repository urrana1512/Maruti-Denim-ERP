import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  ShieldAlert,
  FileText,
  PackageCheck,
  User,
  Shield,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NotificationsPage = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const isReadParam = activeTab === 'UNREAD' ? 'false' : undefined;

      const endpoint = isSuperAdmin ? '/superadmin/notifications' : '/notifications';
      const response = await api.get(endpoint, {
        params: {
          page,
          limit,
          isRead: isReadParam,
          category: category || undefined,
          priority: priority || undefined,
          search: searchTerm || undefined
        }
      });

      if (response.data?.success) {
        setNotifications(response.data.data || []);
        setTotalCount(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.pages || 1);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, page, limit, activeTab, category, priority, searchTerm]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const endpoint = isSuperAdmin ? `/superadmin/notifications/${id}/read` : `/notifications/${id}/read`;
      await api.patch(endpoint);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const endpoint = isSuperAdmin ? '/superadmin/notifications/read-all' : '/notifications/read-all';
      await api.patch(endpoint);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const endpoint = isSuperAdmin ? `/superadmin/notifications/${id}` : `/notifications/${id}`;
      await api.delete(endpoint);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
      setTotalCount((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleActionClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">CRITICAL</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#D97706]">HIGH</span>;
      case 'Low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3F4F6] text-[#6B7280]">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">NORMAL</span>;
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Gate Pass':
        return <FileText size={16} className="text-[#2563EB]" />;
      case 'Inward':
      case 'Returnable':
        return <PackageCheck size={16} className="text-[#059669]" />;
      case 'Security':
        return <ShieldAlert size={16} className="text-[#DC2626]" />;
      case 'User Management':
      case 'Account':
        return <User size={16} className="text-[#7C3AED]" />;
      default:
        return <Bell size={16} className="text-[#6B7280]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EBEFF2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-[#111827]">
              {isSuperAdmin ? 'Platform Alerts & Notifications' : 'Notifications'}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EF4444]/10 text-[#EF4444]">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Stay informed about system events, approval requests, and gate pass status updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <CheckCheck size={15} /> Mark all as read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F6F8FA] rounded-xl border border-[#EBEFF2] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBEFF2] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 bg-[#F6F8FA] p-1 rounded-xl border border-[#EBEFF2]">
            <button
              onClick={() => { setActiveTab('ALL'); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ALL' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              All Notifications ({totalCount})
            </button>
            <button
              onClick={() => { setActiveTab('UNREAD'); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'UNREAD' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search notifications…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-[#F6F8FA] border border-[#EBEFF2] text-xs text-[#111827] placeholder-[#9CA3AF] rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#111827] transition-all"
            />
          </div>

          {/* Select Category & Priority Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-[#F6F8FA] border border-[#EBEFF2] text-xs font-semibold text-[#111827] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Gate Pass">Gate Pass</option>
              <option value="Returnable">Returnable</option>
              <option value="Inward">Inward</option>
              <option value="Account">Account</option>
              <option value="Security">Security</option>
              <option value="System">System</option>
            </select>

            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="bg-[#F6F8FA] border border-[#EBEFF2] text-xs font-semibold text-[#111827] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List Body */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EBEFF2] p-12 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#111827] mx-auto" />
          <p className="text-xs text-[#6B7280]">Loading notifications list…</p>
        </div>
      ) : error ? (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-[#DC2626] mx-auto" />
          <p className="text-xs font-semibold text-[#DC2626]">{error}</p>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-xl hover:bg-[#B91C1C] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EBEFF2] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F6F8FA] text-[#9CA3AF] flex items-center justify-center mx-auto">
            <Bell size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#111827]">You're all caught up. No new notifications.</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            There are currently no active notifications matching your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`bg-white rounded-2xl border ${
                !notif.isRead ? 'border-[#059669]/30 bg-[#F0FDF4]/30 shadow-xs' : 'border-[#EBEFF2]'
              } p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-[#F6F8FA] border border-[#EBEFF2] shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#059669] shrink-0" />
                    )}
                    <h4 className={`text-xs sm:text-sm font-bold ${!notif.isRead ? 'text-[#111827]' : 'text-[#374151]'}`}>
                      {notif.title}
                    </h4>
                    {getPriorityBadge(notif.priority)}
                    {notif.category && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3F4F6] text-[#4B5563]">
                        {notif.category}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#6B7280] leading-relaxed break-words">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF] pt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }) : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {notif.actionUrl && (
                  <button
                    onClick={() => handleActionClick(notif)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    View <ExternalLink size={13} />
                  </button>
                )}

                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="p-2 text-[#6B7280] hover:text-[#059669] hover:bg-[#ECFDF5] rounded-xl transition-colors cursor-pointer"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(notif._id)}
                  className="p-2 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl transition-colors cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-[#EBEFF2] text-xs font-medium text-[#6B7280]">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-[#EBEFF2] hover:bg-[#F6F8FA] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-[#EBEFF2] hover:bg-[#F6F8FA] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
