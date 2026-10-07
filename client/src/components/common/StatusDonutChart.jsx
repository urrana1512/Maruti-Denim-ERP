import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StatusDonutChart = ({
  title = 'Gate Pass Status',
  totalCount = 0,
  segments = [],
  onViewAll
}) => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const computedTotal = segments.reduce((acc, s) => acc + (s.count || 0), 0);
  const total = computedTotal > 0 ? computedTotal : (totalCount || 0);

  // Calculate SVG stroke DashOffset values for smooth Donut Chart
  let cumulative = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/gate-pass/manage');
    }
  };

  return (
    <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="text-xs font-semibold text-[#111827] bg-[#F6F8FA] border border-[#EBEFF2] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value="This Month">This Month</option>
          <option value="This Quarter">This Quarter</option>
          <option value="All Time">All Time</option>
        </select>
      </div>

      {/* Center Donut SVG */}
      <div className="flex justify-center items-center relative my-2">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-[#F3F4F6]"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Segments */}
            {total > 0 && segments.map((segment, index) => {
              const segCount = segment.count || 0;
              if (segCount === 0) return null;
              const strokeDasharray = `${(segCount / total) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulative;
              cumulative += (segCount / total) * circumference;

              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={segment.color || '#64748B'}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 hover:opacity-90 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-[#6B7280]">Total</span>
            <span className="text-3xl font-extrabold text-[#111827] tracking-tight">{total}</span>
          </div>
        </div>
      </div>

      {/* Legend & Stats Grid */}
      <div className="grid grid-cols-2 gap-3 my-4 bg-[#F6F8FA] p-3 rounded-lg border border-[#EBEFF2]">
        {segments.length === 0 ? (
          <div className="col-span-2 text-center text-xs text-[#9CA3AF] py-2">
            No gate pass status metrics recorded.
          </div>
        ) : (
          segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color || '#64748B' }}
              />
              <div className="truncate">
                <div className="text-[11px] font-medium text-[#6B7280] truncate">{seg.label}</div>
                <div className="text-sm font-bold text-[#111827]">{seg.count || 0}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Primary Near-Black "View all" Button */}
      <button
        onClick={handleViewAll}
        className="w-full bg-[#111827] hover:bg-[#1F2937] text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-center"
      >
        View all
      </button>
    </div>
  );
};

export default StatusDonutChart;
