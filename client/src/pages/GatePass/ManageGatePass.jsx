import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Download, Edit, Eye, Calendar, RotateCcw, Filter, ArrowRightLeft, History, X, Lock, CheckCircle, Ban, AlertTriangle } from 'lucide-react';
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

  // Approval & Cancel Modal States
  const [approvingGatePass, setApprovingGatePass] = useState(null);
  const [cancellingGatePass, setCancellingGatePass] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

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

  const handleConfirmApprove = async () => {
    if (!approvingGatePass) return;
    try {
      setIsProcessingAction(true);
      const res = await gatePassService.approve(approvingGatePass._id);
      if (res.success) {
        toast.success(`Gate Pass ${approvingGatePass.gatePassNumber} approved successfully.`);
        setApprovingGatePass(null);
        fetchGatePasses();
      }
    } catch (error) {
      console.error('Approve Gate Pass Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to approve gate pass');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingGatePass) return;
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason.');
      return;
    }
    try {
      setIsProcessingAction(true);
      const res = await gatePassService.cancel(cancellingGatePass._id, { cancelReason: cancelReason.trim() });
      if (res.success) {
        toast.success(`Gate Pass ${cancellingGatePass.gatePassNumber} cancelled successfully.`);
        setCancellingGatePass(null);
        setCancelReason('');
        fetchGatePasses();
      }
    } catch (error) {
      console.error('Cancel Gate Pass Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to cancel gate pass');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 min-w-0 max-w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Manage Gate Pass</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">View, search, approve and manage gate passes with strict transaction integrity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0 max-w-full">
        {[
          { label: 'Total Gate Passes', value: gatePasses.length, icon: FileText },
          { label: "Approved Passes", value: gatePasses.filter(gp => gp.approvalStatus === 'Approved').length, icon: CheckCircle },
          { label: 'Pending Returns', value: gatePasses.filter(gp => gp.passType === 'Returnable' && gp.returnStatus !== 'FULLY_RETURNED' && gp.gatePassStatus !== 'CANCELLED').length, icon: ArrowRightLeft },
          { label: 'Cancelled Passes', value: gatePasses.filter(gp => gp.gatePassStatus === 'CANCELLED').length, icon: Ban },
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

          {/* Filter Drawer Toggle Button */}
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-border-subtle rounded-md px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-denim"
                />
              </div>

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

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-surface-card rounded-lg border border-border-subtle shadow-sm overflow-hidden min-w-0 max-w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-surface-bg">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Gate Pass No.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Party / Dept</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Approval</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : gatePasses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
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
                gatePasses.map((gp) => {
                  const isApproved = gp.approvalStatus === 'Approved';
                  const isCancelled = gp.gatePassStatus === 'CANCELLED';
                  const isGpLocked = gp.returnStatus === 'PARTIALLY_RETURNED' || gp.returnStatus === 'FULLY_RETURNED' || gp.gatePassStatus === 'CLOSED' || isApproved || isCancelled;

                  return (
                    <tr key={gp._id} className={`hover:bg-slate-50 transition-colors ${isCancelled ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-navy">
                        <div className="flex items-center space-x-1.5">
                          {isGpLocked && <Lock size={14} className="text-amber-600 flex-shrink-0" title="Gate Pass Locked" />}
                          <span className={isCancelled ? 'line-through text-slate-400' : ''}>{gp.gatePassNumber}</span>
                        </div>
                        {isCancelled ? (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] uppercase font-bold border border-red-200">
                            CANCELLED
                          </span>
                        ) : gp.gatePassStatus === 'CLOSED' ? (
                          <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] uppercase font-bold">
                            CLOSED
                          </span>
                        ) : null}
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
                        {isApproved ? (
                          <span className="px-2.5 py-1 inline-flex items-center text-xs leading-5 font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle size={12} className="mr-1 text-emerald-600" /> Approved
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2.5 py-1 inline-flex items-center text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 border border-red-300">
                            <Ban size={12} className="mr-1 text-red-600" /> Cancelled
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 inline-flex items-center text-xs leading-5 font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {gp.passType === 'Returnable' && !isCancelled ? (
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1 sm:space-x-2">
                        {/* History button */}
                        {gp.passType === 'Returnable' && (
                          <button
                            onClick={() => setHistoryGatePass(gp)}
                            className="text-slate-500 hover:text-brand-navy p-1"
                            title="View Inward Receipts & History"
                          >
                            <History size={18} />
                          </button>
                        )}

                        {/* View & Download PDF */}
                        <button
                          onClick={() => setSelectedGatePass(gp)}
                          className="text-emerald-600 hover:text-emerald-800 p-1"
                          title="View & Download PDF (with Approved Stamp if approved)"
                        >
                          <Download size={18} />
                        </button>

                        {/* Approve Button */}
                        {!isApproved && !isCancelled && (
                          <button
                            onClick={() => setApprovingGatePass(gp)}
                            className="text-emerald-600 hover:text-emerald-800 p-1"
                            title="Approve Gate Pass"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button 
                          onClick={() => setEditingGatePass(gp)} 
                          className={`p-1 ${isGpLocked ? 'text-slate-400 hover:text-slate-600' : 'text-blue-600 hover:text-blue-800'}`} 
                          title={isApproved ? "Approved Gate Pass (Read-Only View)" : isCancelled ? "Cancelled Gate Pass (Read-Only View)" : "Edit Gate Pass"}
                        >
                          <Edit size={18} />
                        </button>

                        {/* Cancel Button (Replaces Delete) */}
                        <button 
                          onClick={() => {
                            setCancellingGatePass(gp);
                            setCancelReason('');
                          }} 
                          disabled={isGpLocked}
                          className={`p-1 ${isGpLocked ? 'text-slate-300 cursor-not-allowed' : 'text-rose-600 hover:text-rose-800'}`} 
                          title={isApproved ? "Approved gate pass cannot be cancelled" : isCancelled ? "Gate pass already cancelled" : "Cancel Gate Pass"}
                        >
                          <Ban size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
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
          gatePasses.map((gp) => {
            const isApproved = gp.approvalStatus === 'Approved';
            const isCancelled = gp.gatePassStatus === 'CANCELLED';
            const isGpLocked = gp.returnStatus === 'PARTIALLY_RETURNED' || gp.returnStatus === 'FULLY_RETURNED' || gp.gatePassStatus === 'CLOSED' || isApproved || isCancelled;

            return (
              <div 
                key={gp._id}
                className={`bg-white rounded-xl border border-border-subtle p-4 shadow-sm space-y-3 ${isCancelled ? 'bg-red-50/20' : ''}`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    {isGpLocked && <Lock size={14} className="text-amber-600" />}
                    <span className={`font-extrabold text-brand-navy text-sm ${isCancelled ? 'line-through text-slate-400' : ''}`}>
                      {gp.gatePassNumber}
                    </span>
                    {isCancelled ? (
                      <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                        CANCELLED
                      </span>
                    ) : gp.gatePassStatus === 'CLOSED' ? (
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                        CLOSED
                      </span>
                    ) : null}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    gp.passType === 'Returnable' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {gp.passType || 'Returnable'}
                  </span>
                </div>

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
                    <span className="text-slate-400 block font-medium">Approval Status:</span>
                    <span className={`font-bold inline-block px-2 py-0.5 rounded text-[10px] mt-0.5 ${
                      isApproved ? 'bg-emerald-100 text-emerald-800' :
                      isCancelled ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isApproved ? 'Approved' : isCancelled ? 'Cancelled' : 'Pending'}
                    </span>
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

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  {gp.passType === 'Returnable' && (
                    <button
                      onClick={() => setHistoryGatePass(gp)}
                      className="flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-brand-denim font-bold text-xs rounded"
                    >
                      <History size={14} className="mr-1" /> History
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button 
                      onClick={() => setSelectedGatePass(gp)} 
                      className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded" 
                      title="PDF Download"
                    >
                      <Download size={16} />
                    </button>

                    {!isApproved && !isCancelled && (
                      <button 
                        onClick={() => setApprovingGatePass(gp)} 
                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded" 
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}

                    <button 
                      onClick={() => setEditingGatePass(gp)} 
                      className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded" 
                      title="Edit / View"
                    >
                      <Edit size={16} />
                    </button>

                    <button 
                      onClick={() => {
                        setCancellingGatePass(gp);
                        setCancelReason('');
                      }} 
                      disabled={isGpLocked}
                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded disabled:opacity-40" 
                      title="Cancel Gate Pass"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: APPROVE GATE PASS CONFIRMATION */}
      {approvingGatePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={32} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-brand-navy">Approve Gate Pass</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gate Pass No: <span className="font-extrabold text-brand-denim">{approvingGatePass.gatePassNumber}</span>
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-left text-xs text-emerald-900 space-y-1">
                <p className="font-semibold text-emerald-950 flex items-center">
                  <CheckCircle size={14} className="mr-1.5 text-emerald-600" /> What happens when approved?
                </p>
                <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 pl-1">
                  <li>This Gate Pass will be locked against future edits.</li>
                  <li>The <strong>APPROVED STAMP</strong> will be displayed on all downloaded PDF documents.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingGatePass(null)}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={isProcessingAction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center"
                >
                  {isProcessingAction ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL GATE PASS CONFIRMATION */}
      {cancellingGatePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Ban size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">Cancel Gate Pass</h3>
                  <p className="text-xs text-slate-500">
                    Gate Pass No: <span className="font-extrabold text-brand-denim">{cancellingGatePass.gatePassNumber}</span>
                  </p>
                </div>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 space-y-1">
                <p className="font-semibold text-rose-950 flex items-center">
                  <AlertTriangle size={14} className="mr-1.5 text-rose-600" /> Historical Record Preserved
                </p>
                <p className="text-[11px] text-rose-800">
                  This Gate Pass will not be deleted. It will remain in system records marked as <strong>CANCELLED</strong> with your reason attached for audit trail.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Cancellation <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Created with wrong party name / incorrect items list..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancellingGatePass(null);
                    setCancelReason('');
                  }}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isProcessingAction}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center"
                >
                  {isProcessingAction ? 'Cancelling...' : 'Cancel Gate Pass'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
