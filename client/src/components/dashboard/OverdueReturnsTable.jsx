import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import DashboardSection from './DashboardSection';

const OverdueReturnsTable = ({ items = [], loading = false, error = null, onRetry }) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/reports?tab=pending-returns');
  };

  return (
    <DashboardSection
      title="Overdue Material Returns"
      subtitle="Returnable gate passes exceeding the 14-day standard return window"
      icon={AlertTriangle}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={items.length === 0}
      emptyMessage="No overdue returnable materials found."
      actionButton={
        items.length > 0 && (
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-denim hover:text-brand-navy transition-colors"
          >
            <span>View All Overdue</span>
            <ExternalLink size={13} />
          </button>
        )
      }
      className="mb-6"
    >
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-border-subtle">
              <th className="py-2.5 px-3">Gate Pass No.</th>
              <th className="py-2.5 px-3">Party / Vendor</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-right">Issued</th>
              <th className="py-2.5 px-3 text-right">Returned</th>
              <th className="py-2.5 px-3 text-right">Pending</th>
              <th className="py-2.5 px-3 text-center">Days Overdue</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {items.map((row) => {
              const isHighRisk = row.daysOverdue > 14;
              return (
                <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-brand-navy">{row.gatePassNumber}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{row.vendorName}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{row.itemDescription}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{row.issuedQuantity}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-700">{row.returnedQuantity}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-red-600">{row.pendingQuantity}</td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${
                        isHighRisk ? 'bg-red-100 text-red-800 font-extrabold' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.daysOverdue} Days
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      {row.returnStatus === 'PARTIALLY_RETURNED' ? 'Partial' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/material-inward')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      <span>Inward</span>
                      <ArrowRight size={11} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardSection>
  );
};

export default OverdueReturnsTable;
