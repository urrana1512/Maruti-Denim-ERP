import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const DashboardSection = ({
  title,
  subtitle,
  icon: Icon,
  actionButton,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available for the selected filters.',
  onRetry,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-surface-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm transition-all duration-200 ${className}`}>
      {/* Section Header */}
      {(title || actionButton) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border-subtle/60">
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                {Icon && <Icon size={18} className="text-brand-denim" />}
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actionButton && <div>{actionButton}</div>}
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="animate-pulse space-y-3 py-2">
          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
          <div className="h-24 bg-slate-100 rounded"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="py-6 px-4 text-center rounded-lg bg-red-50/50 border border-red-100">
          <AlertCircle size={24} className="mx-auto text-red-500 mb-2" />
          <p className="text-xs font-semibold text-red-800">Unable to load this section data</p>
          <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors shadow-xs"
            >
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>
      ) : empty ? (
        /* Empty State */
        <div className="py-8 px-4 text-center">
          <p className="text-xs text-slate-500 font-medium italic">{emptyMessage}</p>
        </div>
      ) : (
        /* Actual Content */
        children
      )}
    </div>
  );
};

export default DashboardSection;
