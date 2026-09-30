import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { approveMaterialInward } from '../../services/materialInwardService';
import { formatINR } from '../../utils/gstCalculator';
import { safeFormatDate } from '../../utils/dateUtils';

const ApproveInwardConfirmModal = ({ inward, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmApprove = async () => {
    if (!inward?._id && !inward?.inwardNumber) return;
    try {
      setSubmitting(true);
      const res = await approveMaterialInward(inward._id || inward.inwardNumber, { approvedBy: 'Admin' });
      if (res.success || res.data) {
        toast.success(`Material Inward ${inward.inwardNumber} approved successfully! Editing is now locked.`);
        if (onSuccess) onSuccess(res.data || res);
        onClose();
      }
    } catch (err) {
      console.error('Approval Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to approve Material Inward.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            Confirm Material Inward Approval
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm text-slate-700">
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold">Post-Approval Locking Rule</p>
              <p className="text-amber-800">
                Once you approve this receipt, its details (gate entry number, received quantities, tax amounts, and date) will be permanently locked and <strong>cannot be edited</strong>.
              </p>
            </div>
          </div>

          {/* Receipt Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Receipt Reference</span>
              <span className="font-extrabold text-brand-navy bg-white px-2 py-0.5 rounded border border-slate-200">
                {inward.inwardNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-400 block">Gate Entry No:</span>
                <span className="font-bold text-slate-800">{inward.gateEntryNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Challan / Invoice:</span>
                <span className="font-bold text-slate-800">{inward.challanInvoiceNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Inward Date:</span>
                <span className="font-semibold text-slate-800">
                  {safeFormatDate(inward.inwardDate || inward.createdAt, 'dd MMM yyyy')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Grand Total:</span>
                <span className="font-extrabold text-brand-navy">{formatINR(inward.grandTotal)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center font-medium">
            Are you sure you want to approve receipt <strong className="text-slate-800">{inward.inwardNumber}</strong>?
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmApprove}
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Lock size={14} />
            {submitting ? 'Approving...' : 'Confirm & Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveInwardConfirmModal;
