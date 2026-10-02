import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Printer, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import DashboardSection from './DashboardSection';

const RecentMaterialInward = ({ items = [], loading = false, error = null, onRetry }) => {
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

  const formatINR = (val) => {
    const n = Number(val) || 0;
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <DashboardSection
      title="Recent Material Inwards"
      subtitle="Latest material inward receipts recorded against returnable gate passes"
      icon={ArrowRightLeft}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={items.length === 0}
      emptyMessage="No material inwards recorded yet."
      actionButton={
        items.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/material-inward')}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-denim hover:text-brand-navy transition-colors"
          >
            <span>Inward Module</span>
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
              <th className="py-2.5 px-3">Inward No. (MIR)</th>
              <th className="py-2.5 px-3">Gate Pass No.</th>
              <th className="py-2.5 px-3 text-center">Inward Date</th>
              <th className="py-2.5 px-3">Party Name</th>
              <th className="py-2.5 px-3">Items Summary</th>
              <th className="py-2.5 px-3 text-right">Rec. Qty</th>
              <th className="py-2.5 px-3 text-right">Grand Total</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {items.map((mi) => (
              <tr key={mi._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 font-bold text-brand-navy">{mi.inwardNumber}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-700">{mi.gatePassNumber}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{safeFormatDate(mi.inwardDate)}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[160px] truncate">{mi.partyName}</td>
                <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate">{mi.itemsSummary}</td>
                <td className="py-2.5 px-3 text-right font-bold text-blue-700">{mi.receivedQuantity}</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatINR(mi.grandTotal)}</td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate('/material-inward')}
                      className="p-1 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded transition-colors"
                      title="View Material Inward"
                    >
                      <ArrowRightLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/documents/material-inward/${mi._id}/print`, '_blank')}
                      className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                      title="Print Inward PDF"
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

export default RecentMaterialInward;
