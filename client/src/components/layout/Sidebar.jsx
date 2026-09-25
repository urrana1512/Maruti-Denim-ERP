import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, PlusSquare, ArrowRightLeft, BarChart3, Settings, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { label: 'Add Gate Pass', icon: PlusSquare, path: '/gate-pass/add' },
    { label: 'Manage Gate Pass', icon: FileText, path: '/gate-pass/manage' },
    { label: 'Material Inward', icon: ArrowRightLeft, path: '/material-inward' },
    { label: 'Reports & MIS', icon: BarChart3, path: '/reports' },
  ];

  const sidebarClass = `fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy text-white transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={sidebarClass}>
        <div className="flex h-20 items-center justify-between px-4 bg-brand-navy border-b border-white/10 shadow-sm">
          <div className="flex items-center justify-center w-full py-1">
            <img 
              src="/Maruti denim logo.png" 
              alt="Maruti Denim Logo" 
              className="h-20 max-h-20 w-auto object-contain filter drop-shadow" 
            />
          </div>
          <button className="md:hidden text-gray-300 hover:text-white ml-2" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="py-4 px-3">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Gate Pass Management
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-denim text-white shadow' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-8 px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            System
          </div>
          <nav className="space-y-1 opacity-50 cursor-not-allowed">
            <div className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-300">
              <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
              Settings
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
