import React, { useState, useEffect } from 'react';
import { RefreshCw, Bell, Printer, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DashboardHeader = ({
  lastUpdated,
  onRefresh,
  isRefreshing,
  actionRequiredCount = 0
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeAgoStr, setTimeAgoStr] = useState('just now');

  useEffect(() => {
    if (!lastUpdated) return;
    const updateTimeAgo = () => {
      try {
        setTimeAgoStr(formatDistanceToNow(lastUpdated, { addSuffix: true }));
      } catch {
        setTimeAgoStr('recently');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle mb-6">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> Live Ops
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Overview of today's Gate Pass and material movement activity
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Last Updated Timestamp */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/70 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <Clock size={13} className="text-slate-400" />
          <span>Last updated: <strong className="text-slate-700 font-medium">{timeAgoStr}</strong></span>
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 bg-white border border-border-subtle rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Notifications & Alerts"
          >
            <Bell size={18} />
            {actionRequiredCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {actionRequiredCount > 9 ? '9+' : actionRequiredCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-border-subtle rounded-xl shadow-xl z-50 p-3 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span className="text-xs font-bold text-slate-800">Operational Alerts</span>
                <span className="text-[10px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                  {actionRequiredCount} Actionable
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 py-1 text-xs">
                {actionRequiredCount > 0 ? (
                  <p className="text-slate-600 text-[11px]">
                    You have <strong className="text-red-600">{actionRequiredCount} item(s)</strong> requiring attention in the Action Required section below.
                  </p>
                ) : (
                  <p className="text-slate-500 text-[11px] italic text-center py-3">
                    No pending operational alerts.
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full text-center text-[11px] font-semibold text-brand-denim hover:underline pt-1"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-border-subtle rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-60"
        >
          <RefreshCw size={14} className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        {/* Print / Export Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-navy bg-brand-navy/5 border border-brand-navy/20 rounded-lg hover:bg-brand-navy/10 transition-colors shadow-xs"
        >
          <Printer size={14} />
          <span className="hidden sm:inline">Print / Export</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
