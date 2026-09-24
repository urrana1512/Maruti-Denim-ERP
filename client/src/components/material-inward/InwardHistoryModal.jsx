import React, { useState, useEffect } from 'react';
import { X, Calendar, Package, Download, Eye, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { getInwardHistoryByGatePass } from '../../services/materialInwardService';
import MaterialInwardPreviewModal from './MaterialInwardPreviewModal';
import { formatINR } from '../../utils/gstCalculator';
import { safeFormatDate } from '../../utils/dateUtils';

const InwardHistoryModal = ({ gatePass, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInward, setSelectedInward] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!gatePass?._id && !gatePass?.gatePassNumber) return;
      try {
        setLoading(true);
        const data = await getInwardHistoryByGatePass(gatePass.gatePassNumber || gatePass._id);
        const list = data.data?.history || data.history || data.data || [];
        setHistory(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load inward history:', err);
        setError(err.message || 'Failed to fetch inward history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [gatePass]);

  const handleOpenConsolidated = () => {
    if (!history || history.length === 0) return;

    const sortedHistory = [...history].sort((a, b) => new Date(a.inwardDate || a.createdAt) - new Date(b.inwardDate || b.createdAt));

    const allItems = [];
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGst = 0;
    let grandTotal = 0;
    const remarksList = [];
    let srNo = 1;

    for (const inv of sortedHistory) {
      if (inv.remarks) remarksList.push(`${inv.inwardNumber}: ${inv.remarks}`);
      for (const item of (inv.items || [])) {
        const itemTaxable = Number(item.taxableAmount) || (Number(item.receivedQuantity || 0) * Number(item.rate || 0));
        const itemGst = Number(item.gstAmount) || 0;
        const itemTotal = Number(item.totalAmount) || (itemTaxable + itemGst);

        allItems.push({
          ...item,
          serialNumber: srNo++,
          inwardDate: item.inwardDate || inv.inwardDate || inv.createdAt,
          inwardNumber: item.inwardNumber || inv.inwardNumber,
          challanInvoiceNumber: item.challanInvoiceNumber || inv.challanInvoiceNumber,
          gateEntryNumber: item.gateEntryNumber || inv.gateEntryNumber,
          taxableAmount: itemTaxable,
          gstAmount: itemGst,
          totalAmount: itemTotal
        });
      }
      subtotal += Number(inv.subtotal || 0);
      totalCgst += Number(inv.totalCgst || 0);
      totalSgst += Number(inv.totalSgst || 0);
      totalIgst += Number(inv.totalIgst || 0);
      totalGst += Number(inv.totalGst || 0);
      grandTotal += Number(inv.grandTotal || 0);
    }

    const latest = sortedHistory[sortedHistory.length - 1];

    const consolidatedDoc = {
      _id: `consolidated-${gatePass?.gatePassNumber || gatePass?._id}`,
      inwardNumber: `MI-CONSOLIDATED-${gatePass?.gatePassNumber}`,
      gatePassId: gatePass?._id,
      gatePassNumber: gatePass?.gatePassNumber,
      gateEntryNumber: latest.gateEntryNumber || 'CONSOLIDATED',
      inwardDate: latest.inwardDate || latest.createdAt,
      documentType: 'Consolidated Receipt',
      challanInvoiceNumber: `CONSOLIDATED (${sortedHistory.length} Vouchers)`,
      partyName: gatePass?.partyName || gatePass?.companyName || latest.partyName,
      items: allItems,
      subtotal,
      totalCgst,
      totalSgst,
      totalIgst,
      totalGst,
      grandTotal,
      remarks: remarksList.join(' | ') || 'Master Consolidated Material Inward Receipt',
      createdBy: latest.createdBy || 'Admin',
      isConsolidated: true,
      inwardCount: sortedHistory.length,
      gatePassStatus: gatePass?.gatePassStatus || gatePass?.status,
      returnStatus: gatePass?.returnStatus
    };

    setSelectedInward(consolidatedDoc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-denim/10 text-brand-denim rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                Material Inward Receipts & Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Gate Pass No: <span className="font-bold text-brand-navy">{gatePass?.gatePassNumber}</span> • {gatePass?.partyName || gatePass?.companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Gate Pass Status Banner */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Return Status</span>
              <span className={`font-bold inline-block px-2.5 py-0.5 rounded text-[11px] mt-1 ${
                gatePass?.returnStatus === 'FULLY_RETURNED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                gatePass?.returnStatus === 'PARTIALLY_RETURNED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-slate-100 text-slate-700'
              }`}>
                {gatePass?.returnStatus || 'PENDING'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Gate Pass Status</span>
              <span className={`font-bold inline-block px-2.5 py-0.5 rounded text-[11px] mt-1 ${
                gatePass?.gatePassStatus === 'CLOSED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {gatePass?.gatePassStatus || 'OPEN'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Inward Vouchers Logged</span>
              <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{history.length} Receipts</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Gate Pass Issue Date</span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                {safeFormatDate(gatePass?.date || gatePass?.createdAt, 'dd MMM yyyy')}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-denim" />
              Loading inward receipts timeline...
            </div>
          ) : error ? (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-lg text-sm text-center">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium text-sm">No Material Inwards Recorded Yet</p>
              <p className="text-xs text-slate-400 mt-1">When materials are received against this returnable gate pass, inward receipts will be stored here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inward Receipts History ({history.length})</h4>
                {history.length > 0 && (
                  <button
                    onClick={handleOpenConsolidated}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                  >
                    <FileText size={14} /> Preview Master Consolidated Receipt ({history.length} Vouchers)
                  </button>
                )}
              </div>
              {history.map((inward, index) => (
                <div 
                  key={inward._id || index}
                  className="border border-slate-200 rounded-xl p-4 bg-white hover:border-brand-denim/40 transition-all shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="bg-brand-navy text-white font-extrabold px-2.5 py-1 rounded text-xs tracking-wide">
                        {inward.inwardNumber}
                      </span>
                      <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                        <Calendar size={13} className="text-brand-denim" />
                        {safeFormatDate(inward.inwardDate || inward.createdAt, 'dd MMM yyyy, hh:mm a')}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedInward(inward)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-denim hover:bg-brand-navy text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                    >
                      <Download size={14} /> Preview & Download PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Gate Entry No:</span>
                      <p className="font-bold text-slate-800">{inward.gateEntryNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Challan / Invoice:</span>
                      <p className="font-semibold text-slate-700">{inward.challanInvoiceNumber} ({inward.documentType || 'Challan'})</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Subtotal:</span>
                      <p className="font-semibold text-slate-700">{formatINR(inward.subtotal)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Grand Total:</span>
                      <p className="font-extrabold text-brand-navy text-sm">{formatINR(inward.grandTotal)}</p>
                    </div>
                  </div>

                  {/* Items received table */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Returned Material Items in this Inward</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 font-semibold border-b border-slate-200 pb-1 text-[11px]">
                            <th className="pb-1">Item Description</th>
                            <th className="pb-1 text-center">Orig Qty</th>
                            <th className="pb-1 text-center text-brand-navy">Received</th>
                            <th className="pb-1 text-center text-brand-denim">Remaining Pending</th>
                            <th className="pb-1 text-right">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inward.items?.map((item, idx) => {
                            const origQty = item.originalQuantity || item.quantity || 0;
                            const recQty = item.receivedQuantity || 0;
                            const prevRec = item.previouslyReceivedQuantity || 0;
                            const pendingBefore = item.pendingQuantityBefore ?? Math.max(0, origQty - prevRec);
                            const remainingAfter = Math.max(0, pendingBefore - recQty);

                            return (
                              <tr key={idx} className="text-slate-700">
                                <td className="py-1.5 font-medium">{item.description}</td>
                                <td className="py-1.5 text-center text-slate-500">{origQty}</td>
                                <td className="py-1.5 text-center font-bold text-brand-navy">
                                  {recQty} {item.unit || 'Nos'}
                                </td>
                                <td className="py-1.5 text-center font-bold text-slate-600">
                                  {remainingAfter === 0 ? (
                                    <span className="text-emerald-600 font-extrabold flex items-center justify-center">
                                      <CheckCircle2 size={12} className="mr-0.5" /> 0 (Completed)
                                    </span>
                                  ) : (
                                    <span className="text-brand-denim font-bold">{remainingAfter}</span>
                                  )}
                                </td>
                                <td className="py-1.5 text-right font-bold text-slate-800">
                                  {formatINR(item.totalAmount)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {inward.remarks && (
                    <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                      Remarks: {inward.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded Voucher Preview Modal */}
      {selectedInward && (
        <MaterialInwardPreviewModal
          materialInward={selectedInward}
          onClose={() => setSelectedInward(null)}
        />
      )}
    </div>
  );
};

export default InwardHistoryModal;
