import React from 'react';
import { FileInput } from 'lucide-react';

const InwardDetailsForm = ({ formData, details, onChange, setDetails, errors = {} }) => {
  const data = formData || details || {};

  const handleFieldChange = (field, value) => {
    if (onChange) {
      onChange(field, value);
    } else if (setDetails) {
      setDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="bg-surface-card rounded-lg border border-border-subtle p-4 sm:p-6 shadow-sm space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <h3 className="text-base font-bold text-brand-navy flex items-center">
          <FileInput size={18} className="mr-2 text-brand-denim" />
          Material Inward Transaction Details
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter gate entry number, inward receipt date, and supplier document reference details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gate Entry No. */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Gate Entry No. <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. GE-2026-0158"
            value={data.gateEntryNumber || ''}
            onChange={(e) => handleFieldChange('gateEntryNumber', e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 ${
              errors.gateEntryNumber ? 'border-red-400 focus:ring-red-400' : 'border-border-subtle focus:ring-brand-denim'
            }`}
          />
          {errors.gateEntryNumber && (
            <p className="text-danger text-[11px] mt-1">{errors.gateEntryNumber}</p>
          )}
        </div>

        {/* Inward Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Inward Date <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            value={data.inwardDate || ''}
            onChange={(e) => handleFieldChange('inwardDate', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          />
          {errors.inwardDate && (
            <p className="text-danger text-[11px] mt-1">{errors.inwardDate}</p>
          )}
        </div>

        {/* Challan / Invoice No. */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Challan / Invoice No. <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. CH-99412 or INV-104"
            value={data.challanInvoiceNumber || ''}
            onChange={(e) => handleFieldChange('challanInvoiceNumber', e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 ${
              errors.challanInvoiceNumber ? 'border-red-400 focus:ring-red-400' : 'border-border-subtle focus:ring-brand-denim'
            }`}
          />
          {errors.challanInvoiceNumber && (
            <p className="text-danger text-[11px] mt-1">{errors.challanInvoiceNumber}</p>
          )}
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
          <select
            value={data.documentType || 'Challan'}
            onChange={(e) => handleFieldChange('documentType', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          >
            <option value="Challan">Challan</option>
            <option value="Invoice">Invoice</option>
            <option value="Delivery Challan">Delivery Challan</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Remarks Textarea */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Inward Verification Remarks</label>
        <textarea
          rows={2}
          placeholder="Optional notes regarding condition of returned items, verification, etc."
          value={data.remarks || ''}
          onChange={(e) => handleFieldChange('remarks', e.target.value)}
          className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim resize-none"
        />
      </div>
    </div>
  );
};

export default InwardDetailsForm;
