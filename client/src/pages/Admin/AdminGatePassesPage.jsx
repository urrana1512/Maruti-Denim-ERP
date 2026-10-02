import React, { useState, useEffect } from 'react';
import { gatePassService } from '../../services/gatePassService';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  Printer,
  Lock,
  X,
  Calendar
} from 'lucide-react';

const AdminGatePassesPage = () => {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [passTypeFilter, setPassTypeFilter] = useState('ALL');

  // Modals state
  const [viewPass, setViewPass] = useState(null);
  const [forceClosePass, setForceClosePass] = useState(null);
  const [forceCloseReason, setForceCloseReason] = useState('');

  const fetchGatePasses = async () => {
    setLoading(true);
    try {
      const res = await gatePassService.getGatePasses({
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        passType: passTypeFilter !== 'ALL' ? passTypeFilter : undefined
      });
      if (res.success) {
        setGatePasses(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load gate passes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, [statusFilter, passTypeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGatePasses();
  };

  const handleForceCloseSubmit = async (e) => {
    e.preventDefault();
    if (!forceClosePass) return;
    try {
      const res = await adminService.forceCloseGatePass(forceClosePass._id, forceCloseReason);
      if (res.success) {
        toast.success(res.message);
        setForceClosePass(null);
        setForceCloseReason('');
        fetchGatePasses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error force closing gate pass.');
    }
  };

  const getStatusBadge = (gp) => {
    if (gp.status === 'cancelled' || gp.gatePassStatus === 'CANCELLED') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Cancelled</span>;
    }
    if (gp.status === 'closed' || gp.returnStatus === 'FULLY_RETURNED') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Closed</span>;
    }
    if (gp.returnStatus === 'PARTIALLY_RETURNED') {
      return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Partially Returned</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Active / Open</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Gate Pass Control Center</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Full corporate view, PDF printing, audit trail, and logged Admin force closure</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-surface-card p-3 sm:p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Gate Pass #, Party Name, Item Description..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-border-subtle rounded-md focus:ring-1 focus:ring-brand-denim outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-navy text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={passTypeFilter}
            onChange={(e) => setPassTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-border-subtle rounded-md bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Pass Types</option>
            <option value="Returnable">Returnable</option>
            <option value="Non-Returnable">Non-Returnable</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-border-subtle rounded-md bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active / Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-xl border border-border-subtle shadow-sm overflow-hidden min-w-0 max-w-full">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading gate passes...</div>
        ) : gatePasses.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No gate pass records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-subtle">
              <thead className="bg-surface-bg text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left">Gate Pass #</th>
                  <th className="px-6 py-3 text-left">Vendor / Party</th>
                  <th className="px-6 py-3 text-left">Type & Department</th>
                  <th className="px-6 py-3 text-left">Items Summary</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border-subtle text-sm text-slate-700">
                {gatePasses.map((gp) => (
                  <tr key={gp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-brand-navy text-sm sm:text-base">{gp.gatePassNumber}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} /> {new Date(gp.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{gp.companyName}</div>
                      <div className="text-xs text-slate-500">{gp.vendorCity || 'Local'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{gp.passType || 'Returnable'}</div>
                      <div className="text-xs text-slate-500">{gp.department || 'Operations'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 truncate max-w-xs">
                        {gp.items?.map((i) => i.description).join(', ')}
                      </div>
                      <div className="text-xs text-slate-400">{gp.items?.length || 0} items listed</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(gp)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewPass(gp)}
                          title="View Details"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>

                        <a
                          href={`/documents/gate-pass/${gp._id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          title="Print PDF"
                          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 cursor-pointer"
                        >
                          <Printer size={16} />
                        </a>

                        {gp.status !== 'closed' && gp.returnStatus !== 'FULLY_RETURNED' && (
                          <button
                            onClick={() => setForceClosePass(gp)}
                            title="Admin Explicit Force Close"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 cursor-pointer"
                          >
                            <Lock size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewPass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Gate Pass #{viewPass.gatePassNumber}</h3>
                <p className="text-xs sm:text-sm text-slate-500">Created by {viewPass.createdBy || 'Admin'} on {new Date(viewPass.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setViewPass(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase">Vendor / Party:</span>
                <p className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">{viewPass.companyName}</p>
                <p className="text-slate-600">{viewPass.vendorAddress} {viewPass.vendorCity}</p>
                <p className="text-slate-500 mt-1">GSTIN: {viewPass.vendorGstin || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Pass Specifications:</span>
                <p className="font-semibold text-slate-800 mt-0.5">Type: {viewPass.passType}</p>
                <p className="text-slate-600">Department: {viewPass.department || 'N/A'}</p>
                <p className="text-slate-600">Vehicle #: {viewPass.vehicleNumber || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase mb-2">Itemized Materials ({viewPass.items?.length})</h4>
              <table className="w-full text-left text-xs sm:text-sm border border-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Received</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewPass.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{it.description}</td>
                      <td className="p-2.5 font-mono">{it.quantity} {it.uom}</td>
                      <td className="p-2.5 font-mono text-emerald-700">{it.receivedQuantity || 0} {it.uom}</td>
                      <td className="p-2.5">{it.itemReturnStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setViewPass(null)} className="px-4 py-2 bg-brand-navy text-white text-xs sm:text-sm font-bold rounded-md">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORCE CLOSE MODAL */}
      {forceClosePass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Lock size={22} />
              <h3 className="text-lg font-bold text-brand-navy">Admin Force Close Override</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Officially close Gate Pass <strong>#{forceClosePass.gatePassNumber}</strong>. This override will be permanently logged in the audit trail.
            </p>

            <form onSubmit={handleForceCloseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mandatory Override Reason</label>
                <textarea
                  rows={3}
                  required
                  value={forceCloseReason}
                  onChange={(e) => setForceCloseReason(e.target.value)}
                  placeholder="e.g. Verified item returned without inward slip, or written off by management."
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setForceClosePass(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white text-xs sm:text-sm font-bold rounded-md hover:bg-rose-700">
                  Execute Admin Override Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGatePassesPage;
