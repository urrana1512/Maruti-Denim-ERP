import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Save, Eye, RefreshCw, CheckCircle2, AlertTriangle, FileText, Calendar, Download, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import GatePassSearch from '../../components/material-inward/GatePassSearch';
import GatePassSummary from '../../components/material-inward/GatePassSummary';
import ReturnableItemsTable from '../../components/material-inward/ReturnableItemsTable';
import InwardDetailsForm from '../../components/material-inward/InwardDetailsForm';
import InwardTotals from '../../components/material-inward/InwardTotals';
import MaterialInwardPreviewModal from '../../components/material-inward/MaterialInwardPreviewModal';
import InwardHistoryModal from '../../components/material-inward/InwardHistoryModal';
import { calculateInwardTotals, formatINR } from '../../utils/gstCalculator';
import { safeFormatDate } from '../../utils/dateUtils';
import { createMaterialInward, fetchGatePassByNumber, getInwardHistoryByGatePass } from '../../services/materialInwardService';
import api from '../../services/api';

const MaterialInward = () => {
  const navigate = useNavigate();

  // Search / Active Gate Pass State
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [inwardHistory, setInwardHistory] = useState([]);

  // Form Details State
  const [inwardDetails, setInwardDetails] = useState({
    gateEntryNumber: '',
    inwardDate: new Date().toISOString().split('T')[0],
    challanInvoiceNumber: '',
    documentType: 'Challan',
    remarks: ''
  });

  // Items State array for items user is currently returning
  const [itemRows, setItemRows] = useState([]);
  
  // Tax Type State
  const [taxType, setTaxType] = useState('CGST_SGST');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [createdInwardRecord, setCreatedInwardRecord] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const loadHistoryForGatePass = async (gpNumber) => {
    if (!gpNumber) {
      setInwardHistory([]);
      return;
    }
    try {
      const res = await getInwardHistoryByGatePass(gpNumber);
      const list = res.data?.history || res.history || res.data || [];
      setInwardHistory(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load inward history section:', err);
      setInwardHistory([]);
    }
  };

  // Robust Universal Gate Pass Selection Handler
  const handleSelectGatePass = (inputData) => {
    if (!inputData) {
      setSelectedGatePass(null);
      setItemRows([]);
      setInwardHistory([]);
      return;
    }

    const payload = inputData.data ? inputData.data : inputData;
    const gpInfo = payload.gatePass ? payload.gatePass : payload;
    
    setSelectedGatePass(gpInfo);
    setCreatedInwardRecord(null);

    loadHistoryForGatePass(gpInfo.gatePassNumber || gpInfo._id);

    const rawReturnableItems = payload.returnableItems || payload.items || gpInfo.items || [];
    
    const mappedRows = rawReturnableItems.map((item, idx) => {
      const origQty = item.originalQuantity ?? item.quantity ?? 0;
      const prevRec = item.previouslyReceivedQuantity ?? item.receivedQuantitySoFar ?? item.receivedQuantity ?? 0;
      const pending = item.pendingQuantity ?? Math.max(0, origQty - prevRec);
      const catStr = String(item.category || '');
      const isOnCost = catStr.includes('On Cost Repair') || catStr.includes('OCR');

      return {
        originalItemId: item._id || `item-${idx}`,
        serialNumber: item.serialNumber || (idx + 1),
        description: item.description || '',
        category: item.category || '',
        originalQuantity: origQty,
        previouslyReceivedQuantity: prevRec,
        pendingQuantity: pending,
        unit: item.uom || item.unit || 'Nos',
        receiveQty: 0,
        rate: isOnCost ? (item.rate || 0) : 0,
        gstPercentage: 18,
        gstType: taxType || 'CGST_SGST'
      };
    });

    setItemRows(mappedRows);
  };

  // Search Gate Pass Handler
  const handleSearchGatePass = async (gpNumber) => {
    if (!gpNumber || !gpNumber.trim()) return;
    try {
      setLoadingSearch(true);
      const res = await fetchGatePassByNumber(gpNumber.trim());
      if (res.success && res.data) {
        handleSelectGatePass(res.data);
        const passNo = res.data.gatePass?.gatePassNumber || res.data.gatePassNumber || gpNumber;
        toast.success(`Gate Pass ${passNo} loaded successfully!`);
      } else {
        toast.error(res.message || 'Gate Pass not found.');
      }
    } catch (err) {
      console.error('Fetch Gate Pass Error:', err);
      toast.error(err.response?.data?.message || err.message || `Failed to fetch Gate Pass "${gpNumber}"`);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Handle individual item row updates
  const handleItemChange = (index, field, value) => {
    setItemRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Live Totals calculation
  const totals = useMemo(() => {
    return calculateInwardTotals(itemRows, taxType);
  }, [itemRows, taxType]);

  // Validation before submit
  const validateForm = () => {
    if (!selectedGatePass) {
      toast.error('Please select a Returnable Gate Pass.');
      return false;
    }

    if (!inwardDetails.gateEntryNumber.trim()) {
      toast.error('Gate Entry Number is required.');
      return false;
    }

    if (!inwardDetails.challanInvoiceNumber.trim()) {
      toast.error('Challan / Invoice Number is required.');
      return false;
    }

    const activeItems = itemRows.filter(r => Number(r.receiveQty) > 0);
    if (activeItems.length === 0) {
      toast.error('At least one item must have a Receive Quantity greater than 0.');
      return false;
    }

    for (const item of activeItems) {
      if (Number(item.receiveQty) > item.pendingQuantity) {
        toast.error(`Receive Quantity for "${item.description}" exceeds pending quantity (${item.pendingQuantity}).`);
        return false;
      }
    }

    return true;
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const activeItems = itemRows
        .filter(r => Number(r.receiveQty) > 0)
        .map(r => {
          const catStr = String(r.category || '');
          const isOnCost = catStr.includes('On Cost Repair') || catStr.includes('OCR');
          return {
            originalItemId: r.originalItemId,
            serialNumber: r.serialNumber,
            description: r.description,
            originalQuantity: r.originalQuantity,
            receivedQuantity: Number(r.receiveQty),
            unit: r.unit,
            rate: isOnCost ? (Number(r.rate) || 0) : 0,
            gstPercentage: Number(r.gstPercentage) || 0
          };
        });

      const payload = {
        gatePassId: selectedGatePass._id,
        gatePassNumber: selectedGatePass.gatePassNumber,
        gateEntryNumber: inwardDetails.gateEntryNumber,
        inwardDate: inwardDetails.inwardDate,
        challanInvoiceNumber: inwardDetails.challanInvoiceNumber,
        documentType: inwardDetails.documentType,
        partyName: selectedGatePass.partyName || selectedGatePass.companyName,
        taxType,
        remarks: inwardDetails.remarks,
        items: activeItems
      };

      const res = await createMaterialInward(payload);
      const inwardRecord = res.data?.materialInward || res.data;

      toast.success(`Material Inward ${inwardRecord.inwardNumber || 'Voucher'} recorded successfully!`);
      setCreatedInwardRecord(inwardRecord);
      setShowPreviewModal(true);

      // Refresh history section
      loadHistoryForGatePass(selectedGatePass.gatePassNumber || selectedGatePass._id);

      // Reset selection
      setSelectedGatePass(null);
      setItemRows([]);
      setInwardDetails({
        gateEntryNumber: '',
        inwardDate: new Date().toISOString().split('T')[0],
        challanInvoiceNumber: '',
        documentType: 'Challan',
        remarks: ''
      });

    } catch (err) {
      console.error('Material Inward Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to record Material Inward.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadSinglePdf = async (inward) => {
    try {
      toast.loading(`Downloading PDF for ${inward.inwardNumber}...`, { id: 'single-pdf-toast' });
      const response = await api.get(`/material-inward/${inward._id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MarutiDenim_MaterialInwardReceipt_${inward.inwardNumber || 'MI'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Material Inward ${inward.inwardNumber} downloaded!`, { id: 'single-pdf-toast' });
    } catch (err) {
      console.error('Download PDF Error:', err);
      toast.error('Failed to download PDF receipt.', { id: 'single-pdf-toast' });
    }
  };

  const handleDownloadConsolidatedPdf = async (gatePass) => {
    try {
      toast.loading(`Downloading Master Combined Receipt for ${gatePass.gatePassNumber}...`, { id: 'cons-pdf-toast' });
      const response = await api.get(`/material-inward/consolidated-${gatePass.gatePassNumber}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MarutiDenim_ConsolidatedMaterialInwardReceipt_${gatePass.gatePassNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Master Combined Receipt for ${gatePass.gatePassNumber} downloaded!`, { id: 'cons-pdf-toast' });
    } catch (err) {
      console.error('Download Master PDF Error:', err);
      toast.error('Failed to download Master Combined PDF receipt.', { id: 'cons-pdf-toast' });
    }
  };

  const handlePreviewSingleInward = (inward) => {
    setCreatedInwardRecord(inward);
    setShowPreviewModal(true);
  };

  const handlePreviewConsolidated = (gatePass, historyList) => {
    const sortedHistory = [...historyList].sort((a, b) => new Date(a.inwardDate || a.createdAt) - new Date(b.inwardDate || b.createdAt));
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
      _id: `consolidated-${gatePass.gatePassNumber}`,
      inwardNumber: `MI-CONSOLIDATED-${gatePass.gatePassNumber}`,
      gatePassId: gatePass._id,
      gatePassNumber: gatePass.gatePassNumber,
      gateEntryNumber: latest ? (latest.gateEntryNumber || 'CONSOLIDATED') : 'CONSOLIDATED',
      inwardDate: latest ? (latest.inwardDate || latest.createdAt) : new Date(),
      documentType: 'Consolidated Receipt',
      challanInvoiceNumber: `CONSOLIDATED (${sortedHistory.length} Vouchers)`,
      partyName: gatePass.partyName || gatePass.companyName || (latest ? latest.partyName : ''),
      items: allItems,
      subtotal,
      totalCgst,
      totalSgst,
      totalIgst,
      totalGst,
      grandTotal,
      remarks: remarksList.join(' | ') || 'Master Consolidated Material Inward Receipt',
      createdBy: latest ? (latest.createdBy || 'Admin') : 'Admin',
      isConsolidated: true,
      inwardCount: sortedHistory.length,
      gatePassStatus: gatePass.gatePassStatus || gatePass.status,
      returnStatus: gatePass.returnStatus
    };

    setCreatedInwardRecord(consolidatedDoc);
    setShowPreviewModal(true);
  };

  const isGatePassClosed = Boolean(
    selectedGatePass &&
    (selectedGatePass.returnStatus === 'FULLY_RETURNED' || selectedGatePass.gatePassStatus === 'CLOSED')
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate('/gate-pass/manage')}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-brand-navy mb-2 transition-colors"
          >
            <ArrowLeft size={14} className="mr-1" /> Back to Gate Pass List
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Material Inward Entry
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Record incoming materials received against Returnable Gate Passes
          </p>
        </div>
      </div>

      {/* Step 1: Gate Pass Search / Selection */}
      <GatePassSearch 
        onSearch={handleSearchGatePass}
        onSelectDirect={handleSelectGatePass}
        loading={loadingSearch}
        selectedGatePass={selectedGatePass}
      />

      {/* Active Gate Pass Content */}
      {selectedGatePass && (
        <div className="space-y-6 animate-fadeIn">
          {/* Step 2: Gate Pass Details Summary */}
          <GatePassSummary 
            gatePass={selectedGatePass}
            onHistoryClick={() => setShowHistoryModal(true)} 
          />

          {/* Warning if Gate Pass is already fully returned or closed */}
          {isGatePassClosed ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-center gap-3 text-sm">
              <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
              <div>
                <strong className="block font-bold text-amber-900">This Gate Pass is Fully Returned / Closed</strong>
                All returnable items have been completely received. No additional material inwards can be logged for this gate pass.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 3: Returnable Items Entry Table */}
              <ReturnableItemsTable 
                items={itemRows} 
                onItemChange={handleItemChange} 
                taxType={taxType}
              />

              {/* Step 4 & 5: Inward Document Details & Live Totals */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <InwardDetailsForm 
                    details={inwardDetails}
                    setDetails={setInwardDetails}
                  />
                </div>

                <div className="lg:col-span-5">
                  <InwardTotals 
                    totals={totals}
                    taxType={taxType}
                    setTaxType={setTaxType}
                    submitting={submitting}
                  />
                </div>
              </div>
            </form>
          )}

          {/* Inward Receipts & History Section on Main Page */}
          {inwardHistory && inwardHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                    <FileText size={20} className="text-brand-denim" />
                    Material Inward Receipts History ({inwardHistory.length} Vouchers Logged)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gate Pass No: <span className="font-bold text-brand-navy">{selectedGatePass.gatePassNumber}</span> • {selectedGatePass.partyName || selectedGatePass.companyName}
                  </p>
                </div>
              </div>

              {/* IF Gate Pass is CLOSED / FULLY RETURNED: Show Master Combined Receipt BEFORE the records list */}
              {(isGatePassClosed || inwardHistory.length > 1) && (
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 rounded-xl p-5 border border-emerald-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-emerald-950 text-base sm:text-lg">
                            Master Combined Material Inward Receipt
                          </h4>
                          {isGatePassClosed && (
                            <span className="bg-emerald-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                              Gate Pass Closed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-800 font-medium mt-0.5">
                          Consolidated receipt combining all {inwardHistory.length} inward vouchers with exact return dates & times.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handlePreviewConsolidated(selectedGatePass, inwardHistory)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                      >
                        <Eye size={14} /> Preview & Print Master Receipt
                      </button>
                      <button
                        onClick={() => handleDownloadConsolidatedPdf(selectedGatePass)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                      >
                        <Download size={14} /> Download Master PDF
                      </button>
                    </div>
                  </div>

                  {/* Master Combined Summary Numbers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="bg-white/80 backdrop-blur-sm p-2.5 rounded-lg border border-emerald-200/60">
                      <span className="text-slate-500 font-semibold block text-[11px]">Combined Receipt Ref</span>
                      <span className="font-extrabold text-emerald-950 text-xs">MI-CONSOLIDATED-{selectedGatePass.gatePassNumber}</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-2.5 rounded-lg border border-emerald-200/60">
                      <span className="text-slate-500 font-semibold block text-[11px]">Total Inward Vouchers</span>
                      <span className="font-extrabold text-slate-800 text-xs">{inwardHistory.length} Receipts Logged</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-2.5 rounded-lg border border-emerald-200/60">
                      <span className="text-slate-500 font-semibold block text-[11px]">Total Returned Items</span>
                      <span className="font-extrabold text-slate-800 text-xs">{inwardHistory.reduce((acc, h) => acc + (h.items?.length || 0), 0)} Items</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-2.5 rounded-lg border border-emerald-200/60">
                      <span className="text-slate-500 font-semibold block text-[11px]">Combined Grand Total</span>
                      <span className="font-extrabold text-emerald-700 text-sm">{formatINR(inwardHistory.reduce((acc, h) => acc + (h.grandTotal || 0), 0))}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* List of Individual Inward History Vouchers */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Individual Inward Receipts ({inwardHistory.length})
                </h4>

                {inwardHistory.map((inward, index) => (
                  <div
                    key={inward._id || index}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-brand-denim/40 transition-all shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="bg-brand-navy text-white font-extrabold px-2.5 py-1 rounded text-xs tracking-wide">
                          {inward.inwardNumber}
                        </span>
                        <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                          <Calendar size={13} className="text-brand-denim" />
                          {safeFormatDate(inward.inwardDate || inward.createdAt, 'dd MMM yyyy, hh:mm a')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreviewSingleInward(inward)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                        >
                          <Eye size={13} /> Preview & Print
                        </button>
                        <button
                          onClick={() => handleDownloadSinglePdf(inward)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-denim hover:bg-brand-navy text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                        >
                          <Download size={13} /> Download PDF
                        </button>
                      </div>
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

                    {/* Items returned in this specific inward */}
                    <div className="bg-white rounded-lg p-3 border border-slate-200/80">
                      <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        Returned Material Items in this Inward
                      </p>
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
            </div>
          )}
        </div>
      )}

      {/* Preview Modal for freshly created or selected Material Inward */}
      {showPreviewModal && createdInwardRecord && (
        <MaterialInwardPreviewModal
          materialInward={createdInwardRecord}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* Inward History Modal */}
      {showHistoryModal && selectedGatePass && (
        <InwardHistoryModal
          gatePass={selectedGatePass}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default MaterialInward;
