import React from 'react';
import { safeFormatDate } from '../../utils/dateUtils';
import { formatINR } from '../../utils/gstCalculator';
import { ChevronLeft, ChevronRight, FileX } from 'lucide-react';

const ReportTable = ({
  activeTab,
  records = [],
  pagination = {},
  onPageChange,
  onPageSizeChange,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-xl p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-denim border-t-transparent mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Generating report data...</p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-xl p-12 text-center shadow-sm">
        <FileX size={40} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-700">No records found</h3>
        <p className="text-xs text-slate-500 mt-1">No data matches the selected filter criteria. Try adjusting your filter parameters.</p>
      </div>
    );
  }

  const { currentPage = 1, pageSize = 25, totalPages = 1, totalItems = 0 } = pagination;
  const startSr = (currentPage - 1) * pageSize;

  const renderStatusBadge = (status, type = 'gp') => {
    if (!status) return '-';

    const upper = String(status).toUpperCase().trim();
    let color = 'bg-slate-100 text-slate-700';
    if (upper === 'OPEN' || upper === 'PENDING' || upper === 'PENDING_APPROVAL') color = 'bg-amber-100 text-amber-800 border border-amber-200 font-bold';
    if (upper === 'APPROVED' || upper === 'CLOSED' || upper === 'FULLY_RETURNED') color = 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold';
    if (upper === 'PARTIALLY_RETURNED') color = 'bg-blue-100 text-blue-800 border border-blue-200 font-bold';
    if (upper === 'CANCELLED') color = 'bg-red-100 text-red-800 border border-red-200 font-bold';

    return (
      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full inline-block ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm space-y-4 overflow-hidden">
      {/* Table Scroll Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[900px]">
          <thead>
            <tr className="bg-brand-navy text-white font-semibold">
              <th className="p-3 text-center w-12 border-b border-brand-navy">Sr.</th>
              
              {activeTab === 'gate-pass' && (
                <>
                  <th className="p-3 border-b border-brand-navy">Gate Pass No.</th>
                  <th className="p-3 border-b border-brand-navy text-center">Date</th>
                  <th className="p-3 border-b border-brand-navy">Party / Company</th>
                  <th className="p-3 border-b border-brand-navy">Purpose</th>
                  <th className="p-3 border-b border-brand-navy text-right">Total Qty</th>
                  <th className="p-3 border-b border-brand-navy">Created By</th>
                  <th className="p-3 border-b border-brand-navy text-center">Approval</th>
                  <th className="p-3 border-b border-brand-navy text-center">GP Status</th>
                  <th className="p-3 border-b border-brand-navy text-center">Return Status</th>
                </>
              )}

              {activeTab === 'material-inward' && (
                <>
                  <th className="p-3 border-b border-brand-navy">Inward No.</th>
                  <th className="p-3 border-b border-brand-navy text-center">Inward Date & Time</th>
                  <th className="p-3 border-b border-brand-navy">Gate Pass No.</th>
                  <th className="p-3 border-b border-brand-navy">Party / Company</th>
                  <th className="p-3 border-b border-brand-navy text-right">Rec. Qty</th>
                  <th className="p-3 border-b border-brand-navy text-right">GST (₹)</th>
                  <th className="p-3 border-b border-brand-navy text-right">Grand Total (₹)</th>
                  <th className="p-3 border-b border-brand-navy">Remarks</th>
                </>
              )}

              {(activeTab === 'returnable-material' || activeTab === 'pending-returns') && (
                <>
                  <th className="p-3 border-b border-brand-navy">Gate Pass No.</th>
                  <th className="p-3 border-b border-brand-navy text-center">GP Date</th>
                  <th className="p-3 border-b border-brand-navy">Party / Company</th>
                  <th className="p-3 border-b border-brand-navy">Item Description</th>
                  <th className="p-3 border-b border-brand-navy text-right">GP Qty</th>
                  <th className="p-3 border-b border-brand-navy text-right">Pending Qty</th>
                  {activeTab === 'pending-returns' && <th className="p-3 border-b border-brand-navy text-center">Days Pending</th>}
                  <th className="p-3 border-b border-brand-navy text-center">Status</th>
                </>
              )}

              {activeTab === 'gate-pass-closure' && (
                <>
                  <th className="p-3 border-b border-brand-navy">Gate Pass No.</th>
                  <th className="p-3 border-b border-brand-navy text-center">GP Date</th>
                  <th className="p-3 border-b border-brand-navy">Party / Company</th>
                  <th className="p-3 border-b border-brand-navy text-right">Ret. Qty</th>
                  <th className="p-3 border-b border-brand-navy">Final Inward No.</th>
                  <th className="p-3 border-b border-brand-navy text-center">Days to Close</th>
                  <th className="p-3 border-b border-brand-navy text-center">Status</th>
                </>
              )}

              {activeTab === 'party-summary' && (
                <>
                  <th className="p-3 border-b border-brand-navy">Party / Company Name</th>
                  <th className="p-3 border-b border-brand-navy text-right">Total Passes</th>
                  <th className="p-3 border-b border-brand-navy text-right">Open</th>
                  <th className="p-3 border-b border-brand-navy text-right">Closed</th>
                  <th className="p-3 border-b border-brand-navy text-right">Pend. Qty</th>
                </>
              )}

              {activeTab === 'combined' && (
                <>
                  <th className="p-3 border-b border-brand-navy">Gate Pass No.</th>
                  <th className="p-3 border-b border-brand-navy text-center">GP Date</th>
                  <th className="p-3 border-b border-brand-navy">Party / Company</th>
                  <th className="p-3 border-b border-brand-navy">Item Description</th>
                  <th className="p-3 border-b border-brand-navy">Inward No.</th>
                  <th className="p-3 border-b border-brand-navy text-right">Rec. Qty</th>
                  <th className="p-3 border-b border-brand-navy text-right">Rate (₹)</th>
                  <th className="p-3 border-b border-brand-navy text-right">Taxable (₹)</th>
                  <th className="p-3 border-b border-brand-navy text-center">GST %</th>
                  <th className="p-3 border-b border-brand-navy text-right">GST (₹)</th>
                  <th className="p-3 border-b border-brand-navy text-right">Grand Total (₹)</th>
                  <th className="p-3 border-b border-brand-navy text-center">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-slate-800">
            {records.map((r, idx) => (
              <tr key={r._id || `${r.gatePassNumber}-${idx}`} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-center text-slate-500 font-medium">{startSr + idx + 1}</td>

                {activeTab === 'gate-pass' && (
                  <>
                    <td className="p-3 font-bold text-brand-navy">{r.gatePassNumber}</td>
                    <td className="p-3 text-center">{safeFormatDate(r.date)}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.companyName}</td>
                    <td className="p-3 text-slate-600">{r.purpose}</td>
                    <td className="p-3 text-right font-medium">{r.totalQuantity}</td>
                    <td className="p-3 font-medium text-slate-700">{r.createdBy || 'System Staff'}</td>
                    <td className="p-3 text-center">{renderStatusBadge(r.approvalStatus || (r.gatePassStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'))}</td>
                    <td className="p-3 text-center">{renderStatusBadge(r.gatePassStatus)}</td>
                    <td className="p-3 text-center">{renderStatusBadge(r.returnStatus)}</td>
                  </>
                )}

                {activeTab === 'material-inward' && (
                  <>
                    <td className="p-3 font-bold text-brand-navy">{r.inwardNumber}</td>
                    <td className="p-3 text-center">{safeFormatDate(r.inwardDate, 'dd/MM/yyyy, hh:mm a')}</td>
                    <td className="p-3 font-semibold text-slate-700">{r.gatePassNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.partyName}</td>
                    <td className="p-3 text-right font-bold text-blue-700">{r.receivedQuantity}</td>
                    <td className="p-3 text-right font-medium text-amber-700">{formatINR(r.totalGst || r.gstAmount)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatINR(r.grandTotal)}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{r.remarks}</td>
                  </>
                )}

                {(activeTab === 'returnable-material' || activeTab === 'pending-returns') && (
                  <>
                    <td className="p-3 font-bold text-brand-navy">{r.gatePassNumber}</td>
                    <td className="p-3 text-center">{safeFormatDate(r.date)}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.companyName}</td>
                    <td className="p-3 font-medium text-slate-700">{r.itemName}</td>
                    <td className="p-3 text-right font-semibold text-blue-700">{r.returnableQuantity || r.originalQuantity}</td>
                    <td className="p-3 text-right font-bold text-red-600">{r.pendingQuantity}</td>
                    {activeTab === 'pending-returns' && (
                      <td className="p-3 text-center font-bold text-red-600">{r.daysPending} Days</td>
                    )}
                    <td className="p-3 text-center">{renderStatusBadge(r.returnStatus)}</td>
                  </>
                )}

                {activeTab === 'gate-pass-closure' && (
                  <>
                    <td className="p-3 font-bold text-brand-navy">{r.gatePassNumber}</td>
                    <td className="p-3 text-center">{safeFormatDate(r.date)}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.companyName}</td>
                    <td className="p-3 text-right font-medium text-emerald-700">{r.totalReturnedQuantity}</td>
                    <td className="p-3 font-semibold text-slate-700">{r.finalInwardNumber}</td>
                    <td className="p-3 text-center font-bold text-emerald-700">{r.totalDaysToClose} Days</td>
                    <td className="p-3 text-center">{renderStatusBadge(r.returnStatus)}</td>
                  </>
                )}

                {activeTab === 'party-summary' && (
                  <>
                    <td className="p-3 font-bold text-brand-navy">{r.partyName}</td>
                    <td className="p-3 text-right font-semibold">{r.totalGatePasses}</td>
                    <td className="p-3 text-right font-semibold text-amber-700">{r.openGatePasses}</td>
                    <td className="p-3 text-right font-semibold text-emerald-700">{r.closedGatePasses}</td>
                    <td className="p-3 text-right font-bold text-red-700">{r.totalPendingQuantity}</td>
                  </>
                )}

                {activeTab === 'combined' && (
                  <>
                    <td className="p-3 font-bold text-brand-navy">{r.gatePassNumber}</td>
                    <td className="p-3 text-center">{safeFormatDate(r.date)}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.partyName}</td>
                    <td className="p-3 font-medium text-slate-700">{r.itemDescription}</td>
                    <td className="p-3 font-semibold text-slate-700">{r.inwardNumber}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{r.receivedQuantity}</td>
                    <td className="p-3 text-right font-medium">{formatINR(r.rate)}</td>
                    <td className="p-3 text-right font-medium">{formatINR(r.taxableAmount)}</td>
                    <td className="p-3 text-center font-medium">{r.gstPercentage || 0}%</td>
                    <td className="p-3 text-right font-medium text-amber-700">{formatINR(r.gstAmount || r.totalGst)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatINR(r.grandTotal)}</td>
                    <td className="p-3 text-center">{renderStatusBadge(r.returnStatus)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Bar */}
      <div className="p-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing <strong className="text-slate-800">{startSr + 1}</strong> to <strong className="text-slate-800">{Math.min(startSr + pageSize, totalItems)}</strong> of <strong className="text-slate-800">{totalItems}</strong> entries
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-border-subtle rounded bg-white text-slate-800 font-semibold focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1.5 rounded border border-border-subtle bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-semibold text-brand-navy">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1.5 rounded border border-border-subtle bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTable;
