import React, { useState } from 'react';
import { X, Edit3, Save, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { updateMaterialInward } from '../../services/materialInwardService';
import { formatINR } from '../../utils/gstCalculator';

const EditInwardModal = ({ inward, onClose, onSuccess }) => {
  const [gateEntryNumber, setGateEntryNumber] = useState(inward?.gateEntryNumber || '');
  const [inwardDate, setInwardDate] = useState(
    inward?.inwardDate ? new Date(inward.inwardDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [challanInvoiceNumber, setChallanInvoiceNumber] = useState(inward?.challanInvoiceNumber || '');
  const [documentType, setDocumentType] = useState(inward?.documentType || 'Challan');
  const [remarks, setRemarks] = useState(inward?.remarks || '');

  // Item rows state
  const [items, setItems] = useState(
    (inward?.items || []).map(item => ({
      _id: item._id,
      gatePassItemId: item.gatePassItemId,
      serialNumber: item.serialNumber,
      description: item.description,
      category: item.category || item.gatePassItemId?.category || '',
      originalQuantity: item.originalQuantity || 0,
      previouslyReceivedQuantity: item.previouslyReceivedQuantity || 0,
      pendingQuantityBefore: item.pendingQuantityBefore || (item.originalQuantity || 0) - (item.previouslyReceivedQuantity || 0),
      receivedQuantity: item.receivedQuantity || 0,
      unit: item.unit || 'Nos',
      rate: item.rate || 0,
      gstPercentage: item.gstPercentage || 18,
      gstType: item.gstType || 'CGST_SGST',
      remarks: item.remarks || ''
    }))
  );

  const [submitting, setSubmitting] = useState(false);

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gateEntryNumber.trim()) {
      toast.error('Gate Entry Number is required.');
      return;
    }
    if (!challanInvoiceNumber.trim()) {
      toast.error('Challan / Invoice Number is required.');
      return;
    }

    const activeItems = items.filter(it => Number(it.receivedQuantity) > 0);
    if (activeItems.length === 0) {
      toast.error('At least one item must have a received quantity greater than 0.');
      return;
    }

    for (const item of activeItems) {
      if (Number(item.receivedQuantity) > item.pendingQuantityBefore) {
        toast.error(`Receive quantity for "${item.description}" cannot exceed pending quantity (${item.pendingQuantityBefore}).`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        gateEntryNumber: gateEntryNumber.trim(),
        inwardDate,
        challanInvoiceNumber: challanInvoiceNumber.trim(),
        documentType,
        remarks: remarks.trim(),
        items: activeItems.map(it => ({
          gatePassItemId: it.gatePassItemId,
          serialNumber: it.serialNumber,
          description: it.description,
          receivedQuantity: Number(it.receivedQuantity),
          unit: it.unit,
          rate: Number(it.rate) || 0,
          gstPercentage: Number(it.gstPercentage) || 18,
          gstType: it.gstType || 'CGST_SGST',
          remarks: it.remarks || ''
        }))
      };

      const res = await updateMaterialInward(inward._id || inward.inwardNumber, payload);
      if (res.success || res.data) {
        toast.success(`Material Inward ${inward.inwardNumber} updated successfully!`);
        if (onSuccess) onSuccess(res.data || res);
        onClose();
      }
    } catch (err) {
      console.error('Update Inward Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update Material Inward receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Edit3 size={20} className="text-brand-denim" />
            <h3 className="font-bold text-brand-navy text-base sm:text-lg">
              Edit Material Inward Receipt — {inward?.inwardNumber}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 min-w-0">
          {inward?.status === 'Approved' && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-center gap-2.5 text-amber-900 text-xs font-semibold">
              <Lock size={16} className="text-amber-700 flex-shrink-0" />
              This receipt is Approved and locked. Changes cannot be saved.
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Inward Voucher No.</label>
              <input
                type="text"
                disabled
                value={inward?.inwardNumber || ''}
                className="w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md font-bold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Gate Entry No. *</label>
              <input
                type="text"
                required
                value={gateEntryNumber}
                onChange={(e) => setGateEntryNumber(e.target.value)}
                placeholder="e.g. GE-102"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-denim focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Inward Date *</label>
              <input
                type="date"
                required
                value={inwardDate}
                onChange={(e) => setInwardDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-denim focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Doc Type & Challan / Inv No. *</label>
              <div className="flex gap-1.5">
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="px-2 py-2 bg-white border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-brand-denim focus:outline-none"
                >
                  <option value="Challan">Challan</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Bill">Bill</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  required
                  value={challanInvoiceNumber}
                  onChange={(e) => setChallanInvoiceNumber(e.target.value)}
                  placeholder="Doc No."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-denim focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Returned Items in this Inward</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5 text-center w-10">Sr.</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center w-24">Orig Qty</th>
                    <th className="p-2.5 text-center w-24">Max Allowed</th>
                    <th className="p-2.5 text-center w-32">Receive Qty</th>
                    <th className="p-2.5 text-center w-24">Rate (₹)</th>
                    <th className="p-2.5 text-center w-24">GST %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const catStr = String(item.category || '').toLowerCase();
                    const isNonOcrCategory = catStr.includes('foc') || catStr.includes('free of cost') || catStr.includes('sample') || catStr.includes('other');
                    const isExplicitOcr = catStr.includes('ocr') || catStr.includes('on cost');
                    const isOnCostRepair = isExplicitOcr || (!isNonOcrCategory && (Number(item.rate) > 0 || !item.category));
                    const displayCategory = item.category || (isOnCostRepair ? 'On Cost Repair (OCR)' : 'FOC / Sample / Other');

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-800 block">{item.description}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                            isOnCostRepair ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {displayCategory}
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-slate-600">{item.originalQuantity} {item.unit}</td>
                        <td className="p-2.5 text-center font-bold text-brand-navy">{item.pendingQuantityBefore} {item.unit}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max={item.pendingQuantityBefore}
                            value={item.receivedQuantity}
                            onChange={(e) => handleItemChange(idx, 'receivedQuantity', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-center border border-slate-300 rounded-md font-bold text-slate-800 focus:ring-2 focus:ring-brand-denim"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            disabled={!isOnCostRepair}
                            value={!isOnCostRepair ? '0.00' : (item.rate === 0 || item.rate === '' || item.rate === null ? '' : item.rate)}
                            onChange={(e) => {
                              if (!isOnCostRepair) return;
                              handleItemChange(idx, 'rate', e.target.value);
                            }}
                            placeholder={isOnCostRepair ? '0.00' : '0.00'}
                            title={!isOnCostRepair ? `Rate is disabled for non-OCR category (${displayCategory})` : 'Enter repair rate'}
                            className={`w-full px-2 py-1.5 text-center border rounded-md text-xs font-semibold focus:outline-none focus:ring-2 ${
                              !isOnCostRepair
                                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium'
                                : 'border-slate-300 bg-white text-slate-800 focus:ring-brand-denim font-bold'
                            }`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.gstPercentage}
                            onChange={(e) => handleItemChange(idx, 'gstPercentage', e.target.value)}
                            className="w-full px-2 py-1.5 text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-denim"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional edit remarks"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-brand-denim focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || inward?.status === 'Approved'}
              className="flex items-center gap-1.5 px-6 py-2 bg-brand-denim text-white rounded-md text-xs font-bold hover:bg-brand-navy disabled:opacity-50"
            >
              <Save size={14} />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInwardModal;
