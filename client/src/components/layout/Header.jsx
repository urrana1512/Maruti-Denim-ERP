import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = ({ setIsOpen }) => {
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return 'Home';
    
    return ['Home', ...paths.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))].join(' / ');
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
        <div className="flex flex-1 items-center min-w-0">
          <div className="text-sm font-medium text-slate-500 truncate">
            {getBreadcrumbs()}
          </div>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown stub */}
          <div className="flex items-center gap-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-denim text-white">
              <User size={16} />
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="text-sm font-semibold leading-6 text-slate-700" aria-hidden="true">
                Admin
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
