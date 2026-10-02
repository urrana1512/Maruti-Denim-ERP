import React from 'react';
import { History, FileText, ArrowRightLeft, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import DashboardSection from './DashboardSection';

const RecentActivityTimeline = ({ items = [], loading = false, error = null, onRetry }) => {
  const getActionIcon = (actionStr = '') => {
    const act = actionStr.toUpperCase();
    if (act.includes('APPROV')) return <CheckCircle2 size={14} className="text-emerald-600" />;
    if (act.includes('INWARD') || act.includes('RETURN')) return <ArrowRightLeft size={14} className="text-blue-600" />;
    if (act.includes('CANCEL')) return <AlertCircle size={14} className="text-red-600" />;
    if (act.includes('MASTER') || act.includes('ITEM') || act.includes('VENDOR')) return <Database size={14} className="text-purple-600" />;
    return <FileText size={14} className="text-brand-denim" />;
  };

  const safeFormatTimeAgo = (ts) => {
    if (!ts) return 'recently';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return 'recently';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <DashboardSection
      title="Recent Audit & Operational Activity"
      subtitle="Real-time timeline of gate pass lifecycle and system audit events"
      icon={History}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={items.length === 0}
      emptyMessage="No recent activity logged."
      className="h-full"
    >
      <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {items.map((act) => (
          <div key={act._id} className="relative flex items-start gap-3 text-xs group">
            {/* Timeline node icon */}
            <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 group-hover:border-brand-denim transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-navy"></span>
            </div>

            <div className="flex-1 min-w-0 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                  {getActionIcon(act.action)}
                  <span>{act.refNumber}</span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    {act.action}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0" title={act.timestamp ? format(new Date(act.timestamp), 'dd/MM/yyyy, hh:mm a') : ''}>
                  {safeFormatTimeAgo(act.timestamp)}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 truncate">{act.details}</p>

              <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>By: <strong className="text-slate-600">{act.user || 'Admin'}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
};

export default RecentActivityTimeline;
