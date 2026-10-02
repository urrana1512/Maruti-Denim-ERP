import React from 'react';
import { Layers } from 'lucide-react';
import DashboardSection from './DashboardSection';

const ItemAnalytics = ({ data = [], loading = false, error = null, onRetry }) => {
  return (
    <DashboardSection
      title="Most Moved Materials & Items"
      subtitle="Frequently transferred items across active gate pass records"
      icon={Layers}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={data.length === 0}
      emptyMessage="No item movement analytics available."
      className="h-full"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-border-subtle">
              <th className="py-2 px-2.5">Item Description</th>
              <th className="py-2 px-2.5">Category</th>
              <th className="py-2 px-2.5 text-right">Passes</th>
              <th className="py-2 px-2.5 text-right">Issued</th>
              <th className="py-2 px-2.5 text-right">Returned</th>
              <th className="py-2 px-2.5 text-right">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-2.5 font-bold text-slate-800 max-w-[180px] truncate">{item.description}</td>
                <td className="py-2 px-2.5 text-slate-500">{item.category}</td>
                <td className="py-2 px-2.5 text-right font-semibold text-brand-navy">{item.movementCount}</td>
                <td className="py-2 px-2.5 text-right font-medium">{item.totalIssuedQty}</td>
                <td className="py-2 px-2.5 text-right font-semibold text-emerald-700">{item.totalReturnedQty}</td>
                <td className="py-2 px-2.5 text-right font-bold text-amber-700">{item.totalPendingQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardSection>
  );
};

export default ItemAnalytics;
