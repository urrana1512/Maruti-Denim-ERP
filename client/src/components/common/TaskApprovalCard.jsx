import React from 'react';
import { MoreHorizontal, User, Clock, Check, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TaskApprovalCard = ({ tasks = [], onAccept, onCancel, onViewAll }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (onViewAll) onViewAll();
    else navigate('/gate-pass/manage?status=Pending');
  };

  // Default demo tasks if none provided
  const displayTasks = tasks.length > 0 ? tasks.slice(0, 2) : [
    {
      id: 'GP-2026-0891',
      requester: 'John Chiral',
      department: 'Store & Inventory',
      itemType: 'Returnable Gate Pass',
      priority: 'High',
      time: '01:30 PM',
      date: '2026-01-05'
    },
    {
      id: 'GP-2026-0888',
      requester: 'Ramesh Patel',
      department: 'Production Dept',
      itemType: 'Non-Returnable Pass',
      priority: 'Low',
      time: '11:15 AM',
      date: '2026-01-05'
    }
  ];

  return (
    <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">Your Task / Pending Approvals</h3>
        <button
          onClick={handleNavigate}
          className="text-[#6B7280] hover:text-[#111827] p-1 rounded-md transition-colors cursor-pointer"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Task List Items */}
      <div className="space-y-4 flex-1">
        {displayTasks.map((task) => (
          <div
            key={task.id}
            className="p-3.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl space-y-3 hover:border-[#D1D5DB] transition-all"
          >
            {/* Top User Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-[#111827] font-bold text-xs flex items-center justify-center shrink-0">
                  {task.requester ? task.requester.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111827]">{task.requester}</div>
                  <div className="text-[10px] font-medium text-[#6B7280]">{task.department}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-semibold text-[#6B7280]">{task.date}</div>
                <div className="text-[10px] text-[#9CA3AF]">{task.time}</div>
              </div>
            </div>

            {/* Middle Pass Info */}
            <div className="flex items-center justify-between pt-1 border-t border-[#EBEFF2]/80">
              <span className="text-xs font-semibold text-[#111827]">{task.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  task.priority === 'High'
                    ? 'bg-[#FEE2E2] text-[#EF4444]'
                    : 'bg-[#ECEAFE] text-[#7C3AED]'
                }`}
              >
                {task.priority || 'Normal'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onCancel && onCancel(task)}
                className="w-full border border-[#EBEFF2] bg-white hover:bg-[#F6F8FA] text-[#111827] text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept && onAccept(task)}
                className="w-full bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center"
              >
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskApprovalCard;
