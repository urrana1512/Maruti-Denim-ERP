import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, RefreshCw } from 'lucide-react';
import { gatePassService } from '../../services/gatePassService';

const GatePassSearch = ({ onSearch, onSelectDirect, loading, selectedGatePass }) => {
  const [gatePassNumber, setGatePassNumber] = useState('');
  const [returnablePasses, setReturnablePasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(false);

  useEffect(() => {
    const loadReturnablePasses = async () => {
      try {
        setLoadingPasses(true);
        const res = await gatePassService.getAll({ passType: 'Returnable' });
        if (res.success && res.data) {
          setReturnablePasses(res.data);
        }
      } catch (err) {
        console.warn('Failed to load returnable gate pass list:', err);
      } finally {
        setLoadingPasses(false);
      }
    };

    loadReturnablePasses();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (gatePassNumber.trim()) {
      onSearch(gatePassNumber.trim());
    }
  };

  const handleDropdownSelect = (e) => {
    const value = e.target.value;
    if (value) {
      setGatePassNumber(value);
      const matched = returnablePasses.find(p => p.gatePassNumber === value);
      if (matched && onSelectDirect) {
        onSelectDirect(matched);
      }
      if (onSearch) {
        onSearch(value);
      }
    }
  };

  return (
    <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-navy flex items-center">
          <Search size={18} className="mr-2 text-brand-denim" />
          Fetch Gate Pass for Material Inward
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Enter a Returnable Gate Pass Number or select from the list below to record incoming materials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Text Input Search Form */}
        <form onSubmit={handleSubmit} className="md:col-span-7 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter GP No. e.g. GP-2026-0001"
              value={gatePassNumber}
              onChange={(e) => setGatePassNumber(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-white border border-border-subtle rounded-lg text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-denim uppercase"
            />
            <Search size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={loading || !gatePassNumber.trim()}
            className="flex items-center justify-center px-4 py-2 bg-brand-denim text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-brand-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="mr-1.5 animate-spin" /> Fetching...
              </>
            ) : (
              <>
                Fetch Pass <ArrowRight size={15} className="ml-1.5" />
              </>
            )}
          </button>
        </form>

        {/* Or Divider */}
        <div className="md:col-span-1 text-center text-xs font-bold text-slate-400 uppercase">
          OR
        </div>

        {/* Dropdown Select */}
        <div className="md:col-span-4">
          <select
            onChange={handleDropdownSelect}
            value={selectedGatePass?.gatePassNumber || gatePassNumber || ''}
            disabled={loading || loadingPasses}
            className="w-full py-2 px-3 bg-slate-50 border border-border-subtle rounded-lg text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-denim cursor-pointer"
          >
            <option value="">-- Select Active Gate Pass --</option>
            {returnablePasses.map((gp) => (
              <option key={gp._id} value={gp.gatePassNumber}>
                {gp.gatePassNumber} ({gp.partyName || gp.companyName})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default GatePassSearch;
