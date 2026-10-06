import React from 'react';
import { Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PendingReturnsCard = ({ items = [], onViewAll }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (onViewAll) onViewAll();
    else navigate('/reports?tab=pending-returns');
  };

  const displayItems = items.length > 0 ? items : [
    {
      id: 'GP-2026-0840',
      vendor: 'Shri Ram Processors',
      itemDescription: 'Sample Denim Rolls',
      dueDate: '2026-01-08',
      daysLeft: '3 Days Left',
      status: 'Normal'
    },
    {
      id: 'GP-2026-0812',
      vendor: 'Balaji Chemicals & Dyes',
      itemDescription: 'Empty Chemical Drums',
      dueDate: '2026-01-04',
      daysLeft: 'OVERDUE (1 Day)',
      status: 'Overdue'
    }
  ];

  return (
    <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">Pending / Overdue Returns</h3>
        <button
          onClick={handleNavigate}
          className="text-xs font-semibold text-[#111827] hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      {/* Item List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
        {displayItems.map((item) => (
          <div
            key={item.id}
            onClick={handleNavigate}
            className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl flex items-center justify-between hover:border-[#D1D5DB] transition-all cursor-pointer group"
          >
            <div className="space-y-1 truncate pr-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#111827]">{item.id}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'Overdue'
                      ? 'bg-[#FEE2E2] text-[#EF4444]'
                      : 'bg-[#DCFCE7] text-[#10B981]'
                  }`}
                >
                  {item.daysLeft}
                </span>
              </div>
              <div className="text-xs font-semibold text-[#111827] truncate">{item.itemDescription}</div>
              <div className="text-[10px] text-[#6B7280] truncate">Vendor: {item.vendor}</div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-semibold text-[#6B7280]">Due Date</div>
                <div className="text-[10px] font-bold text-[#111827]">{item.dueDate}</div>
              </div>
              <ArrowUpRight size={14} className="text-[#9CA3AF] group-hover:text-[#111827] transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingReturnsCard;
