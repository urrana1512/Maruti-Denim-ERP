import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Printer, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import DashboardSection from './DashboardSection';

const RecentGatePasses = ({ items = [], loading = false, error = null, onRetry }) => {
  const navigate = useNavigate();

  const safeFormatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return format(d, 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const renderApprovalBadge = (status) => {
    if (status === 'Approved') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Approved ✓
        </span>
      );
    }
    if (status === 'Cancelled') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
          Cancelled ✗
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
        Pending
      </span>
    );
  };

  return (
    <DashboardSection
      title="Recent Gate Passes"
      subtitle="Latest gate passes generated in the system"
      icon={FileText}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={items.length === 0}
      emptyMessage="No gate passes recorded yet."
      actionButton={
        items.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/gate-pass/manage')}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-denim hover:text-brand-navy transition-colors"
          >
            <span>Manage All</span>
            <ExternalLink size={13} />
          </button>
        )
      }
      className="mb-6"
    >
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-xs text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-border-subtle">
              <th className="py-2.5 px-3">Gate Pass No.</th>
              <th className="py-2.5 px-3 text-center">Date</th>
              <th className="py-2.5 px-3">Party / Company</th>
              <th className="py-2.5 px-3">Items</th>
              <th className="py-2.5 px-3 text-center">Type</th>
              <th className="py-2.5 px-3 text-center">Approval</th>
              <th className="py-2.5 px-3 text-center">GP Status</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {items.map((gp) => (
              <tr key={gp._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 font-bold text-brand-navy">{gp.gatePassNumber}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{safeFormatDate(gp.date)}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[160px] truncate">{gp.companyName}</td>
                <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">{gp.itemsSummary}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    gp.passType === 'Returnable' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {gp.passType}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">{renderApprovalBadge(gp.approvalStatus)}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    gp.gatePassStatus === 'CLOSED' ? 'bg-emerald-50 text-emerald-700' :
                    gp.gatePassStatus === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {gp.gatePassStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate('/gate-pass/manage')}
                      className="p-1 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded transition-colors"
                      title="View Gate Pass"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/documents/gate-pass/${gp._id}/print`, '_blank')}
                      className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                      title="Print PDF"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardSection>
  );
};

export default RecentGatePasses;
