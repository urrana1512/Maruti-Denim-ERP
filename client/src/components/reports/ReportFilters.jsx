import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw, FileSpreadsheet, Printer, Search, Calendar } from 'lucide-react';
import { safeFormatDate } from '../../utils/dateUtils';

const ReportFilters = ({
  activeTab,
  parties = [],
  filters,
  onFilterChange,
  onApply,
  onReset,
  onExportExcel,
  onExportPdf,
  isExporting
}) => {
  const [datePreset, setDatePreset] = useState('This Month');

  // Handle Preset Date calculation (Indian Financial Year starts Apr 1)
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    let from = '';
    let to = '';

    const formatDateStr = (d) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'Today': {
        from = formatDateStr(now);
        to = formatDateStr(now);
        break;
      }
      case 'Yesterday': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        from = formatDateStr(y);
        to = formatDateStr(y);
        break;
      }
      case 'This Week': {
        const first = new Date(now);
        const day = first.getDay(); // 0: Sun, 1: Mon
        const diff = first.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(first.setDate(diff));
        from = formatDateStr(monday);
        to = formatDateStr(now);
        break;
      }
      case 'This Month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        from = formatDateStr(firstDay);
        to = formatDateStr(now);
        break;
      }
      case 'Previous Month': {
        const firstPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastPrev = new Date(now.getFullYear(), now.getMonth(), 0);
        from = formatDateStr(firstPrev);
        to = formatDateStr(lastPrev);
        break;
      }
      case 'This Financial Year': {
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed (0: Jan, 3: Apr)
        const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
        const fyStart = new Date(fyStartYear, 3, 1); // April 1st
        const fyEnd = new Date(fyStartYear + 1, 2, 31); // March 31st
        from = formatDateStr(fyStart);
        to = formatDateStr(now < fyEnd ? now : fyEnd);
        break;
      }
      case 'Custom Range':
      default:
        return;
    }

    onFilterChange('fromDate', from);
    onFilterChange('toDate', to);
  };

  useEffect(() => {
    // Set default preset on load
    applyPreset('This Month');
  }, []);

  const isInwardReport = activeTab === 'material-inward';
  const dateLabel = isInwardReport ? 'Material Inward Date' : 'Gate Pass Date';

  return (
    <div className="bg-surface-card border border-border-subtle rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center space-x-2 text-brand-navy font-bold text-sm sm:text-base">
          <Filter size={18} className="text-brand-denim" />
          <span>Filter Parameters</span>
        </div>
        
        {/* Preset Selector Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['Today', 'Yesterday', 'This Week', 'This Month', 'Previous Month', 'This Financial Year', 'Custom Range'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                datePreset === p 
                  ? 'bg-brand-navy text-white font-semibold shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
        {/* From Date */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center">
            <Calendar size={14} className="mr-1 text-slate-400" />
            {dateLabel} (From)
          </label>
          <input
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => {
              setDatePreset('Custom Range');
              onFilterChange('fromDate', e.target.value);
            }}
            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center">
            <Calendar size={14} className="mr-1 text-slate-400" />
            {dateLabel} (To)
          </label>
          <input
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => {
              setDatePreset('Custom Range');
              onFilterChange('toDate', e.target.value);
            }}
            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          />
        </div>

        {/* Party / Company Dropdown */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Party / Company</label>
          <select
            value={filters.party || 'All'}
            onChange={(e) => onFilterChange('party', e.target.value)}
            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          >
            <option value="All">All Parties</option>
            {parties.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Material Type */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Material Type</label>
          <select
            value={filters.materialType || 'All'}
            onChange={(e) => onFilterChange('materialType', e.target.value)}
            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          >
            <option value="All">All Types</option>
            <option value="RETURNABLE">Returnable</option>
            <option value="NON_RETURNABLE">Non-Returnable</option>
          </select>
        </div>

        {/* Gate Pass Status */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Gate Pass Status</label>
          <select
            value={filters.gatePassStatus || 'All'}
            onChange={(e) => onFilterChange('gatePassStatus', e.target.value)}
            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          >
            <option value="All">All Gate Pass Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        {/* Return Status */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Return Status</label>
          <select
            value={filters.returnStatus || 'All'}
            onChange={(e) => onFilterChange('returnStatus', e.target.value)}
            className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          >
            <option value="All">All Return Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="PARTIALLY_RETURNED">PARTIALLY_RETURNED</option>
            <option value="FULLY_RETURNED">FULLY_RETURNED</option>
          </select>
        </div>

        {/* Gate Pass Number Search */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Gate Pass No.</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. GP-2026-0001"
              value={filters.gatePassNumber || ''}
              onChange={(e) => onFilterChange('gatePassNumber', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
            />
          </div>
        </div>

        {/* Inward / Item Search */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Item / Material Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search item name..."
              value={filters.item || ''}
              onChange={(e) => onFilterChange('item', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-border-subtle rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onApply}
            className="px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-lg font-bold text-xs sm:text-sm shadow-sm transition-colors flex items-center"
          >
            <Filter size={15} className="mr-1.5" /> Apply Filters
          </button>
          
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center"
          >
            <RefreshCw size={15} className="mr-1.5" /> Reset Filters
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onExportExcel}
            disabled={isExporting}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs sm:text-sm shadow-sm transition-colors flex items-center disabled:opacity-50"
          >
            <FileSpreadsheet size={16} className="mr-1.5" />
            {isExporting ? 'Generating Report...' : 'Export Excel Workbook'}
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-xs sm:text-sm shadow-sm transition-colors flex items-center"
          >
            <Printer size={15} className="mr-1.5" /> Print / PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
