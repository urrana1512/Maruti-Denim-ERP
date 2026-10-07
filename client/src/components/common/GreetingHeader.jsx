import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GreetingHeader = ({ userName, roleTitle, avatarUrl }) => {
  const { user, superAdmin } = useAuth();
  const [imgError, setImgError] = useState(false);

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

  const activeUser = user || superAdmin;
  const displayName = userName || activeUser?.name || 'User';
  const displayAvatar = avatarUrl || activeUser?.avatarUrl;
  const isSuperAdmin = !!superAdmin || activeUser?.roleName === 'SuperAdmin';
  const profilePath = isSuperAdmin ? '/superadmin/profile' : '/profile';

  return (
    <div className="flex flex-row items-center justify-between gap-4 mb-6 bg-white p-5 sm:p-6 rounded-xl border border-[#EBEFF2] shadow-2xs">
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

      {/* User Profile Image / Default User Icon Avatar on Right */}
      <Link
        to={profilePath}
        title="Manage Profile"
        className="group relative shrink-0 flex items-center justify-center cursor-pointer"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#EBEFF2] shadow-sm group-hover:border-[#7C3AED] group-hover:shadow-md transition-all bg-[#F6F8FA] flex items-center justify-center">
          {displayAvatar && !imgError ? (
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-[#F3F4F6] text-[#111827] flex flex-col items-center justify-center font-bold text-lg sm:text-xl">
              {displayName && displayName !== 'User' ? (
                <span className="text-[#111827]">{displayName.charAt(0).toUpperCase()}</span>
              ) : (
                <User size={28} className="text-[#6B7280]" />
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default GreetingHeader;
