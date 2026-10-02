import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardSection from './DashboardSection';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 z-50">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></span>
          <span>{data.name}</span>
        </div>
        <p className="text-slate-300">
          Count: <strong className="text-white">{data.value}</strong> ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const GatePassStatusChart = ({ data = [], loading = false, error = null, onRetry }) => {
  const navigate = useNavigate();

  const handlePieClick = (entry) => {
    if (entry && entry.name) {
      let statusQuery = '';
      if (entry.name === 'Approved') statusQuery = 'Approved';
      else if (entry.name === 'Pending Approval') statusQuery = 'Pending';
      else if (entry.name === 'Cancelled') statusQuery = 'Cancelled';
      navigate(`/gate-pass/manage?status=${statusQuery}`);
    }
  };

  return (
    <DashboardSection
      title="Gate Pass Status Distribution"
      subtitle="Breakdown of active, approved, pending, and closed gate passes"
      icon={PieIcon}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={data.length === 0}
      emptyMessage="No gate passes matching current criteria."
      className="h-full"
    >
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              onClick={handlePieClick}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value, entry) => (
                <span className="text-xs font-semibold text-slate-700 ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </DashboardSection>
  );
};

export default GatePassStatusChart;
