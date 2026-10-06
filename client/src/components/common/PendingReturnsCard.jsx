import React from 'react';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PendingReturnsCard = ({ items = [], onViewAll }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (onViewAll) onViewAll();
    else navigate('/reports?tab=pending-returns');
  };

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
        {items.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#9CA3AF] space-y-1">
            <AlertCircle size={28} className="mx-auto text-[#D1D5DB]" />
            <p className="font-bold text-[#111827]">No Pending / Overdue Returns</p>
            <p className="text-[11px] text-[#6B7280]">All returnable items have been received in the database.</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item._id || item.id || idx}
              onClick={handleNavigate}
              className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl flex items-center justify-between hover:border-[#D1D5DB] transition-all cursor-pointer group"
            >
              <div className="space-y-1 truncate pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#111827]">{item.gatePassNumber || item.id || 'GP-REF'}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      item.daysOverdue > 14 || item.status === 'Overdue'
                        ? 'bg-[#FEE2E2] text-[#EF4444]'
                        : 'bg-[#DCFCE7] text-[#10B981]'
                    }`}
                  >
                    {item.daysOverdue ? `${item.daysOverdue} Days Overdue` : item.daysLeft || 'Pending'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#111827] truncate">{item.itemDescription || 'Returnable Material'}</div>
                <div className="text-[10px] text-[#6B7280] truncate">Vendor: {item.vendorName || item.vendor || '-'}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-[#6B7280]">Due Date</div>
                  <div className="text-[10px] font-bold text-[#111827]">
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-[#9CA3AF] group-hover:text-[#111827] transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PendingReturnsCard;
