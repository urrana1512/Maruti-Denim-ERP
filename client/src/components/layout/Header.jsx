import React from 'react';
import { Menu, Bell, User, LogOut, Shield } from 'lucide-react';
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

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return 'Home';

    return ['Home', ...paths.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))].join(' / ');
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 items-center gap-x-4 border-b border-border-subtle bg-surface-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-gray-200 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 min-w-0">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="text-sm font-medium text-slate-500 truncate">
            {getBreadcrumbs()}
          </div>
          {selectedCompany && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white tracking-wide">
              {selectedCompany.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-5">
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Shield size={14} className="text-blue-400" /> Admin Panel
            </Link>
          )}

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile Details */}
          <div className="flex items-center gap-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-denim text-white font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {user?.name || 'Authorized User'}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 block uppercase">
                {user?.roleName || user?.department || 'Employee'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer ml-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
