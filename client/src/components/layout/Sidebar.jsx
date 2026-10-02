import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusSquare,
  ArrowRightLeft,
  BarChart3,
  X,
  Database,
  Building2,
  Layers,
  Shield
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { hasPermission, isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', perm: null },
    { label: 'Add Gate Pass', icon: PlusSquare, path: '/gate-pass/add', perm: 'gate_pass_create' },
    { label: 'Manage Gate Pass', icon: FileText, path: '/gate-pass/manage', perm: 'gate_pass_read' },
    { label: 'Material Inward', icon: ArrowRightLeft, path: '/material-inward', perm: 'material_inward_read' },
    { label: 'Reports & MIS', icon: BarChart3, path: '/reports', perm: 'reports_view' },
  ];

  const masterNavItems = [
    { label: 'Item Description', icon: Layers, path: '/master-data/items', perm: 'master_data_read' },
    { label: 'Vendor Name', icon: Building2, path: '/master-data/vendors', perm: 'master_data_read' },
  ];

  const visibleNavItems = navItems.filter((i) => !i.perm || hasPermission(i.perm));
  const visibleMasterItems = masterNavItems.filter((i) => !i.perm || hasPermission(i.perm));

  const sidebarClass = `fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy text-white transition-transform duration-300 ease-in-out md:translate-x-0 ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}

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

        <div className="py-4 px-3 space-y-6">
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Gate Pass Management
            </div>
            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-denim text-white shadow'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {visibleMasterItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                <Database size={12} className="mr-1.5 text-slate-400" /> Master Data
              </div>
              <nav className="space-y-1">
                {visibleMasterItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-denim text-white shadow'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="mr-3 h-4 w-4 flex-shrink-0 text-slate-300" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {isAdmin && (
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center">
                <Shield size={12} className="mr-1.5 text-blue-400" /> Administration
              </div>
              <nav className="space-y-1">
                <NavLink
                  to="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-3 py-2 text-sm font-semibold rounded-md bg-slate-900 text-blue-300 border border-slate-700 hover:bg-slate-800 transition-all"
                >
                  <Shield className="mr-3 h-4 w-4 text-blue-400" />
                  Admin Panel
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
