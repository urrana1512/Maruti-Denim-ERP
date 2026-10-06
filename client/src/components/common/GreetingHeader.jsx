import React from 'react';
import { Download, Calendar } from 'lucide-react';

const GreetingHeader = ({ userName, roleTitle, onPrimaryAction, actionLabel = 'Export Report' }) => {
  const getGreeting = () => {
    const hour = new window.Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const formatDate = () => {
    const today = new window.Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const displayName = userName || 'User';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 sm:p-6 rounded-xl border border-[#EBEFF2] shadow-2xs">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
          <Calendar size={13} className="text-[#6B7280]" />
          <span>{formatDate()}</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
          <span className="text-[#6B7280] font-normal">{getGreeting()}</span>{' '}
          <span className="text-[#111827] underline decoration-[#7C3AED]/30 decoration-2 underline-offset-4">{displayName}</span>
        </h1>

        {roleTitle && (
          <p className="text-xs font-medium text-[#6B7280]">
            {roleTitle}
          </p>
        )}
      </div>

      {onPrimaryAction && (
        <button
          onClick={onPrimaryAction}
          className="inline-flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#1F2937] text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Download size={16} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default GreetingHeader;
