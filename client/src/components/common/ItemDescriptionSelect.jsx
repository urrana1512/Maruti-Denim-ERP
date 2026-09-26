import React, { useState, useRef, useEffect } from 'react';
import { itemMasterList } from '../../data/itemMasterData';
import { ChevronDown, Search, Check, Layers } from 'lucide-react';

const ItemDescriptionSelect = ({
  value = '',
  onChange,
  onSelectUom,
  placeholder = 'Type or search item description...',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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

  const filteredItems = itemMasterList.filter(item =>
    item.description.toLowerCase().includes((search || '').toLowerCase())
  ).slice(0, 100);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);

    const matched = itemMasterList.find(i => i.description.toLowerCase() === val.trim().toLowerCase());
    if (matched && onSelectUom) {
      onSelectUom(matched.uom);
    }
  };

  const handleSelectOption = (item) => {
    setSearch(item.description);
    onChange(item.description);
    if (onSelectUom) {
      onSelectUom(item.uom);
    }
    setIsOpen(false);
  };

  return (
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
          className="w-full px-3 py-2 pr-9 bg-white border border-border-subtle rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim font-medium placeholder:text-slate-400"
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

      {/* Professional White Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-[9999] left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl shadow-slate-900/25 overflow-hidden min-w-[320px] max-w-[500px]">
          {/* Header info bar */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center">
              <Layers size={12} className="mr-1.5 text-brand-denim" />
              Item Master ({filteredItems.length} matching)
            </span>
            <span>Click to select & auto-fill UOM</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              No matching item in master catalog. Custom item description will be used.
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const isSelected = item.description.toLowerCase() === (search || '').toLowerCase().trim();
                return (
                  <li
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur before click event registers
                      handleSelectOption(item);
                    }}
                    className={`px-3 py-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors hover:bg-slate-100/80 ${
                      isSelected ? 'bg-blue-50/90 text-brand-navy font-bold border-l-4 border-brand-navy pl-2' : 'text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center truncate mr-2">
                      {isSelected && <Check size={14} className="mr-1.5 text-brand-denim flex-shrink-0" />}
                      <span className="truncate">{item.description}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded border border-slate-200 flex-shrink-0 shadow-xs">
                      {item.uom}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ItemDescriptionSelect;
