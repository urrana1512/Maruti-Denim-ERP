import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PackageCheck,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminInwardPage = () => {
  const { currentCompany } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [returnStatus, setReturnStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchInwardReturnables = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getConsolidatedInwardReturnables({
        companyCode: currentCompany,
        returnStatus,
        search,
        page,
        limit: 15
      });
      if (res.success) {
        setRecords(res.inwardReturnables || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      toast.error('Failed to load inward returnable monitoring data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInwardReturnables();
  }, [currentCompany, returnStatus, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInwardReturnables();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inward & Returnables Monitoring</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Cross-company monitoring for returnable items and inward material status tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <Building2 size={15} className="text-amber-600" />
          <span>Active Filter: {currentCompany === 'ALL' ? 'All Companies' : currentCompany.toUpperCase()}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search GP number, party, creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Return Status:</span>
          <select
            value={returnStatus}
            onChange={(e) => { setReturnStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Return Statuses</option>
            <option value="PENDING">Pending Return</option>
            <option value="PARTIALLY_RETURNED">Partially Returned</option>
            <option value="FULLY_RETURNED">Fully Returned / Closed</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Owning Company</th>
                  <th className="py-3.5 px-4">Gate Pass No.</th>
                  <th className="py-3.5 px-4">Party / Vendor</th>
                  <th className="py-3.5 px-4">Items Count</th>
                  <th className="py-3.5 px-4">Return Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {records.map((rec) => (
                  <tr key={`${rec.companyCode}-${rec._id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {rec.companyTitle || rec.companyCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{rec.gatePassNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{rec.companyName || '-'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{rec.items?.length || 0} Item(s)</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.returnStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : rec.returnStatus === 'PARTIALLY_RETURNED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {rec.returnStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                        title="View Items & Quantities"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            No inward/returnable records found matching the active criteria.
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Showing page {page} of {totalPages} ({total} total records)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Returnable Pass: {selectedRecord.gatePassNumber}</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p><span className="font-bold text-slate-600">Company:</span> {selectedRecord.companyTitle}</p>
              <p><span className="font-bold text-slate-600">Party Name:</span> {selectedRecord.companyName}</p>
              <p><span className="font-bold text-slate-600">Return Status:</span> {selectedRecord.returnStatus}</p>
            </div>

            {selectedRecord.items && (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-right">Sent Qty</th>
                      <th className="p-2 text-right">Returned Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{it.description}</td>
                        <td className="p-2 text-right font-bold">{it.quantity}</td>
                        <td className="p-2 text-right font-bold text-emerald-600">{it.returnedQuantity || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminInwardPage;
