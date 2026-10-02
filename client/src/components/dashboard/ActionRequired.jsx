import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import DashboardSection from './DashboardSection';

const ActionRequired = ({ items = [], loading = false, error = null, onRetry }) => {
  const navigate = useNavigate();

  return (
    <DashboardSection
      title="Action Required"
      subtitle="Operational items awaiting immediate approval or return action"
      icon={AlertCircle}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={items.length === 0}
      emptyMessage="All caught up — no urgent action required."
      className="mb-6 border-l-4 border-l-amber-500"
    >
      {items.length === 0 ? (
        <div className="py-6 text-center">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-xs font-bold text-slate-700">All caught up!</p>
          <p className="text-xs text-slate-500 mt-0.5">No pending approvals or overdue material returns.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const isCritical = item.priority === 'CRITICAL';
            const isPendingApproval = item.category === 'PENDING_APPROVAL';

            return (
              <div
                key={item._id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all duration-150 gap-3 ${
                  isCritical
                    ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
                    : isPendingApproval
                    ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-md shrink-0 ${
                      isCritical
                        ? 'bg-red-100 text-red-700'
                        : isPendingApproval
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isPendingApproval ? <Clock size={16} /> : <AlertCircle size={16} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-brand-navy">{item.refNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                      {item.partyName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(item.targetUrl || '/gate-pass/manage')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors shadow-2xs ${
                      isPendingApproval
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <span>{isPendingApproval ? 'Approve Gate Pass' : 'Process Inward'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardSection>
  );
};

export default ActionRequired;
