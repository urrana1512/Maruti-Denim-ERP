import React, { useState, useEffect } from 'react';
import { materialInwardService } from '../../services/materialInwardService';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  Printer,
  Lock,
  X
} from 'lucide-react';

const AdminReturnablePage = () => {
  const [inwards, setInwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedInward, setSelectedInward] = useState(null);

  const fetchInwards = async () => {
    setLoading(true);
    try {
      const res = await materialInwardService.getInwardReceipts({ search });
      if (res.success) {
        setInwards(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load material inward receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInwards();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInwards();
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Returnable Material & Inward Receipts</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track returned vs pending quantities, inward slips, and closed record locks</p>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <Lock className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
        <div className="text-xs sm:text-sm text-amber-900">
          <span className="font-bold">Record Protection Policy:</span> Modification of material inward records after a Gate Pass is officially closed is strictly locked to prevent inventory discrepancies. Only explicit Admin force-closure overrides are permitted.
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-surface-card p-3 sm:p-4 rounded-xl border border-border-subtle shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Inward #, Gate Pass #, Party Name, Challan/Invoice #..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-border-subtle rounded-md focus:ring-1 focus:ring-brand-denim outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-navy text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-slate-800">
            Search
          </button>
        </form>
      </div>

      {/* Inward Table */}
      <div className="bg-surface-card rounded-xl border border-border-subtle shadow-sm overflow-hidden min-w-0 max-w-full">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading material inward receipts...</div>
        ) : inwards.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No material inward records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-subtle">
              <thead className="bg-surface-bg text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left">Inward Receipt #</th>
                  <th className="px-6 py-3 text-left">Ref Gate Pass #</th>
                  <th className="px-6 py-3 text-left">Party Name</th>
                  <th className="px-6 py-3 text-left">Challan / Inv #</th>
                  <th className="px-6 py-3 text-left">Items Received</th>
                  <th className="px-6 py-3 text-left">Inward Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border-subtle text-sm text-slate-700">
                {inwards.map((mi) => (
                  <tr key={mi._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-brand-navy font-mono text-sm">{mi.inwardNumber}</div>
                      <div className="text-xs text-slate-500">Recorded by {mi.createdBy || 'Store'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-brand-denim font-mono">{mi.gatePassNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{mi.partyName}</div>
                      <div className="text-xs text-slate-500">{mi.vendorCity || 'Local'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-slate-800">
                      {mi.challanInvoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 truncate max-w-xs">
                        {mi.items?.map((i) => `${i.description} (${i.receivedQuantity} ${i.unit || 'Nos'})`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(mi.inwardDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInward(mi)}
                          title="View Inward Details"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={`/documents/material-inward/${mi._id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          title="Print Receipt PDF"
                          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 cursor-pointer"
                        >
                          <Printer size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW INWARD MODAL */}
      {selectedInward && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Inward Receipt #{selectedInward.inwardNumber}</h3>
                <p className="text-xs sm:text-sm text-slate-500">Ref Gate Pass #{selectedInward.gatePassNumber} | Date: {new Date(selectedInward.inwardDate).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedInward(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase">Party Name:</span>
                <p className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">{selectedInward.partyName}</p>
                <p className="text-slate-600">Challan/Invoice #: {selectedInward.challanInvoiceNumber}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Gate Entry:</span>
                <p className="font-semibold text-slate-800 mt-0.5">Gate Entry #: {selectedInward.gateEntryNumber || 'N/A'}</p>
                <p className="text-slate-600">Document Type: {selectedInward.documentType || 'Challan'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase mb-2">Received Items Detail</h4>
              <table className="w-full text-left text-xs sm:text-sm border border-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Orig Qty</th>
                    <th className="p-2.5">Prev Received</th>
                    <th className="p-2.5">Received Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInward.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{it.description}</td>
                      <td className="p-2.5 font-mono">{it.originalQuantity} {it.unit}</td>
                      <td className="p-2.5 font-mono text-slate-600">{it.previouslyReceivedQuantity || 0} {it.unit}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700">{it.receivedQuantity} {it.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedInward(null)} className="px-4 py-2 bg-brand-navy text-white text-xs sm:text-sm font-bold rounded-md">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnablePage;
