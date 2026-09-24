import React from 'react';
import { formatINR } from '../../utils/gstCalculator';
import { Calculator, Save, RefreshCw } from 'lucide-react';

const InwardTotals = ({ totals, taxType, setTaxType, submitting }) => {
  const currentTotals = totals || {
    totalReceivedQty: 0,
    subtotal: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalGst: 0,
    grandTotal: 0
  };

  return (
    <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <h4 className="text-sm font-bold text-brand-navy flex items-center">
          <Calculator size={16} className="mr-1.5 text-brand-denim" />
          Document Summary & GST Calculation
        </h4>
      </div>

      {/* Tax Structure Type Selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600">
          Tax Calculation Structure
        </label>
        <select
          value={taxType || 'CGST_SGST'}
          onChange={(e) => setTaxType && setTaxType(e.target.value)}
          className="w-full px-3 py-2 border border-border-subtle rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim"
        >
          <option value="CGST_SGST">Intra-State (CGST + SGST)</option>
          <option value="IGST">Inter-State (IGST)</option>
          <option value="NONE">Exempt / No Tax</option>
        </select>
      </div>

      <div className="space-y-2.5 pt-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Total Received Quantity:</span>
          <span className="font-bold text-slate-800 text-sm">{currentTotals.totalReceivedQty || 0}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Subtotal (Taxable Value):</span>
          <span className="font-semibold text-slate-800">{formatINR(currentTotals.subtotal)}</span>
        </div>

        {currentTotals.totalCgst > 0 && (
          <div className="flex justify-between text-slate-600 pl-2.5 border-l-2 border-brand-denim/40">
            <span>CGST:</span>
            <span className="font-semibold text-slate-700">{formatINR(currentTotals.totalCgst)}</span>
          </div>
        )}
        {currentTotals.totalSgst > 0 && (
          <div className="flex justify-between text-slate-600 pl-2.5 border-l-2 border-brand-denim/40">
            <span>SGST:</span>
            <span className="font-semibold text-slate-700">{formatINR(currentTotals.totalSgst)}</span>
          </div>
        )}
        {currentTotals.totalIgst > 0 && (
          <div className="flex justify-between text-slate-600 pl-2.5 border-l-2 border-brand-denim/40">
            <span>IGST:</span>
            <span className="font-semibold text-slate-700">{formatINR(currentTotals.totalIgst)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100 font-medium">
          <span>Total Tax Amount:</span>
          <span className="text-slate-800">{formatINR(currentTotals.totalGst)}</span>
        </div>

        <div className="flex justify-between text-base font-extrabold text-brand-navy pt-2 border-t-2 border-brand-navy">
          <span>Grand Total:</span>
          <span className="text-brand-navy text-lg">{formatINR(currentTotals.grandTotal)}</span>
        </div>
      </div>

      {/* Action Submit Button */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center px-4 py-3 bg-brand-denim hover:bg-brand-navy text-white text-sm font-bold rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <RefreshCw size={16} className="mr-2 animate-spin" /> Saving Receipt...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" /> Save & Generate Material Inward Voucher
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InwardTotals;
