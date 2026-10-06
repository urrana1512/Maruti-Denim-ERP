import React from 'react';
import { MoreHorizontal, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TaskApprovalCard = ({ tasks = [], onAccept, onCancel, onViewAll }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (onViewAll) onViewAll();
    else navigate('/gate-pass/manage?status=Pending');
  };

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
        {tasks.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#9CA3AF] space-y-1">
            <ShieldAlert size={28} className="mx-auto text-[#D1D5DB]" />
            <p className="font-bold text-[#111827]">No Pending Task Approvals</p>
            <p className="text-[11px] text-[#6B7280]">All tasks in the database have been processed.</p>
          </div>
        ) : (
          tasks.slice(0, 3).map((task) => (
            <div
              key={task._id || task.id}
              className="p-3.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl space-y-3 hover:border-[#D1D5DB] transition-all"
            >
              {/* Top User Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-[#111827] font-bold text-xs flex items-center justify-center shrink-0">
                    {task.requester ? task.requester.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">{task.requester || task.title || 'Gate Pass Request'}</div>
                    <div className="text-[10px] font-medium text-[#6B7280]">{task.department || task.partyName || 'Operations'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-semibold text-[#6B7280]">
                    {task.date ? new Date(task.date).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>

              {/* Middle Pass Info */}
              <div className="flex items-center justify-between pt-1 border-t border-[#EBEFF2]/80">
                <span className="text-xs font-semibold text-[#111827]">{task.refNumber || task.id || 'GP-ENTRY'}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.priority === 'HIGH' || task.priority === 'CRITICAL'
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
          ))
        )}
      </div>
    </div>
  );
};

export default TaskApprovalCard;
