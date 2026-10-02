import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X, Building2 } from 'lucide-react';
import api from '../../services/api';

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7days' },
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Custom Range', value: 'custom' },
];

const DashboardFilters = ({ filters, onFilterChange }) => {
  const [vendorsList, setVendorsList] = useState([]);

  useEffect(() => {
    // Fetch distinct parties for vendor filter dropdown
    const loadVendors = async () => {
      try {
        const res = await api.get('/reports/parties');
        if (res.data && res.data.data) {
          setVendorsList(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load vendors list for filters:', err);
      }
    };
    loadVendors();
  }, []);

  const handleRangeChange = (presetValue) => {
    if (presetValue === 'custom') {
      onFilterChange({ ...filters, range: 'custom' });
    } else {
      onFilterChange({
        ...filters,
        range: presetValue,
        fromDate: '',
        toDate: ''
      });
    }
  };

  const handleCustomDateChange = (field, value) => {
    onFilterChange({
      ...filters,
      range: 'custom',
      [field]: value
    });
  };

  const handleVendorChange = (vendorValue) => {
    onFilterChange({ ...filters, vendor: vendorValue });
  };

  const clearFilters = () => {
    onFilterChange({
      range: 'last30days',
      fromDate: '',
      toDate: '',
      vendor: 'All',
      department: 'All'
    });
  };

  const isFiltered = filters.range !== 'last30days' || (filters.vendor && filters.vendor !== 'All') || filters.fromDate || filters.toDate;

  return (
    <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 sm:p-4 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Date Presets */}
        <div className="flex items-center flex-wrap gap-1.5 min-w-0">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Calendar size={14} className="text-brand-denim" />
            Timeframe:
          </span>
          {DATE_PRESETS.map((p) => {
            const isActive = filters.range === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleRangeChange(p.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-navy text-white shadow-xs font-semibold'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Filters Controls */}
        <div className="flex items-center flex-wrap gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-border-subtle/60">
          {/* Custom Date Inputs if Custom Selected */}
          {filters.range === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => handleCustomDateChange('fromDate', e.target.value)}
                className="px-2.5 py-1 text-xs border border-border-subtle rounded-md bg-white text-slate-800 focus:ring-1 focus:ring-brand-denim focus:outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => handleCustomDateChange('toDate', e.target.value)}
                className="px-2.5 py-1 text-xs border border-border-subtle rounded-md bg-white text-slate-800 focus:ring-1 focus:ring-brand-denim focus:outline-none"
              />
            </div>
          )}

          {/* Vendor Dropdown Filter */}
          {vendorsList.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400 hidden sm:inline" />
              <select
                value={filters.vendor || 'All'}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="px-2.5 py-1 text-xs border border-border-subtle rounded-md bg-white text-slate-800 font-medium focus:ring-1 focus:ring-brand-denim focus:outline-none max-w-[180px] truncate"
              >
                <option value="All">All Vendors / Parties</option>
                {vendorsList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <X size={12} /> Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
