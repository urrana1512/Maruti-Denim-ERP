import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Download, Edit, Trash2, Eye, Calendar, RotateCcw, Filter, ArrowRightLeft, History, X, Check } from 'lucide-react';
import { safeFormatDate } from '../../utils/dateUtils';
import { toast } from 'sonner';
import { gatePassService } from '../../services/gatePassService';
import GatePassPreviewModal from '../../components/gate-pass/GatePassPreviewModal';
import EditGatePassModal from '../../components/gate-pass/EditGatePassModal';
import InwardHistoryModal from '../../components/material-inward/InwardHistoryModal';

const ManageGatePass = () => {
  const navigate = useNavigate();
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [passTypeFilter, setPassTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [editingGatePass, setEditingGatePass] = useState(null);
  const [historyGatePass, setHistoryGatePass] = useState(null);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (passTypeFilter !== 'All') params.passType = passTypeFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await gatePassService.getAll(params);
      if (res.success) setGatePasses(res.data);
    } catch (error) {
      console.error('Fetch Gate Passes Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch gate passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGatePasses();
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [search, passTypeFilter, statusFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setSearch('');
    setPassTypeFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const activeFilterCount = [
    passTypeFilter !== 'All',
    statusFilter !== 'All',
    Boolean(startDate),
    Boolean(endDate)
  ].filter(Boolean).length;

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this gate pass? This action cannot be undone.')) {
      try {
        const res = await gatePassService.delete(id);
        if (res.success) {
          toast.success('Gate Pass deleted successfully.');
          fetchGatePasses();
        }
      } catch (error) {
        toast.error('Unable to delete gate pass.');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 min-w-0 max-w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Manage Gate Pass</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">View, search and manage all gate passes.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate('/material-inward')}
            className="flex-1 sm:flex-none flex items-center justify-center px-3.5 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <ArrowRightLeft size={16} className="mr-1.5" />
            Material Inward
          </button>
          <button
            onClick={() => navigate('/gate-pass/add')}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-brand-denim text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-brand-navy transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-brand-denim whitespace-nowrap"
          >
            <Plus size={16} className="mr-1.5" />
            Create Gate Pass
          </button>
        </div>
      </div>

      {/* Summary Cards: 2x2 Grid on Mobile (grid-cols-2), 4-cols on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0 max-w-full">
        {[
          { label: 'Total Gate Passes', value: gatePasses.length, icon: FileText },
          { label: "Today's Passes", value: gatePasses.filter(gp => new Date(gp.date || gp.createdAt).toDateString() === new Date().toDateString()).length, icon: Calendar },
          { label: 'Pending Returns', value: gatePasses.filter(gp => gp.passType === 'Returnable' && gp.returnStatus !== 'FULLY_RETURNED').length, icon: ArrowRightLeft },
          { label: 'Closed / Returned', value: gatePasses.filter(gp => gp.gatePassStatus === 'CLOSED' || gp.returnStatus === 'FULLY_RETURNED').length, icon: Eye },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-surface-card rounded-xl border border-border-subtle p-3.5 sm:p-5 shadow-sm flex items-center min-w-0">
              <div className="p-2 sm:p-3 bg-brand-denim-light rounded-full text-brand-denim mr-2.5 sm:mr-4 flex-shrink-0">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-sm font-medium text-slate-500 truncate">{stat.label}</p>
                <h3 className="text-lg sm:text-2xl font-bold text-brand-navy truncate">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-3 sm:p-4 shadow-sm space-y-3 min-w-0 max-w-full">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 flex items-center bg-surface-bg border border-border-subtle rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-brand-denim">
            <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search Gate Pass No, Party..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-slate-700 min-w-0"
            />
          </div>

          {/* Filter Modal/Drawer Toggle Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center px-3 py-2 border rounded-lg text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap ${
              activeFilterCount > 0 || isFilterOpen
                ? 'bg-brand-denim text-white border-brand-denim shadow-sm'
                : 'bg-white border-border-subtle text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} className="mr-1.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-extrabold bg-white text-brand-denim rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center">
                <Filter size={14} className="mr-1.5 text-brand-denim" /> Filter Gate Passes
              </h4>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Pass Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pass Type</label>
                <select
                  value={passTypeFilter}
                  onChange={(e) => setPassTypeFilter(e.target.value)}
                  className="w-full bg-white border border-border-subtle rounded-md px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-denim font-medium"
                >
                  <option value="All">All Pass Types</option>
                  <option value="Returnable">Returnable</option>
                  <option value="Non-Returnable">Non-Returnable</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Return Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-border-subtle rounded-md px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-denim font-medium"
                >
                  <option value="All">All Return Statuses</option>
                  <option value="PENDING">Pending Return</option>
                  <option value="PARTIALLY_RETURNED">Partially Returned</option>
                  <option value="FULLY_RETURNED">Fully Returned</option>
                </select>
              </div>

              {/* Date Range: From */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-border-subtle rounded-md px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-denim"
                />
              </div>

              {/* Date Range: To */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-border-subtle rounded-md px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-denim"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md transition-colors flex items-center"
              >
                <RotateCcw size={13} className="mr-1" /> Reset Filters
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-4 py-1.5 bg-brand-denim hover:bg-brand-navy text-white font-semibold rounded-md transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Filter Badges Summary */}
        {(search || activeFilterCount > 0) && (
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
            <span className="text-brand-denim font-semibold">
              Found {gatePasses.length} gate passes
            </span>
            <button
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-danger font-medium flex items-center transition-colors"
            >
              <RotateCcw size={13} className="mr-1" /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* --- DESKTOP TABLE VIEW (hidden on mobile) --- */}
      <div className="hidden md:block bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden min-w-0 max-w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-surface-bg">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Gate Pass No.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Party / Dept</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : gatePasses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <FileText size={48} className="text-slate-300 mb-3" />
                      <p className="text-base font-medium">No Gate Passes Found</p>
                      <p className="text-sm mt-1">Create your first gate pass to see it here.</p>
                      <button onClick={() => navigate('/gate-pass/add')} className="mt-4 text-brand-denim font-medium text-sm hover:underline">
                        + Create Gate Pass
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                gatePasses.map((gp) => (
                  <tr key={gp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-navy">
                      {gp.gatePassNumber}
                      {gp.gatePassStatus === 'CLOSED' && (
                        <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] uppercase font-bold">
                          CLOSED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {safeFormatDate(gp.date || gp.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      <div className="font-semibold text-slate-800">{gp.partyName || gp.companyName}</div>
                      {gp.department && <div className="text-xs text-slate-400">{gp.department}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        gp.passType === 'Returnable' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {gp.passType || 'Returnable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {gp.passType === 'Returnable' ? (
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                          gp.returnStatus === 'FULLY_RETURNED' ? 'bg-emerald-100 text-emerald-800' :
                          gp.returnStatus === 'PARTIALLY_RETURNED' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {gp.returnStatus || 'PENDING'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {gp.passType === 'Returnable' && (
                        <button
                          onClick={() => setHistoryGatePass(gp)}
                          className="text-slate-500 hover:text-brand-navy p-1"
                          title="View Inward Receipts & Downloads"
                        >
                          <History size={18} />
                        </button>
                      )}
                      <button onClick={() => setSelectedGatePass(gp)} className="text-slate-400 hover:text-brand-denim p-1" title="View & Download PDF">
                        <Download size={18} />
                      </button>
                      <button onClick={() => setEditingGatePass(gp)} className="text-slate-400 hover:text-brand-navy p-1" title="Edit Gate Pass">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(gp._id)} className="text-slate-400 hover:text-danger p-1" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW (visible on mobile < 768px, NO HORIZONTAL SCROLL) --- */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-10 bg-white rounded-lg border text-slate-400 text-sm">
            Loading gate passes...
          </div>
        ) : gatePasses.length === 0 ? (
          <div className="bg-white rounded-lg border border-border-subtle p-8 text-center text-slate-500">
            <FileText size={40} className="text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Gate Passes Found</p>
            <button onClick={() => navigate('/gate-pass/add')} className="mt-3 text-xs text-brand-denim font-bold underline">
              + Create New Gate Pass
            </button>
          </div>
        ) : (
          gatePasses.map((gp) => (
            <div 
              key={gp._id}
              className="bg-white rounded-xl border border-border-subtle p-4 shadow-sm space-y-3"
            >
              {/* Card Top: Number, Pass Type, Closed Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-brand-navy text-sm">{gp.gatePassNumber}</span>
                  {gp.gatePassStatus === 'CLOSED' && (
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                      CLOSED
                    </span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  gp.passType === 'Returnable' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {gp.passType || 'Returnable'}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Party Name:</span>
                  <span className="font-bold text-slate-800 truncate block">{gp.partyName || gp.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date:</span>
                  <span className="font-semibold text-slate-700 block">{safeFormatDate(gp.date || gp.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Items Count:</span>
                  <span className="font-semibold text-slate-700 block">{gp.items?.length || 0} items</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Return Status:</span>
                  <span className={`font-bold inline-block px-2 py-0.5 rounded text-[10px] mt-0.5 ${
                    gp.returnStatus === 'FULLY_RETURNED' ? 'bg-emerald-100 text-emerald-800' :
                    gp.returnStatus === 'PARTIALLY_RETURNED' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {gp.returnStatus || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                {gp.passType === 'Returnable' && (
                  <button
                    onClick={() => setHistoryGatePass(gp)}
                    className="flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-brand-denim font-bold text-xs rounded"
                  >
                    <History size={14} className="mr-1" /> Inward Receipts
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button 
                    onClick={() => setSelectedGatePass(gp)} 
                    className="p-1.5 bg-blue-50 text-brand-denim hover:bg-blue-100 rounded" 
                    title="PDF"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => setEditingGatePass(gp)} 
                    className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded" 
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(gp._id)} 
                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded" 
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedGatePass && (
        <GatePassPreviewModal
          gatePass={selectedGatePass}
          onClose={() => setSelectedGatePass(null)}
        />
      )}

      {editingGatePass && (
        <EditGatePassModal
          gatePass={editingGatePass}
          onClose={() => setEditingGatePass(null)}
          onSuccess={() => fetchGatePasses()}
        />
      )}

      {historyGatePass && (
        <InwardHistoryModal
          gatePass={historyGatePass}
          onClose={() => setHistoryGatePass(null)}
        />
      )}
    </div>
  );
};

export default ManageGatePass;
