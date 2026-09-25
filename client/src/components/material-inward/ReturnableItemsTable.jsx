import React from 'react';
import { calculateLineItemGST, formatINR } from '../../utils/gstCalculator';
import { AlertCircle } from 'lucide-react';

const ReturnableItemsTable = ({ items = [], onItemChange, taxType = 'CGST_SGST' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-surface-card rounded-lg border border-border-subtle p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-border-subtle pb-3">
        <h3 className="text-base font-bold text-brand-navy">Returnable Material Items</h3>
        <span className="text-xs text-slate-500 font-medium">
          Enter receive quantity, rate & GST for each item being returned.
        </span>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-surface-bg border-y border-border-subtle text-xs font-semibold text-slate-600">
              <th className="p-2.5 w-10 text-center">Sr.</th>
              <th className="p-2.5">Item Description</th>
              <th className="p-2.5 w-20 text-center">Original</th>
              <th className="p-2.5 w-20 text-center">Prev. Rec.</th>
              <th className="p-2.5 w-20 text-center text-brand-denim">Pending</th>
              <th className="p-2.5 w-16 text-center">Unit</th>
              <th className="p-2.5 w-28 text-center text-brand-navy">Receive Qty *</th>
              <th className="p-2.5 w-28">Rate (₹)</th>
              <th className="p-2.5 w-24">GST %</th>
              <th className="p-2.5 w-28 text-right">Taxable</th>
              <th className="p-2.5 w-32 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-xs">
            {items.map((item, index) => {
              const pending = Number(item.pendingQuantity) || 0;
              const receiveQty = Number(item.receiveQty ?? item.receivedQuantity) || 0;
              const isOverLimit = receiveQty > pending;

              const categoryStr = String(item.category || '');
              const isOnCostRepair = categoryStr.includes('On Cost Repair') || categoryStr.includes('OCR');
              const effectiveRate = isOnCostRepair ? (item.rate || 0) : 0;

              const gstCalc = calculateLineItemGST({
                receivedQuantity: receiveQty,
                rate: effectiveRate,
                gstType: item.gstType || taxType || 'CGST_SGST',
                gstPercentage: item.gstPercentage ?? 18
              });

              const origQty = item.originalQuantity ?? item.quantity ?? 0;
              const prevRec = item.previouslyReceivedQuantity ?? item.receivedQuantitySoFar ?? 0;

              return (
                <tr key={item.originalItemId || item._id || index} className={`hover:bg-slate-50 ${isOverLimit ? 'bg-red-50/60' : ''}`}>
                  <td className="p-2.5 text-center text-slate-500 font-medium">{item.serialNumber || index + 1}</td>
                  <td className="p-2.5">
                    <span className="font-semibold text-slate-800 block">{item.description}</span>
                    {item.category && <span className="text-[11px] text-slate-400 block">{item.category}</span>}
                  </td>
                  <td className="p-2.5 text-center font-medium text-slate-600">{origQty}</td>
                  <td className="p-2.5 text-center font-medium text-slate-600">{prevRec}</td>
                  <td className="p-2.5 text-center font-bold text-brand-denim">{pending}</td>
                  <td className="p-2.5 text-center text-slate-600">{item.uom || item.unit || 'Nos'}</td>
                  
                  {/* Receive Qty Input */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={pending}
                      value={receiveQty === 0 ? '' : receiveQty}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                        onItemChange(index, 'receiveQty', val);
                      }}
                      placeholder="0"
                      className={`w-full px-2.5 py-1.5 border rounded-md font-bold text-center text-sm focus:outline-none focus:ring-2 ${
                        isOverLimit 
                          ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400' 
                          : 'border-border-subtle bg-white text-slate-800 focus:ring-brand-denim'
                      }`}
                    />
                    {isOverLimit && (
                      <span className="text-[10px] text-red-600 font-medium block mt-0.5 text-center flex items-center justify-center">
                        <AlertCircle size={10} className="mr-0.5" /> Max {pending}
                      </span>
                    )}
                  </td>

                  {/* Rate Input */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      disabled={!isOnCostRepair}
                      value={!isOnCostRepair ? '0.00' : (item.rate === 0 || !item.rate ? '' : item.rate)}
                      onChange={(e) => {
                        if (!isOnCostRepair) return;
                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                        onItemChange(index, 'rate', val);
                      }}
                      placeholder="0.00"
                      className={`w-full px-2.5 py-1.5 border rounded-md text-xs font-semibold focus:outline-none focus:ring-2 ${
                        !isOnCostRepair 
                          ? 'border-border-subtle bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'border-border-subtle bg-white text-slate-800 focus:ring-brand-denim'
                      }`}
                    />
                  </td>

                  {/* GST % Dropdown */}
                  <td className="p-2">
                    <select
                      value={item.gstPercentage ?? 18}
                      onChange={(e) => onItemChange(index, 'gstPercentage', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-border-subtle rounded-md text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
                    >
                      <option value={0}>0 %</option>
                      <option value={5}>5 %</option>
                      <option value={12}>12 %</option>
                      <option value={18}>18 %</option>
                      <option value={28}>28 %</option>
                    </select>
                  </td>

                  {/* Taxable Amount */}
                  <td className="p-2.5 text-right font-medium text-slate-700">
                    {formatINR(gstCalc.taxableAmount)}
                  </td>

                  {/* Total Amount */}
                  <td className="p-2.5 text-right font-bold text-brand-navy">
                    {formatINR(gstCalc.totalAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnableItemsTable;
