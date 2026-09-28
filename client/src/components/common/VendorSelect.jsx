import React, { useState, useEffect, useRef } from 'react';
import { masterDataService } from '../../services/masterDataService';
import { ChevronDown, Plus, Building2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VendorSelect = ({
  value = '',
  onChange,
  onSelectVendor,
  placeholder = 'Select or search vendor...',
  error
}) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const fetchActiveVendors = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getActiveVendors();
      if (res.success) {
        setVendors(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load active vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVendors();
  }, []);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVendors = vendors.filter(v =>
    v.vendorName.toLowerCase().includes((search || '').toLowerCase())
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);

    const matched = vendors.find(v => v.vendorName.toLowerCase() === val.trim().toLowerCase());
    if (matched && onSelectVendor) {
      onSelectVendor(matched);
    }
  };

  const handleSelectOption = (vendor) => {
    setSearch(vendor.vendorName);
    onChange(vendor.vendorName);
    if (onSelectVendor) {
      onSelectVendor(vendor);
    }
    setIsOpen(false);
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!newVendorName.trim()) {
      toast.error('Vendor name is required.');
      return;
    }
    try {
      setIsCreating(true);
      const res = await masterDataService.createVendor({ vendorName: newVendorName.trim() });
      if (res.success) {
        toast.success(`Vendor "${res.data.vendorName}" created successfully.`);
        await fetchActiveVendors();
        handleSelectOption(res.data);
        setIsAddModalOpen(false);
        setNewVendorName('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create vendor.';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="relative w-full" ref={containerRef}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            spellCheck="false"
            value={search}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 pr-9 bg-white border ${
              error ? 'border-danger focus:ring-danger' : 'border-border-subtle focus:ring-brand-denim'
            } rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 font-medium placeholder:text-slate-400`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen(prev => !prev);
              if (!isOpen && inputRef.current) inputRef.current.focus();
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-700 focus:outline-none p-1 transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown Popup */}
        {isOpen && (
          <div className="absolute z-[9999] left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl shadow-slate-900/25 overflow-hidden min-w-[280px]">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="flex items-center">
                <Building2 size={12} className="mr-1.5 text-brand-denim" />
                Vendor Master ({filteredVendors.length} matching)
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="text-brand-denim hover:underline font-bold flex items-center"
              >
                <Plus size={12} className="mr-0.5" /> Add New
              </button>
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin mr-2 text-brand-denim" /> Loading vendors...
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                <p className="mb-2 italic">No vendor found matching "{search}"</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setNewVendorName(search);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-brand-denim text-white text-xs font-bold rounded-md hover:bg-brand-navy transition-colors"
                >
                  <Plus size={14} className="mr-1" /> Add "{search}" as New Vendor
                </button>
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredVendors.map((vendor) => {
                  const isSelected = search.toLowerCase() === vendor.vendorName.toLowerCase();
                  return (
                    <li
                      key={vendor._id}
                      onClick={() => handleSelectOption(vendor)}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-blue-50 text-brand-denim font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{vendor.vendorName}</span>
                        {vendor.vendorCode && (
                          <span className="text-[10px] text-slate-400">{vendor.vendorCode}</span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-brand-denim flex-shrink-0 ml-2" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Vendor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-brand-navy flex items-center">
              <Building2 size={18} className="mr-2 text-brand-denim" />
              Add New Vendor Record
            </h3>
            <p className="text-xs text-slate-500">
              Create a new vendor in Vendor Master to select it in transaction documents.
            </p>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor / Company Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. PARV ELECTRONICS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 bg-brand-denim text-white rounded-md text-xs font-bold hover:bg-brand-navy flex items-center disabled:opacity-50"
                >
                  {isCreating ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorSelect;
