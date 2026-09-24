import React from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle, History } from 'lucide-react';
import { safeFormatDate } from '../../utils/dateUtils';

const GatePassSummary = ({ gatePassData, gatePass: directGatePass, onHistoryClick }) => {
  const gp = directGatePass || gatePassData?.gatePass || gatePassData;
  if (!gp) return null;

  const returnStatus = gp.returnStatus || 'PENDING';

  const getReturnStatusBadge = (status) => {
    switch (status) {
      case 'FULLY_RETURNED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-success border border-emerald-200">
            <CheckCircle2 size={13} className="mr-1" /> Gate Pass Closed
          </span>
        );
      case 'PARTIALLY_RETURNED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-denim-light text-brand-denim border border-blue-200">
            <Clock size={13} className="mr-1" /> Partially Returned
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle size={13} className="mr-1" /> Pending Return
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-card rounded-lg border border-border-subtle p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center pb-3 border-b border-border-subtle gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-denim-light rounded-lg text-brand-denim">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-brand-navy">{gp.gatePassNumber}</h3>
              {getReturnStatusBadge(returnStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued on: {safeFormatDate(gp.date || gp.createdAt)}
            </p>
          </div>
        </div>

        {onHistoryClick && (
          <button
            type="button"
            onClick={onHistoryClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-denim bg-brand-denim-light hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm transition-all"
          >
            <History size={14} />
            Inward Receipts & Downloads
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium block">Party / Company</span>
          <span className="font-bold text-slate-800 text-sm block truncate">{gp.partyName || gp.companyName}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Purpose</span>
          <span className="font-semibold text-slate-700 block truncate">{gp.purpose || 'Repair'}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Vehicle No.</span>
          <span className="font-semibold text-slate-700 block truncate">{gp.vehicleNumber || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Department / Driver</span>
          <span className="font-semibold text-slate-700 block truncate">
            {gp.department || gp.driverName || '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GatePassSummary;
