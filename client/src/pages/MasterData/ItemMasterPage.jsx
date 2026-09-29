import React, { useState, useEffect, useCallback } from 'react';
import { masterDataService } from '../../services/masterDataService';
import { 
  Plus, Search, Filter, Upload, Edit, Trash2, Power, Eye, 
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, AlertTriangle, X, FileText,
  FileSpreadsheet, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import MasterDataPreviewModal from '../../components/master-data/MasterDataPreviewModal';

const CONTROLLED_UOMS = [
  'Nos', 'Pcs', 'Kg', 'Gram', 'Mtr', 'Centimeter', 'Ltr', 'Millilitre', 'Box', 'Set', 'Pair', 'Roll', 'Bundle', 'Ton'
];

const ItemMasterPage = () => {
  const [items, setItems] = useState([]);
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
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ description: '', um: 'Nos', status: 'ACTIVE' });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [viewingItem, setViewingItem] = useState(null);
  const [deactivatingItem, setDeactivatingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getItems({
        search,
        status: statusFilter,
        page,
        limit
      });
      if (res.success) {
        setItems(res.data || []);
        setPagination(res.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 });
      }
    } catch (err) {
      toast.error('Unable to load item master data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenPdfPreview = async () => {
    try {
      setLoadingPdf(true);
      toast.loading('Preparing Item Master PDF Report...', { id: 'item-pdf-toast' });
      const res = await masterDataService.getItems({
        search,
        status: statusFilter,
        page: 1,
        limit: 5000 // Get all for PDF preview
      });
      if (res.success) {
        setPdfRecords(res.data || []);
        setIsPdfModalOpen(true);
        toast.dismiss('item-pdf-toast');
      }
    } catch (err) {
      toast.error('Failed to load records for PDF preview.', { id: 'item-pdf-toast' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExportExcel = () => {
    toast.info('Generating Excel file download...');
    masterDataService.exportItemsExcel({ search, status: statusFilter });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ description: '', um: 'Nos', status: 'ACTIVE' });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ description: item.description, um: item.um || 'Nos', status: item.status || 'ACTIVE' });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.description.trim()) {
      errs.description = 'Item description is required.';
    }
    if (!formData.um.trim()) {
      errs.um = 'Unit of measurement is required.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      if (editingItem) {
        const res = await masterDataService.updateItem(editingItem._id, formData);
        if (res.success) {
          toast.success(res.message || 'Item description updated successfully.');
          setIsFormModalOpen(false);
          fetchItems();
        }
      } else {
        const res = await masterDataService.createItem(formData);
        if (res.success) {
          toast.success(res.message || 'Item description created successfully.');
          setIsFormModalOpen(false);
          fetchItems();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save item description.';
      setFormErrors(prev => ({ ...prev, description: msg }));
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await masterDataService.updateItemStatus(item._id, newStatus);
      if (res.success) {
        toast.success(`Item ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`);
        fetchItems();
      }
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setDeactivatingItem(null);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const res = await masterDataService.deleteItem(id);
      if (res.success) {
        toast.success('Item description deleted successfully.');
        fetchItems();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'This item cannot be deleted because it is already used in existing transactions. You can deactivate it instead.';
      toast.error(msg);
    } finally {
      setDeletingItem(null);
    }
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) {
      toast.error('Please enter CSV or JSON item data.');
      return;
    }

    let parsedItems = [];
    try {
      if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
        parsedItems = JSON.parse(importText);
        if (!Array.isArray(parsedItems)) parsedItems = [parsedItems];
      } else {
        // CSV line by line
        const lines = importText.split('\n').filter(l => l.trim());
        parsedItems = lines.map(line => {
          const parts = line.split(',');
          return {
            description: parts[0]?.trim() || '',
            um: parts[1]?.trim() || 'Nos'
          };
        });
      }
    } catch (err) {
      toast.error('Invalid format. Please check JSON or CSV syntax.');
      return;
    }

    try {
      setIsImporting(true);
      const res = await masterDataService.importItems(parsedItems);
      if (res.success) {
        toast.success('Bulk import completed.');
        setImportSummary(res.summary);
        fetchItems();
      }
    } catch (err) {
      toast.error('Failed to process bulk import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Item Description Master</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Manage standardized material and item descriptions used throughout the Gate Pass and Material Inward system.
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
            onClick={() => {
              setImportText('');
              setImportSummary(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            <Upload size={16} className="mr-1.5 text-slate-500" /> Import
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center px-4 py-2 bg-brand-denim hover:bg-brand-navy text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-1.5" /> Add Item Description
          </button>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-surface-card rounded-lg border border-border-subtle p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, code, or UM..."
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
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3 w-14 text-center">Sr.</th>
                <th className="p-3 w-28">Item Code</th>
                <th className="p-3 min-w-[240px]">Item Description</th>
                <th className="p-3 w-24">UM</th>
                <th className="p-3 w-28 text-center">Status</th>
                <th className="p-3 w-36">Created By</th>
                <th className="p-3 w-36">Created Date</th>
                <th className="p-3 w-36 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand-denim" />
                    Loading master records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No item description records found matching your filters.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const srNo = (pagination.currentPage - 1) * limit + idx + 1;
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-medium text-xs">{srNo}</td>
                      <td className="p-3 font-mono text-xs font-semibold text-brand-navy">{item.itemCode || '-'}</td>
                      <td className="p-3 font-medium text-slate-900">{item.description}</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold border border-slate-200">
                          {item.um}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {item.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-600">{item.createdBy || 'Admin'}</td>
                      <td className="p-3 text-xs text-slate-500">
                        {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="View Details"
                            onClick={() => setViewingItem(item)}
                            className="p-1.5 text-slate-400 hover:text-brand-denim hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            title="Edit Item"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            title={item.status === 'ACTIVE' ? 'Deactivate Item' : 'Activate Item'}
                            onClick={() => {
                              if (item.status === 'ACTIVE') {
                                setDeactivatingItem(item);
                              } else {
                                handleToggleStatus(item);
                              }
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              item.status === 'ACTIVE'
                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            title="Delete Item"
                            onClick={() => setDeletingItem(item)}
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
            <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalItems} total items)
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
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-base font-bold text-brand-navy">
                {editingItem ? 'Edit Item Description' : 'Add New Item Description'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Description *
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 5.5 KW X 7.5 HP X 2900 RPM MOTOR REWINDING"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
                {formErrors.description && (
                  <p className="text-danger text-xs mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement (UM) *
                  </label>
                  <select
                    value={formData.um}
                    onChange={(e) => setFormData({ ...formData, um: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
                  >
                    {CONTROLLED_UOMS.map(uom => (
                      <option key={uom} value={uom}>{uom}</option>
                    ))}
                  </select>
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
                  {editingItem ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-base font-bold text-brand-navy flex items-center">
                <FileText size={18} className="mr-2 text-brand-denim" />
                Item Details ({viewingItem.itemCode || 'ITEM'})
              </h3>
              <button onClick={() => setViewingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-500">Item Code:</span>{' '}
                <span className="font-mono font-bold text-brand-navy">{viewingItem.itemCode || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Description:</span>
                <p className="font-medium text-slate-900 bg-slate-50 p-2 rounded mt-1 border border-slate-200">
                  {viewingItem.description}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Unit of Measurement (UM):</span>{' '}
                <span className="font-bold">{viewingItem.um}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Status:</span>{' '}
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  viewingItem.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {viewingItem.status}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Created By:</span> {viewingItem.createdBy || 'Admin'}
              </div>
              <div>
                <span className="font-semibold text-slate-500">Created At:</span>{' '}
                {viewingItem.createdAt ? format(new Date(viewingItem.createdAt), 'dd/MM/yyyy hh:mm a') : '-'}
              </div>
              <div>
                <span className="font-semibold text-slate-500">Last Updated At:</span>{' '}
                {viewingItem.updatedAt ? format(new Date(viewingItem.updatedAt), 'dd/MM/yyyy hh:mm a') : '-'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center text-amber-600 font-bold text-base">
              <AlertTriangle size={20} className="mr-2" /> Deactivate Item?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This item will no longer be available for selection in new transactions. Existing Gate Pass and Material Inward records will remain unchanged.
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-semibold text-slate-800">
              {deactivatingItem.description} ({deactivatingItem.um})
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeactivatingItem(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStatus(deactivatingItem)}
                className="px-4 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center text-red-600 font-bold text-base">
              <Trash2 size={20} className="mr-2" /> Confirm Delete
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this master item record? This operation is guarded and will fail if the item is referenced in any existing Gate Pass or Material Inward documents.
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-semibold text-slate-800">
              {deletingItem.description} ({deletingItem.um})
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deletingItem._id)}
                className="px-4 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-base font-bold text-brand-navy flex items-center">
                <Upload size={18} className="mr-2 text-brand-denim" />
                Import Item Master Data
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste JSON array or CSV format (one item per line: <code>Description, UM</code>). Duplicate items will be skipped automatically.
            </p>

            <textarea
              rows="8"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Example CSV:\nAC DRIVE 5.5 KW, Nos\nCOPPER LUG 25SQ.MM, Nos\n\nOr JSON array:\n[\n  { "description": "AC DRIVE 5.5 KW", "uom": "Nos" }\n]`}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-denim"
            />

            {importSummary && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold">Import Processing Summary:</p>
                <p>Total Items Provided: {importSummary.totalProvided}</p>
                <p className="text-emerald-700 font-semibold">✓ Inserted: {importSummary.inserted}</p>
                <p className="text-slate-600">Skipped (already exist): {importSummary.skipped}</p>
                <p className="text-amber-700">Duplicates in file: {importSummary.duplicatesInFile}</p>
                {importSummary.rejectedCount > 0 && (
                  <p className="text-red-600 font-semibold">Rejected: {importSummary.rejectedCount}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleBulkImport}
                className="px-5 py-2 bg-brand-denim text-white rounded-lg text-xs font-bold hover:bg-brand-navy flex items-center disabled:opacity-50"
              >
                {isImporting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                Process Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Report Preview Modal */}
      {isPdfModalOpen && (
        <MasterDataPreviewModal
          type="items"
          title="Item Description Master Report"
          records={pdfRecords}
          filterInfo={{ search, status: statusFilter }}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ItemMasterPage;
