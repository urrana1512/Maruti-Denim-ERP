import React from 'react';
import { Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DashboardSection from './DashboardSection';

const VendorAnalytics = ({ data = [], loading = false, error = null, onRetry }) => {
  return (
    <DashboardSection
      title="Top Vendors by Movement Volume"
      subtitle="Ranking based on total gate passes issued and material volume"
      icon={Building2}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={data.length === 0}
      emptyMessage="No vendor activity data available."
      className="h-full"
    >
      <div className="space-y-3">
        {data.map((vendor, idx) => (
          <div key={vendor.vendorName} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate max-w-[180px] sm:max-w-xs">{vendor.vendorName}</span>
              </span>
              <span className="font-bold text-brand-denim shrink-0">
                {vendor.gatePassCount} Gate Passes
              </span>
            </div>

            {/* Visual volume bar */}
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500 block">Issued Qty</span>
                <strong className="text-slate-800 font-bold">{vendor.totalQuantity}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Returned Qty</span>
                <strong className="text-emerald-700 font-bold">{vendor.returnedQuantity}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Pending Qty</span>
                <strong className="text-amber-700 font-bold">{vendor.pendingQuantity}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
};

export default VendorAnalytics;
