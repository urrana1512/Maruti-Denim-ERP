import React from 'react';

const SidebarCollapseIcon = ({ collapsed = false, className = "w-5 h-5", size = 20 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Rounded Box */}
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      
      {/* Vertical Sidebar Divider Line */}
      <line x1="8.5" y1="2.5" x2="8.5" y2="21.5" stroke="currentColor" strokeWidth="1.8" />
      
      {/* 3 Horizontal Sidebar Menu Bars */}
      <line x1="4.5" y1="7" x2="6.5" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4.5" y1="12" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4.5" y1="17" x2="6.5" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Dynamic Arrow */}
      {collapsed ? (
        <path d="M12 12H18M15 9L18 12L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M18 12H12M15 9L12 12L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};

export default SidebarCollapseIcon;
