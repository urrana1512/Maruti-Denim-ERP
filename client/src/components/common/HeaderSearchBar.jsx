import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Building2, PackageCheck, User, ArrowRight, Loader2, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const HeaderSearchBar = ({ isSuperAdmin = false, isAdmin = false }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [gatePassResults, setGatePassResults] = useState([]);
  const [masterDataResults, setMasterDataResults] = useState([]);
  const containerRef = useRef(null);

  // Navigation page shortcuts database
  const systemShortcuts = [
    { label: 'Create Gate Pass', path: '/gate-pass/add', category: 'Page Shortcut', icon: FileText, roles: ['employee', 'admin'] },
    { label: 'Manage Gate Passes', path: isAdmin ? '/admin/gate-passes' : isSuperAdmin ? '/superadmin/gate-passes' : '/gate-pass/manage', category: 'Page Shortcut', icon: FileText, roles: ['all'] },
    { label: 'Material Inward', path: isSuperAdmin ? '/superadmin/inward-returnables' : '/material-inward', category: 'Page Shortcut', icon: PackageCheck, roles: ['all'] },
    { label: 'Item Master Data', path: '/master-data/items', category: 'Page Shortcut', icon: Building2, roles: ['all'] },
    { label: 'Vendor Master Data', path: '/master-data/vendors', category: 'Page Shortcut', icon: Building2, roles: ['all'] },
    { label: 'Notifications Inbox', path: isSuperAdmin ? '/superadmin/notifications' : '/notifications', category: 'Page Shortcut', icon: Compass, roles: ['all'] },
    { label: 'Audit / Activity Logs', path: isSuperAdmin ? '/superadmin/audit-logs' : isAdmin ? '/admin/audit-logs' : '/my-activity', category: 'Page Shortcut', icon: Compass, roles: ['all'] }
  ];

  // Close dropdown on outside click or ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch search results on query change
  useEffect(() => {
    if (!query.trim()) {
      setGatePassResults([]);
      setMasterDataResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const searchEndpoint = isSuperAdmin
          ? `/superadmin/gate-passes?search=${encodeURIComponent(query)}&limit=5`
          : `/gate-passes?search=${encodeURIComponent(query)}&limit=5`;

        const gpRes = await api.get(searchEndpoint);
        if (gpRes.data?.success) {
          setGatePassResults(gpRes.data.data || []);
        }
      } catch (err) {
        console.error('Error in global header search:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isSuperAdmin]);

  const handleSelectResult = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const targetPath = isSuperAdmin
      ? `/superadmin/gate-passes?search=${encodeURIComponent(query)}`
      : isAdmin
      ? `/admin/gate-passes?search=${encodeURIComponent(query)}`
      : `/gate-pass/manage?search=${encodeURIComponent(query)}`;

    setIsOpen(false);
    navigate(targetPath);
  };

  const matchingShortcuts = systemShortcuts.filter((s) =>
    s.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative hidden md:flex items-center w-56 sm:w-64" ref={containerRef}>
      <form onSubmit={handleSearchSubmit} className="w-full relative">
        <Search size={15} className="absolute left-3 top-2.5 text-[#9CA3AF]" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search Gate Pass #, Party, Item..."
          className="w-full bg-[#F6F8FA] border border-[#EBEFF2] text-xs text-[#111827] placeholder-[#9CA3AF] rounded-xl pl-9 pr-7 py-2 focus:outline-none focus:border-[#111827] focus:bg-white transition-all shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2.5 top-2.5 text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {/* Dynamic Results Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#EBEFF2] shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="p-3 bg-[#F8FAFC] border-b border-[#EBEFF2] flex items-center justify-between text-xs">
            <span className="font-bold text-[#111827]">
              {query ? `Search results for "${query}"` : 'Quick Navigation Shortcuts'}
            </span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#111827]" />}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#EBEFF2]">
            {/* Matching Page Navigation Shortcuts */}
            {matchingShortcuts.length > 0 && (
              <div className="p-2">
                <div className="px-2.5 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  Page Shortcuts
                </div>
                {matchingShortcuts.map((sc) => {
                  const Icon = sc.icon;
                  return (
                    <div
                      key={sc.path}
                      onClick={() => handleSelectResult(sc.path)}
                      className="p-2 hover:bg-[#F6F8FA] rounded-xl cursor-pointer flex items-center justify-between text-xs font-semibold text-[#111827] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-[#6B7280]" />
                        <span>{sc.label}</span>
                      </div>
                      <ArrowRight size={13} className="text-[#9CA3AF]" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gate Pass Live Results */}
            {query.trim() && (
              <div className="p-2">
                <div className="px-2.5 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  Gate Passes ({gatePassResults.length})
                </div>
                {gatePassResults.length === 0 && !loading ? (
                  <div className="p-3 text-center text-xs text-[#9CA3AF]">
                    No matching gate passes found.
                  </div>
                ) : (
                  gatePassResults.map((gp) => (
                    <div
                      key={gp._id}
                      onClick={() =>
                        handleSelectResult(
                          isSuperAdmin
                            ? `/superadmin/gate-passes?search=${gp.gatePassNumber}`
                            : isAdmin
                            ? `/admin/gate-passes?search=${gp.gatePassNumber}`
                            : `/gate-pass/manage?search=${gp.gatePassNumber}`
                        )
                      }
                      className="p-2.5 hover:bg-[#F6F8FA] rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-[#111827] flex items-center gap-1.5">
                          <FileText size={13} className="text-[#2563EB]" />
                          {gp.gatePassNumber}
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate max-w-[200px]">
                          {gp.companyName} • {gp.passType}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3F4F6] text-[#374151]">
                        {gp.status || 'Active'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Execute Hint */}
          {query.trim() && (
            <div
              onClick={handleSearchSubmit}
              className="p-2.5 bg-[#F8FAFC] border-t border-[#EBEFF2] text-center text-xs font-bold text-[#111827] hover:bg-[#F1F5F9] cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Execute full search for "{query}"</span>
              <ArrowRight size={13} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBar;
