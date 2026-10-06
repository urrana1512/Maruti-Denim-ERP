import React from 'react';
import { Menu, Bell, Search, ChevronDown, LogOut, Shield, User } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, selectedCompany } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard Overview';
    if (path.includes('/gate-pass/add')) return 'Create Gate Pass';
    if (path.includes('/gate-pass/manage')) return 'Manage Gate Passes';
    if (path.includes('/material-inward')) return 'Material Inward';
    if (path.includes('/reports')) return 'Reports & MIS Analytics';
    if (path.includes('/master-data/items')) return 'Item Master Management';
    if (path.includes('/master-data/vendors')) return 'Vendor Master Management';
    return 'Dashboard Overview';
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 items-center justify-between border-b border-[#EBEFF2] bg-white px-4 sm:px-6 lg:px-8 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="-m-2 p-2 text-[#6B7280] hover:text-[#111827] md:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#111827] leading-tight">
            {getPageTitle()}
          </h2>
          {selectedCompany && (
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {selectedCompany.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center relative w-64">
          <Search size={15} className="absolute left-3 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search for anything…"
            className="w-full bg-[#F6F8FA] border border-[#EBEFF2] text-xs text-[#111827] placeholder-[#9CA3AF] rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#111827] transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F6F8FA] rounded-lg transition-colors cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]" />
        </button>

        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Shield size={14} /> Admin Panel
          </Link>
        )}

        <div className="h-6 w-px bg-[#EBEFF2]" />

        {/* Profile Link */}
        <div className="flex items-center gap-2.5">
          <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#EBEFF2]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-[#111827] leading-tight">{user?.name || 'User'}</div>
              <div className="text-[10px] font-medium text-[#6B7280]">{user?.roleName || user?.department || 'Employee'}</div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
