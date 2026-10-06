import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActivityTimelineCard = ({ activities = [], onViewAll }) => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Group default audit activities by category if none provided
  const displayActivities = activities.length > 0 ? activities : [
    {
      category: 'Gate Pass',
      items: [
        {
          id: 'ACT-101',
          title: 'New gate pass created #GP-2026-0891',
          user: 'Chirag Shah',
          time: '2026-01-05 • 01:30 PM',
          details: 'Returnable gate pass for 500 Meters Denim Fabric created and dispatched to Vendor Apex Dyeing.'
        },
        {
          id: 'ACT-102',
          title: 'Gate Pass #GP-2026-0885 Approved',
          user: 'Admin User',
          time: '2026-01-05 • 11:45 AM',
          details: 'Approved by Plant Manager for outward material dispatch.'
        }
      ]
    },
    {
      category: 'Material Inward',
      items: [
        {
          id: 'ACT-103',
          title: 'Inward completed for #GP-2026-0870',
          user: 'Security Guard (Gate 1)',
          time: '2026-01-05 • 10:15 AM',
          details: 'Material inward verification completed. 250 Roll Yarn received against Challan #CH-9921.'
        }
      ]
    }
  ];

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
        {displayActivities.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              {group.category}
            </div>

            <div className="space-y-2">
              {group.items.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl transition-all hover:border-[#D1D5DB]"
                  >
                    <div
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#111827]">{item.title}</div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">{item.time}</div>
                      </div>
                      <button className="text-[#6B7280] p-1">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-[#EBEFF2] text-xs text-[#6B7280]">
                        <p className="leading-relaxed">{item.details}</p>
                        <p className="text-[10px] font-semibold text-[#111827] mt-1.5">
                          By: {item.user}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimelineCard;
