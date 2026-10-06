import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StatusDonutChart = ({
  title = 'Gate Pass Status',
  totalCount = 424,
  segments = [
    { label: 'Pending / Open', count: 258, color: '#7C3AED', leftText: '456 Left' }, // Purple
    { label: 'Approved', count: 89, color: '#0EA5E9', leftText: '258 Left' },    // Cyan
    { label: 'In Progress', count: 43, color: '#F59E0B', leftText: '258 Left' },   // Amber
    { label: 'Closed / Completed', count: 34, color: '#10B981', leftText: '258 Left' } // Emerald
  ],
  onViewAll
}) => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const total = segments.reduce((acc, s) => acc + s.count, 0) || totalCount || 1;

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
            {segments.map((segment, index) => {
              const strokeDasharray = `${(segment.count / total) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulative;
              cumulative += (segment.count / total) * circumference;

              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={segment.color}
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
            <span className="text-3xl font-extrabold text-[#111827] tracking-tight">{totalCount || total}</span>
          </div>
        </div>
      </div>

      {/* Legend & Stats Grid - Mirrored from Screenshot */}
      <div className="grid grid-cols-2 gap-3 my-4 bg-[#F6F8FA] p-3 rounded-lg border border-[#EBEFF2]">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <div className="truncate">
              <div className="text-[11px] font-medium text-[#6B7280] truncate">{seg.label}</div>
              <div className="text-sm font-bold text-[#111827]">{seg.count}</div>
            </div>
          </div>
        ))}
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
