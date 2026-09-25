import React from 'react';
import { FileText, ArrowRightLeft, Clock, CheckCircle2, Building2, PackageCheck, DollarSign } from 'lucide-react';
import { formatINR } from '../../utils/gstCalculator';

const ReportSummaryCards = ({ activeTab, kpis = {} }) => {
  if (!kpis || Object.keys(kpis).length === 0) return null;

  switch (activeTab) {
    case 'gate-pass':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-surface-card border border-border-subtle p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Gate Passes</p>
            <p className="text-xl font-bold text-brand-navy mt-1">{kpis.totalGatePasses || 0}</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Open Passes</p>
            <p className="text-xl font-bold text-amber-800 mt-1">{kpis.openCount || 0}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Closed Passes</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{kpis.closedCount || 0}</p>
          </div>
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Pending Return</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{kpis.pendingReturnCount || 0}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-sm col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Total Quantity</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{kpis.totalQuantity || 0}</p>
          </div>
        </div>
      );

    case 'material-inward':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-surface-card border border-border-subtle p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Inwards</p>
            <p className="text-xl font-bold text-brand-navy mt-1">{kpis.totalInwardReceipts || 0}</p>
          </div>
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Received Qty</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{kpis.totalReceivedQuantity || 0}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Subtotal (Taxable)</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatINR(kpis.subtotalTaxable || 0)}</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Total GST</p>
            <p className="text-xl font-bold text-amber-800 mt-1">{formatINR(kpis.totalGst || 0)}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl shadow-sm col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Grand Total</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{formatINR(kpis.grandTotal || 0)}</p>
          </div>
        </div>
      );

    case 'returnable-material':
    case 'pending-returns':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-card border border-border-subtle p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Items</p>
            <p className="text-xl font-bold text-brand-navy mt-1">{kpis.totalReturnableItems || kpis.totalPendingItems || 0}</p>
          </div>
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Returnable Qty</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{kpis.totalReturnableQuantity || 0}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Returned Qty</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{kpis.totalReturnedQuantity || 0}</p>
          </div>
          <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Pending Qty</p>
            <p className="text-xl font-bold text-red-800 mt-1">{kpis.totalPendingQuantity || 0}</p>
          </div>
        </div>
      );

    case 'gate-pass-closure':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Fully Closed Passes</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{kpis.totalClosedPasses || 0}</p>
          </div>
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Returned Qty</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{kpis.totalReturnedQuantity || 0}</p>
          </div>
          <div className="bg-surface-card border border-border-subtle p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Days to Close</p>
            <p className="text-xl font-bold text-brand-navy mt-1">{kpis.avgDaysToClose || 0} Days</p>
          </div>
        </div>
      );

    case 'party-summary':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-card border border-border-subtle p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Parties</p>
            <p className="text-xl font-bold text-brand-navy mt-1">{kpis.totalParties || 0}</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Open Passes</p>
            <p className="text-xl font-bold text-amber-800 mt-1">{kpis.totalOpenPasses || 0}</p>
          </div>
          <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Pending Qty</p>
            <p className="text-xl font-bold text-red-800 mt-1">{kpis.totalPendingQuantity || 0}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Grand Value</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{formatINR(kpis.totalGrandTotal || 0)}</p>
          </div>
        </div>
      );

    case 'combined':
    default:
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-card border border-border-subtle p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rows</p>
            <p className="text-xl font-bold text-brand-navy mt-1">{kpis.totalRows || 0}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Total Gate Passes</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{kpis.totalGatePasses || 0}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Received Qty</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{kpis.totalReceivedQuantity || 0}</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Balance Qty</p>
            <p className="text-xl font-bold text-amber-800 mt-1">{kpis.totalBalanceQuantity || 0}</p>
          </div>
        </div>
      );
  }
};

export default ReportSummaryCards;
