import React, { useState, useMemo } from 'react';
import { Info, Calendar, FileText, ArrowRight, CheckCircle2, Clock, Package } from 'lucide-react';

const ActivityHeatmapChart = ({
  title = 'Gate Pass Creation & Material Inward Movement Activity',
  data = []
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Last 12 Months');
  const [colorScheme, setColorScheme] = useState('emerald'); // 'emerald' or 'purple'
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  // Dynamic GitHub Contribution Engine
  const { weeks, monthLabels, totalContributions, startDateFormatted, endDateFormatted, defaultActiveCell } = useMemo(() => {
    const today = new Date();
    let endDate = new Date(today);
    let startDate = new Date(today);

    if (selectedPeriod === 'Last 12 Months') {
      endDate = new Date(today);
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 364); // Exactly 52 weeks (364 days)
    } else if (selectedPeriod === '2026') {
      startDate = new Date(2026, 0, 1);
      endDate = today.getFullYear() === 2026 ? new Date(today) : new Date(2026, 11, 31);
    } else if (selectedPeriod === '2025') {
      startDate = new Date(2025, 0, 1);
      endDate = new Date(2025, 11, 31);
    } else if (selectedPeriod === '2024') {
      startDate = new Date(2024, 0, 1);
      endDate = new Date(2024, 11, 31);
    }

    // Align start date to preceding Sunday for GitHub 7-row (Sun-Sat) alignment
    const startSunday = new Date(startDate);
    startSunday.setDate(startSunday.getDate() - startSunday.getDay());

    const generatedWeeks = [];
    const generatedMonthLabels = [];
    let current = new Date(startSunday);
    let totalCount = 0;
    let lastMonth = -1;
    let lastLabelWeek = -6;
    let lastActiveCell = null;

    // Build date lookup map considering ONLY Gate Pass creations & Material Inward receipts
    const dateMap = {};
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const isGatePass = item.gatePassNumber || item.passType || item.type === 'GATE_PASS' || item.type === 'GATE_PASS_CREATED' || item.action === 'CREATE_GATE_PASS' || item.entityType === 'GATE_PASS';
        const isInward = item.inwardNumber || item.partyName || item.type === 'MATERIAL_INWARD' || item.type === 'MATERIAL_INWARD_RECEIPT' || item.action === 'CREATE_MATERIAL_INWARD' || item.entityType === 'MATERIAL_INWARD';

        // Filter out non-movement logs
        if (!isGatePass && !isInward && item.action) {
          const act = String(item.action).toUpperCase();
          if (!act.includes('GATE_PASS') && !act.includes('INWARD') && !act.includes('MATERIAL')) {
            return;
          }
        }

        const itemDateStr = item.date
          ? new Date(item.date).toISOString().split('T')[0]
          : item.createdAt
          ? new Date(item.createdAt).toISOString().split('T')[0]
          : null;
        if (itemDateStr) {
          dateMap[itemDateStr] = (dateMap[itemDateStr] || 0) + (item.count || 1);
        }
      });
    }

    // Build 53 weeks of 7 days
    for (let w = 0; w < 53; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(current);
        const isFuture = currentDate > today;
        const isBeforeStart = currentDate < startDate;
        const isAfterEnd = currentDate > endDate;
        const isOutRange = isBeforeStart || isAfterEnd;

        // Month placement check
        const month = currentDate.getMonth();
        if (month !== lastMonth && d === 0 && w < 52 && !isOutRange) {
          if (w - lastLabelWeek >= 3) {
            generatedMonthLabels.push({
              monthName: currentDate.toLocaleDateString('en-US', { month: 'short' }),
              weekIndex: w
            });
            lastLabelWeek = w;
          }
          lastMonth = month;
        }

        const formattedDate = currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const dateIsoStr = currentDate.toISOString().split('T')[0];

        // Determine daily movement count from database lookup
        let count = 0;
        if (!isFuture && !isOutRange) {
          count = dateMap[dateIsoStr] || 0;
        }

        totalCount += count;

        // Level (0 to 4)
        let level = 0;
        if (count > 12) level = 4;
        else if (count > 7) level = 3;
        else if (count > 3) level = 2;
        else if (count > 0) level = 1;

        const cellData = {
          date: currentDate,
          formattedDate,
          count,
          level,
          isFuture,
          isOutRange,
          key: `${w}-${d}`
        };

        if (count > 0 && !isFuture) {
          lastActiveCell = cellData;
        }

        weekDays.push(cellData);
        current.setDate(current.getDate() + 1);
      }
      generatedWeeks.push(weekDays);
      if (current > endDate && selectedPeriod !== 'Last 12 Months' && w >= 51) break;
    }

    return {
      weeks: generatedWeeks,
      monthLabels: generatedMonthLabels,
      totalContributions: totalCount,
      startDateFormatted: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDateFormatted: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      defaultActiveCell: lastActiveCell
    };
  }, [selectedPeriod, data]);

  // Current active date selection
  const activeCell = selectedCell || defaultActiveCell;

  // Filter real activity records for the selected date from database prop (exclusively Gate Pass & Inwards)
  const selectedDateActivities = useMemo(() => {
    if (!activeCell || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    const dateIsoStr = activeCell.date.toISOString().split('T')[0];

    return data
      .filter((item) => {
        const isGatePass = item.gatePassNumber || item.passType || item.type === 'GATE_PASS' || item.type === 'GATE_PASS_CREATED' || item.action === 'CREATE_GATE_PASS' || item.entityType === 'GATE_PASS';
        const isInward = item.inwardNumber || item.partyName || item.type === 'MATERIAL_INWARD' || item.type === 'MATERIAL_INWARD_RECEIPT' || item.action === 'CREATE_MATERIAL_INWARD' || item.entityType === 'MATERIAL_INWARD';

        if (!isGatePass && !isInward && item.action) {
          const act = String(item.action).toUpperCase();
          if (!act.includes('GATE_PASS') && !act.includes('INWARD') && !act.includes('MATERIAL')) {
            return false;
          }
        }

        const itemDateStr = item.date
          ? new Date(item.date).toISOString().split('T')[0]
          : item.createdAt
          ? new Date(item.createdAt).toISOString().split('T')[0]
          : null;
        return itemDateStr === dateIsoStr;
      })
      .map((item, i) => ({
        id: item.gatePassNumber || item.inwardNumber || item.refNumber || `MOV-${i + 1}`,
        vendor: item.companyName || item.partyName || item.vendorName || item.userName || 'Company Staff',
        passType: item.inwardNumber ? 'Material Inward Receipt' : (item.passType || 'Gate Pass Created'),
        status: item.status || item.returnStatus || 'COMPLETED',
        timeStr: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        itemDesc: item.itemDescription || item.itemsSummary || item.details || (item.inwardNumber ? 'Material Inward Receipt' : 'Gate Pass Creation')
      }));
  }, [activeCell, data]);

  // GitHub Color Scale
  const getCellColor = (level, isFuture, isOutRange) => {
    if (isFuture || isOutRange) {
      return 'bg-[#F6F8FA] border-[#EBEFF2] opacity-40';
    }

    if (colorScheme === 'emerald') {
      switch (level) {
        case 4: return 'bg-[#216E39] border-[#1B5E2B]';
        case 3: return 'bg-[#30A14E] border-[#278A41]';
        case 2: return 'bg-[#40C463] border-[#34A853]';
        case 1: return 'bg-[#9BE9A8] border-[#82D991]';
        default: return 'bg-[#EBEDF0] border-[#E1E4E8]';
      }
    } else {
      switch (level) {
        case 4: return 'bg-[#5B21B6] border-[#4C1D95]';
        case 3: return 'bg-[#7C3AED] border-[#6D28D9]';
        case 2: return 'bg-[#A78BFA] border-[#8B5CF6]';
        case 1: return 'bg-[#DDD6FE] border-[#C4B5FD]';
        default: return 'bg-[#F3F4F6] border-[#E5E7EB]';
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left GitHub Heatmap Graph (~65% width) */}
      <div className="lg:col-span-8 glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-[#111827]">{title}</h3>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              <strong className="text-[#111827] font-bold">{totalContributions.toLocaleString('en-IN')}</strong> Gate Pass movements ({startDateFormatted} – {endDateFormatted})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Selector */}
            <div className="flex items-center bg-[#F6F8FA] border border-[#EBEFF2] rounded-lg p-0.5">
              <button
                onClick={() => setColorScheme('emerald')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  colorScheme === 'emerald' ? 'bg-[#216E39] text-white shadow-2xs' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Emerald
              </button>
              <button
                onClick={() => setColorScheme('purple')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  colorScheme === 'purple' ? 'bg-[#7C3AED] text-white shadow-2xs' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Purple
              </button>
            </div>

            {/* Period Filter Dropdown */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs font-bold text-[#111827] bg-[#F6F8FA] border border-[#EBEFF2] rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="Last 12 Months">Last 12 Months</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        {/* GitHub Contribution Heatmap Grid */}
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="inline-block min-w-full">
            <div className="flex items-start gap-2">
              {/* Day Labels Axis: Mon (1), Wed (3), Fri (5) */}
              <div className="w-7 shrink-0 text-[10px] font-semibold text-[#9CA3AF] flex flex-col justify-between h-[106px] pt-5 pr-1">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* Right Matrix Container with 1-to-1 Aligned Month Header */}
              <div className="shrink-0">
                {/* Month Labels Header */}
                <div className="flex gap-[3.5px] h-5 mb-1">
                  {weeks.map((_, wIdx) => {
                    const monthLabel = monthLabels.find((m) => m.weekIndex === wIdx);
                    return (
                      <div key={wIdx} className="w-[11px] h-4 relative">
                        {monthLabel && (
                          <span className="absolute left-0 top-0 text-[11px] font-bold text-[#111827] whitespace-nowrap pointer-events-none">
                            {monthLabel.monthName}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 52-53 Weeks Matrix */}
                <div className="flex gap-[3.5px]">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-[3.5px]">
                      {week.map((cell, dIdx) => {
                        const isSelected = activeCell?.formattedDate === cell.formattedDate;
                        return (
                          <div
                            key={dIdx}
                            onClick={() => !cell.isFuture && !cell.isOutRange && setSelectedCell(cell)}
                            onMouseEnter={() => setHoveredCell(cell)}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`w-[11px] h-[11px] rounded-[2.5px] border transition-all cursor-pointer ${getCellColor(
                              cell.level,
                              cell.isFuture,
                              cell.isOutRange
                            )} ${isSelected ? 'ring-2 ring-[#111827] ring-offset-1 scale-125 z-10' : 'hover:scale-125'}`}
                            title={`${cell.count} Gate Passes on ${cell.formattedDate}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#EBEFF2] pt-3 text-xs">
          {/* Dynamic Tooltip */}
          <div className="text-[#111827] font-medium min-h-[20px]">
            {hoveredCell ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] inline-block"
                  style={{ backgroundColor: getCellColor(hoveredCell.level, hoveredCell.isFuture, hoveredCell.isOutRange).split(' ')[0].replace('bg-[', '').replace(']', '') }}
                />
                <strong className="font-bold">{hoveredCell.count} Gate Passes</strong> on {hoveredCell.formattedDate} (Click to inspect)
              </span>
            ) : (
              <span className="text-[#9CA3AF] flex items-center gap-1">
                <Info size={13} /> Click any contribution block to inspect daily operations on the right panel
              </span>
            )}
          </div>

          {/* GitHub Legend: Less ▫️▫️▫️▫️ More */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] font-medium shrink-0">
            <span>Less</span>
            <span className={`w-3 h-3 rounded-[2px] border ${getCellColor(0, false, false)}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${getCellColor(1, false, false)}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${getCellColor(2, false, false)}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${getCellColor(3, false, false)}`} />
            <span className={`w-3 h-3 rounded-[2px] border ${getCellColor(4, false, false)}`} />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Right-Side Selected Date Activity Detail Panel (~35% width) */}
      <div className="lg:col-span-4 glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#EBEFF2] mb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
                <Calendar size={14} className="text-[#7C3AED]" />
                <span>{activeCell ? activeCell.formattedDate : 'Select a Date'}</span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Daily Gate Pass & Material Operations
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#111827]">
              {activeCell ? activeCell.count : 0} Activity Logs
            </span>
          </div>

          {/* Selected Date Activity List */}
          {selectedDateActivities.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {selectedDateActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl hover:border-[#D1D5DB] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827]">{act.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#10B981]">
                      {act.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-[#111827] mt-1.5 truncate">
                    {act.itemDesc}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#EBEFF2] text-[10px] text-[#6B7280]">
                    <span className="truncate max-w-[160px]">Party: <strong>{act.vendor}</strong></span>
                    <span className="font-semibold text-[#111827]">{act.timeStr}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#9CA3AF] space-y-2">
              <Package size={28} className="mx-auto text-[#D1D5DB]" />
              <p className="font-semibold text-[#111827]">No activity logged for this date</p>
              <p className="text-[11px] text-[#6B7280]">
                Click on any colored contribution block in the GitHub graph to view that day's passes.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-[#EBEFF2] text-[11px] text-[#6B7280] flex items-center justify-between">
          <span>Click any block to inspect details</span>
          <span className="font-semibold text-[#111827]">Live Sync</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmapChart;
