import React from 'react';
import { PackageCheck, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardSection from './DashboardSection';

const MaterialReturnOverview = ({ data = {}, loading = false, error = null, onRetry }) => {
  const {
    totalIssued = 0,
    totalReturned = 0,
    totalPending = 0,
    totalOverdue = 0,
    returnPercentage = 0,
    chartData = []
  } = data;

  return (
    <DashboardSection
      title="Material Return Overview"
      subtitle="Reconciliation of returnable material issued vs received via Material Inward"
      icon={PackageCheck}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={totalIssued === 0}
      emptyMessage="No returnable material data for this selection."
      className="mb-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Summary Stat Badges */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overall Return Rate</span>
              <span className="text-xs font-bold text-emerald-700">{returnPercentage}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, returnPercentage))}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <span className="text-[11px] font-semibold text-blue-700 block">Total Issued</span>
              <span className="text-lg font-bold text-blue-900">{totalIssued.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="text-[11px] font-semibold text-emerald-700 block">Total Returned</span>
              <span className="text-lg font-bold text-emerald-900">{totalReturned.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
              <span className="text-[11px] font-semibold text-amber-700 block">Pending Return</span>
              <span className="text-lg font-bold text-amber-900">{totalPending.toLocaleString('en-IN')}</span>
            </div>

            <div className={`p-3 rounded-lg border ${totalOverdue > 0 ? 'bg-red-50/80 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-semibold block ${totalOverdue > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                Overdue Material
              </span>
              <span className={`text-lg font-bold ${totalOverdue > 0 ? 'text-red-900' : 'text-slate-800'}`}>
                {totalOverdue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Grouped Bar Chart */}
        <div className="lg:col-span-7 h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" height={30} iconType="circle" iconSize={8} />
              <Bar dataKey="Issued" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Returned" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Overdue" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardSection>
  );
};

export default MaterialReturnOverview;
