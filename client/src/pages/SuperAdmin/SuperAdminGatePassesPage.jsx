import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  XCircle
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const SuperAdminGatePassesPage = () => {
  const { currentCompany } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [gatePasses, setGatePasses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [status, setStatus] = useState('ALL');
  const [passType, setPassType] = useState('ALL');
  const [search, setSearch] = useState('');

  // Inspection Drawer Modal
  const [selectedPass, setSelectedPass] = useState(null);

  const fetchGatePasses = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getConsolidatedGatePasses({
        companyCode: currentCompany,
        status,
        passType,
        search,
        page,
        limit: 15
      });
      if (res.success) {
        setGatePasses(res.gatePasses || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      toast.error('Failed to load consolidated gate passes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, [currentCompany, status, passType, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGatePasses();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Consolidated Gate Pass Control</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Cross-company operational registry for returnable and non-returnable gate passes.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <Building2 size={15} className="text-sky-600" />
          <span>Active Filter: {currentCompany === 'ALL' ? 'All Companies' : currentCompany.toUpperCase()}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search GP number, party, vehicle, creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Type:</span>
            <select
              value={passType}
              onChange={(e) => { setPassType(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="RETURNABLE">Returnable Only</option>
              <option value="NON_RETURNABLE">Non-Returnable Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active / Open</option>
              <option value="CLOSED">Closed / Returned</option>
            </select>
          </div>
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
        ) : gatePasses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Owning Company</th>
                  <th className="py-3.5 px-4">Gate Pass No.</th>
                  <th className="py-3.5 px-4">Pass Type</th>
                  <th className="py-3.5 px-4">Party / Vendor Name</th>
                  <th className="py-3.5 px-4">Vehicle No.</th>
                  <th className="py-3.5 px-4">Created By</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Creation Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {gatePasses.map((gp) => (
                  <tr key={`${gp.companyCode}-${gp._id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {gp.companyTitle || gp.companyCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{gp.gatePassNumber}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          gp.passType === 'RETURNABLE' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {gp.passType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{gp.companyName || '-'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{gp.vehicleNumber || 'N/A'}</td>
                    <td className="py-3.5 px-4">{gp.createdBy || 'Staff'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          gp.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {gp.status ? gp.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {gp.createdAt ? new Date(gp.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPass(gp)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                        title="Inspect Record"
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
            No gate pass records found matching the active criteria.
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

      {/* Detail Inspection Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded uppercase">
                  {selectedPass.companyTitle}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Gate Pass Inspection: {selectedPass.gatePassNumber}</h3>
              </div>
              <button onClick={() => setSelectedPass(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Party / Vendor</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPass.companyName || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Pass Type</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPass.passType}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicle Number</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedPass.vehicleNumber || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Created By</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPass.createdBy || 'Staff'}</p>
              </div>
            </div>

            {/* Line Items */}
            {selectedPass.items && selectedPass.items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Item Details ({selectedPass.items.length})</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-[10px] text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Quantity</th>
                        <th className="p-2 text-center">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPass.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{it.description}</td>
                          <td className="p-2 text-right font-bold">{it.quantity}</td>
                          <td className="p-2 text-center font-mono">{it.uom || it.um || 'Nos'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminGatePassesPage;
