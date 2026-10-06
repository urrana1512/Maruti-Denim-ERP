import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActivityTimelineCard = ({ activities = [], onViewAll }) => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">Recent Activity</h3>
        <button
          onClick={() => (onViewAll ? onViewAll() : navigate('/reports'))}
          className="text-xs font-semibold text-[#111827] hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      {/* Activity Accordion List */}
      <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-1">
        {activities.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#9CA3AF] space-y-1">
            <FileText size={28} className="mx-auto text-[#D1D5DB]" />
            <p className="font-bold text-[#111827]">No Recent Activity</p>
            <p className="text-[11px] text-[#6B7280]">No activity logs found in the database.</p>
          </div>
        ) : (
          activities.map((item, idx) => (
            <div
              key={item._id || item.id || idx}
              className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl transition-all hover:border-[#D1D5DB]"
            >
              <div
                onClick={() => toggleExpand(item._id || item.id || idx)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#111827]">{item.action || item.title || 'Activity Log'}</div>
                  <div className="text-[10px] text-[#6B7280] mt-0.5">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : item.time || '-'}
                  </div>
                </div>
                <button className="text-[#6B7280] p-1">
                  {expandedId === (item._id || item.id || idx) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {expandedId === (item._id || item.id || idx) && (
                <div className="mt-2.5 pt-2 border-t border-[#EBEFF2] text-xs text-[#6B7280]">
                  <p className="leading-relaxed">{item.details || item.refNumber || 'Activity logged in system'}</p>
                  <p className="text-[10px] font-semibold text-[#111827] mt-1.5">
                    By: {item.user || 'System'}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimelineCard;
