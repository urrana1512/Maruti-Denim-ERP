import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardSection from './DashboardSection';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 z-50 min-w-[140px]">
        <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
              {p.name}:
            </span>
            <strong className="text-white">{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const GatePassTrendChart = ({ data = [], loading = false, error = null, onRetry }) => {
  return (
    <DashboardSection
      title="Gate Pass Activity Trend"
      subtitle="Volume of gate passes created, approved, and closed over time"
      icon={TrendingUp}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={data.length === 0}
      emptyMessage="No activity records for the selected date range."
      className="h-full"
    >
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" height={30} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="created" name="Created" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
            <Area type="monotone" dataKey="approved" name="Approved" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorApproved)" />
            <Area type="monotone" dataKey="closed" name="Closed" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorClosed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardSection>
  );
};

export default GatePassTrendChart;
