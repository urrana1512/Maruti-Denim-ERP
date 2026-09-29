import React, { useState, useEffect, useCallback } from 'react';
import { masterDataService } from '../../services/masterDataService';
import { 
  Plus, Search, Filter, Edit, Trash2, Power, Eye, 
  ChevronLeft, ChevronRight, Loader2, Building2, AlertTriangle, X, FileText,
  FileSpreadsheet, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import MasterDataPreviewModal from '../../components/master-data/MasterDataPreviewModal';

const VendorMasterPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 });

  // PDF Preview State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfRecords, setPdfRecords] = useState([]);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({ vendorName: '', status: 'ACTIVE' });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [viewingVendor, setViewingVendor] = useState(null);
  const [deactivatingVendor, setDeactivatingVendor] = useState(null);
  const [deletingVendor, setDeletingVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getVendors({
        search,
        status: statusFilter,
        page,
        limit
      });
      if (res.success) {
        setVendors(res.data || []);
        setPagination(res.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 });
      }
    } catch (err) {
      toast.error('Unable to load vendor master data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleOpenPdfPreview = async () => {
    try {
      setLoadingPdf(true);
      toast.loading('Preparing Vendor Master PDF Report...', { id: 'vendor-pdf-toast' });
      const res = await masterDataService.getVendors({
        search,
        status: statusFilter,
        page: 1,
        limit: 5000 // Get all for PDF preview
      });
      if (res.success) {
        setPdfRecords(res.data || []);
        setIsPdfModalOpen(true);
        toast.dismiss('vendor-pdf-toast');
      }
    } catch (err) {
      toast.error('Failed to load records for PDF preview.', { id: 'vendor-pdf-toast' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExportExcel = () => {
    toast.info('Generating Excel file download...');
    masterDataService.exportVendorsExcel({ search, status: statusFilter });
  };

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({ vendorName: '', status: 'ACTIVE' });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({ vendorName: vendor.vendorName, status: vendor.status || 'ACTIVE' });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.vendorName.trim()) {
      errs.vendorName = 'Vendor name is required.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      if (editingVendor) {
        const res = await masterDataService.updateVendor(editingVendor._id, formData);
        if (res.success) {
          toast.success(res.message || 'Vendor updated successfully.');
          setIsFormModalOpen(false);
          fetchVendors();
        }
      } else {
        const res = await masterDataService.createVendor(formData);
        if (res.success) {
          toast.success(res.message || 'Vendor created successfully.');
          setIsFormModalOpen(false);
          fetchVendors();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save vendor.';
      setFormErrors(prev => ({ ...prev, vendorName: msg }));
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (vendor) => {
    const newStatus = vendor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await masterDataService.updateVendorStatus(vendor._id, newStatus);
      if (res.success) {
        toast.success(`Vendor ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`);
        fetchVendors();
      }
    } catch (err) {
      toast.error('Failed to update vendor status.');
    } finally {
      setDeactivatingVendor(null);
    }
  };

  const handleDeleteVendor = async (id) => {
    try {
      const res = await masterDataService.deleteVendor(id);
      if (res.success) {
        toast.success('Vendor deleted successfully.');
        fetchVendors();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'This vendor is already used in existing transactions and cannot be deleted. Deactivate it instead.';
      toast.error(msg);
    } finally {
      setDeletingVendor(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy flex items-center">
            <Building2 className="mr-2.5 text-brand-denim" size={26} />
            Vendor Master
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Manage standardized company and vendor information used throughout the system.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <FileSpreadsheet size={15} className="mr-1.5" /> Excel
          </button>
          <button
            type="button"
            onClick={handleOpenPdfPreview}
            disabled={loadingPdf}
            className="flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            {loadingPdf ? <Loader2 size={15} className="animate-spin mr-1.5" /> : <Download size={15} className="mr-1.5 text-blue-400" />} PDF Report
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center px-4 py-2 bg-brand-denim hover:bg-brand-navy text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-1.5" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 flex items-center">
            <Filter size={14} className="mr-1 text-slate-400" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-border-subtle rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-denim"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-surface-card rounded-lg border border-border-subtle shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3 w-14 text-center">Sr.</th>
                <th className="p-3 w-28">Vendor Code</th>
                <th className="p-3 min-w-[250px]">Vendor Name / Company Name</th>
                <th className="p-3 w-28 text-center">Status</th>
                <th className="p-3 w-36">Created By</th>
                <th className="p-3 w-36">Created Date</th>
                <th className="p-3 w-36 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand-denim" />
                    Loading vendor master records...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No vendor records found matching your search.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor, idx) => {
                  const srNo = (pagination.currentPage - 1) * limit + idx + 1;
                  return (
                    <tr key={vendor._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-medium text-xs">{srNo}</td>
                      <td className="p-3 font-mono text-xs font-semibold text-brand-navy">{vendor.vendorCode || '-'}</td>
                      <td className="p-3 font-semibold text-slate-900">{vendor.vendorName}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          vendor.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {vendor.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-600">{vendor.createdBy || 'Admin'}</td>
                      <td className="p-3 text-xs text-slate-500">
                        {vendor.createdAt ? format(new Date(vendor.createdAt), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="View Details"
                            onClick={() => setViewingVendor(vendor)}
                            className="p-1.5 text-slate-400 hover:text-brand-denim hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            title="Edit Vendor"
                            onClick={() => handleOpenEdit(vendor)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            title={vendor.status === 'ACTIVE' ? 'Deactivate Vendor' : 'Activate Vendor'}
                            onClick={() => {
                              if (vendor.status === 'ACTIVE') {
                                setDeactivatingVendor(vendor);
                              } else {
                                handleToggleStatus(vendor);
                              }
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              vendor.status === 'ACTIVE'
                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            title="Delete Vendor"
                            onClick={() => setDeletingVendor(vendor)}
                            className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-border-subtle flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing Page <span className="font-semibold">{pagination.currentPage}</span> of{' '}
            <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalItems} total vendors)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-base font-bold text-brand-navy">
                {editingVendor ? 'Edit Vendor Record' : 'Add New Vendor Record'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor / Company Name *
                </label>
                <input
                  type="text"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="e.g. PARV ELECTRONICS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
                {formErrors.vendorName && (
                  <p className="text-danger text-xs mt-1">{formErrors.vendorName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-denim text-white rounded-lg text-xs font-bold hover:bg-brand-navy flex items-center disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-base font-bold text-brand-navy flex items-center">
                <Building2 size={18} className="mr-2 text-brand-denim" />
                Vendor Details ({viewingVendor.vendorCode || 'VEN'})
              </h3>
              <button onClick={() => setViewingVendor(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-500">Vendor Code:</span>{' '}
                <span className="font-mono font-bold text-brand-navy">{viewingVendor.vendorCode || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Vendor / Company Name:</span>
                <p className="font-bold text-slate-900 bg-slate-50 p-2 rounded mt-1 border border-slate-200">
                  {viewingVendor.vendorName}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Status:</span>{' '}
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  viewingVendor.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {viewingVendor.status}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Created By:</span> {viewingVendor.createdBy || 'Admin'}
              </div>
              <div>
                <span className="font-semibold text-slate-500">Created At:</span>{' '}
                {viewingVendor.createdAt ? format(new Date(viewingVendor.createdAt), 'dd/MM/yyyy hh:mm a') : '-'}
              </div>
              <div>
                <span className="font-semibold text-slate-500">Last Updated At:</span>{' '}
                {viewingVendor.updatedAt ? format(new Date(viewingVendor.updatedAt), 'dd/MM/yyyy hh:mm a') : '-'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingVendor(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center text-amber-600 font-bold text-base">
              <AlertTriangle size={20} className="mr-2" /> Deactivate Vendor?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This vendor will no longer be available for selection in new transactions. Existing Gate Pass and Material Inward records will remain unchanged.
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-semibold text-slate-800">
              {deactivatingVendor.vendorName}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeactivatingVendor(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStatus(deactivatingVendor)}
                className="px-4 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center text-red-600 font-bold text-base">
              <Trash2 size={20} className="mr-2" /> Confirm Delete
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this vendor record? This operation is guarded and will fail if the vendor is referenced in any existing Gate Pass or Material Inward documents.
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-semibold text-slate-800">
              {deletingVendor.vendorName}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingVendor(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVendor(deletingVendor._id)}
                className="px-4 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Report Preview Modal */}
      {isPdfModalOpen && (
        <MasterDataPreviewModal
          type="vendors"
          title="Vendor Master Report"
          records={pdfRecords}
          filterInfo={{ search, status: statusFilter }}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};

export default VendorMasterPage;
