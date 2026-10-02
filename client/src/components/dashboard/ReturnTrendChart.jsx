import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardSection from './DashboardSection';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
              {p.name}:
            </span>
            <strong className="text-white">{p.value.toLocaleString('en-IN')}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ReturnTrendChart = ({ data = [], loading = false, error = null, onRetry }) => {
  return (
    <DashboardSection
      title="Material Return Inward Trend"
      subtitle="Daily returned material quantity and inward receipt frequency"
      icon={ArrowRightLeft}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={data.length === 0}
      emptyMessage="No inward receipts in selected time range."
      className="h-full"
    >
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" height={30} iconType="circle" iconSize={8} />
            <Line type="monotone" dataKey="returnedQuantity" name="Returned Qty" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="receiptsCount" name="Inward Receipts" stroke="#0284C7" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardSection>
  );
};

export default ReturnTrendChart;
