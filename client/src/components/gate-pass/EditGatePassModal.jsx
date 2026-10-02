import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, Trash2, Plus, Edit2, Building2, Lock, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';
import VendorSelect from '../common/VendorSelect';
import { useAuth } from '../../context/AuthContext';

const gatePassSchema = z.object({
  date: z.string().nonempty('Date is required'),
  vendorId: z.string().optional(),
  companyName: z.string().min(2, 'Company name is required'),
  vendorAddress: z.string().optional(),
  vendorCity: z.string().optional(),
  vendorPincode: z.string().optional(),
  vendorGstin: z.string().optional(),
  vendorPanCard: z.string().optional(),
  passType: z.enum(['Returnable', 'Non-Returnable']),
  purpose: z.string().optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  department: z.string().optional(),
  costCentre: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    category: z.string().nonempty('Category is required'),
    quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
    uom: z.string().default('Nos'),
    returnable: z.boolean().default(true),
    costCentre: z.string().optional(),
    remarks: z.string().optional(),
  })).min(1, 'At least one item is required').max(50, 'Max 50 items allowed')
});

const normalizeCategory = (cat) => {
  if (!cat) return 'On Cost Repair (OCR)';
  const str = String(cat).trim();
  if (str === 'FOC' || str.toLowerCase().includes('free of cost')) {
    return 'Free Of Cost Repair (FOC)';
  }
  if (str === 'OCR' || str.toLowerCase().includes('on cost')) {
    return 'On Cost Repair (OCR)';
  }
  if (str.toLowerCase().includes('sample')) {
    return 'Sample';
  }
  if (str.toLowerCase().includes('other')) {
    return 'Other';
  }
  return str;
};

const isCategoryReturnable = (category) => {
  if (!category) return true;
  const cat = String(category).trim().toLowerCase();
  return cat.includes('ocr') || cat.includes('on cost') || cat.includes('foc') || cat.includes('free of cost') || cat.includes('sample');
};

const EditGatePassModal = ({ gatePass, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockState, setLockState] = useState(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(gatePassSchema),
    defaultValues: {
      date: gatePass?.date ? format(new Date(gatePass.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      companyName: gatePass?.companyName || '',
      vendorAddress: gatePass?.vendorAddress || gatePass?.vendorId?.address || '',
      vendorCity: gatePass?.vendorCity || gatePass?.vendorId?.city || '',
      vendorPincode: gatePass?.vendorPincode || gatePass?.vendorId?.pincode || '',
      vendorGstin: gatePass?.vendorGstin || gatePass?.vendorId?.gstin || '',
      vendorPanCard: gatePass?.vendorPanCard || gatePass?.vendorId?.panCard || '',
      passType: gatePass?.passType || 'Returnable',
      purpose: gatePass?.purpose || '',
      vehicleNumber: gatePass?.vehicleNumber || '',
      driverName: gatePass?.driverName || '',
      department: gatePass?.department || '',
      costCentre: gatePass?.costCentre || '',
      items: gatePass?.items?.length > 0 
        ? gatePass.items.map(item => ({
            description: item.description || '',
            category: normalizeCategory(item.category),
            quantity: item.quantity || 1,
            uom: item.uom || 'Nos',
            returnable: item.returnable !== false,
            costCentre: item.costCentre || gatePass?.costCentre || '',
            remarks: item.remarks || ''
          }))
        : [{ description: '', category: 'On Cost Repair (OCR)', quantity: 1, uom: 'Nos', returnable: true, costCentre: gatePass?.costCentre || '', remarks: '' }]
    }
  });

  const passType = watch('passType');
  const vendorAddress = watch('vendorAddress');
  const vendorCity = watch('vendorCity');
  const vendorPincode = watch('vendorPincode');
  const vendorGstin = watch('vendorGstin');
  const vendorPanCard = watch('vendorPanCard');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  useEffect(() => {
    const fetchLock = async () => {
      if (gatePass?._id) {
        try {
          const res = await gatePassService.getLockState(gatePass._id);
          if (res.success) {
            setLockState(res);
          }
        } catch (err) {
          console.warn('Unable to fetch gate pass lock state:', err);
        }
      }
    };
    fetchLock();
  }, [gatePass?._id]);

  const isApproved = gatePass?.approvalStatus === 'Approved';
  const isCancelled = gatePass?.gatePassStatus === 'CANCELLED';
  const isLocked = Boolean(lockState?.gatePassLocked) || isApproved || isCancelled;

  const renderItemBadge = (idx) => {
    const itemLock = lockState?.items?.[idx];
    if (isApproved) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle size={10} className="mr-1 text-emerald-700" /> APPROVED — READ ONLY
        </span>
      );
    }
    if (isCancelled) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
          <Ban size={10} className="mr-1 text-red-700" /> CANCELLED — READ ONLY
        </span>
      );
    }
    if (!itemLock || (!itemLock.locked && !isLocked)) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          NOT PROCESSED — EDITABLE
        </span>
      );
    }
    if (itemLock.reason === 'FULLY_RETURNED') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Lock size={10} className="mr-1 text-emerald-700" /> LOCKED — RETURN PROCESSED
        </span>
      );
    }
    if (itemLock.reason === 'PARTIALLY_RETURNED') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Lock size={10} className="mr-1 text-amber-700" /> PARTIALLY RETURNED — LOCKED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <Lock size={10} className="mr-1 text-slate-600" /> LOCKED ({itemLock.reason || 'TRANSACTION LOCKED'})
      </span>
    );
  };

  const onSubmit = async (data) => {
    if (isApproved || isCancelled) {
      toast.error('Approved or Cancelled Gate Passes cannot be edited.');
      return;
    }
    try {
      setIsSubmitting(true);
      const isReturnablePass = data.passType === 'Returnable';
      const payload = {
        ...data,
        updatedBy: user?.name || user?.username || 'Authorized Staff',
        updatedByDesignation: user?.designation || user?.roleName || '',
        items: data.items.map((item, index) => ({ 
          ...item, 
          serialNumber: index + 1,
          returnable: isReturnablePass || isCategoryReturnable(item.category) ? true : Boolean(item.returnable)
        }))
      };
      
      const res = await gatePassService.update(gatePass._id, payload);
      if (res.success) {
        toast.success(`Gate Pass ${gatePass.gatePassNumber} updated successfully.`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Unable to update gate pass.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center min-w-0">
            <Edit2 className="text-brand-denim mr-2 flex-shrink-0" size={20} />
            <h3 className="text-base sm:text-lg font-bold text-brand-navy truncate">
              {isApproved || isCancelled ? 'View Gate Pass' : 'Edit Gate Pass'} — {gatePass.gatePassNumber}
            </h3>
            {isApproved && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle size={12} className="mr-1 text-emerald-700" /> APPROVED
              </span>
            )}
            {isCancelled && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                <Ban size={12} className="mr-1 text-red-700" /> CANCELLED
              </span>
            )}
            {!isApproved && !isCancelled && isLocked && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Lock size={12} className="mr-1 text-amber-700" /> LOCKED
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md ml-2 flex-shrink-0 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-w-0">
          {/* Status Lock Banners */}
          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 flex items-center gap-3 text-emerald-900 shadow-sm">
              <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Approved Gate Pass — Read-Only Mode
                </h4>
                <p className="text-xs mt-0.5 text-emerald-800">
                  This Gate Pass has been approved. Approved Gate Passes cannot be edited. Only viewing and PDF downloads with the APPROVED stamp are permitted.
                </p>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-center gap-3 text-red-900 shadow-sm">
              <Ban size={18} className="text-red-600 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                  Cancelled Gate Pass — Read-Only Mode
                </h4>
                <p className="text-xs mt-0.5 text-red-800">
                  This Gate Pass has been cancelled. Reason: <strong>{gatePass.cancelReason || 'N/A'}</strong>
                </p>
              </div>
            </div>
          )}

          {!isApproved && !isCancelled && isLocked && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-center gap-3 text-amber-900 shadow-sm">
              <Lock size={18} className="text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Data Integrity Notice — Gate Pass Locked
                </h4>
                <p className="text-xs mt-0.5 text-amber-800">
                  Material Inward has already been processed for this Gate Pass. Transaction-related details are locked to preserve historical data integrity.
                </p>
              </div>
            </div>
          )}



          {/* Gate Pass Info */}
          <div className="bg-surface-bg rounded-lg border border-border-subtle p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gate Pass Number (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={gatePass.gatePassNumber}
                  className="w-full px-3 py-2 bg-slate-200 border border-border-subtle rounded-md text-slate-600 text-sm font-semibold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  disabled={isLocked}
                  title={isLocked ? "Cannot edit date because Material Inward has already been processed." : ""}
                  {...register('date')}
                  className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                />
                {errors.date && <p className="text-danger text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Vendor Name *</label>
                {isLocked ? (
                  <input
                    type="text"
                    disabled
                    value={watch('companyName')}
                    title="Cannot edit vendor name because Material Inward has already been processed."
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm font-bold text-slate-700 cursor-not-allowed"
                  />
                ) : (
                  <VendorSelect
                    value={watch('companyName')}
                    onChange={(val) => setValue('companyName', val, { shouldValidate: true })}
                    onSelectVendor={(vendor) => {
                      if (vendor) {
                        setValue('vendorId', vendor._id || '');
                        setValue('vendorAddress', vendor.address || '');
                        setValue('vendorCity', vendor.city || '');
                        setValue('vendorPincode', vendor.pincode || '');
                        setValue('vendorGstin', vendor.gstin || '');
                        setValue('vendorPanCard', vendor.panCard || '');
                      }
                    }}
                    error={errors.companyName?.message}
                  />
                )}
                {errors.companyName && <p className="text-danger text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pass Type *</label>
                <select
                  disabled={isLocked}
                  title={isLocked ? "Cannot edit pass type because Material Inward has already been processed." : ""}
                  {...register('passType')}
                  className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                >
                  <option value="Returnable">Returnable</option>
                  <option value="Non-Returnable">Non-Returnable</option>
                </select>
                {errors.passType && <p className="text-danger text-xs mt-1">{errors.passType.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Purpose</label>
                <input
                  type="text"
                  disabled={isLocked}
                  title={isLocked ? "Cannot edit purpose because Material Inward has already been processed." : ""}
                  placeholder="e.g. Repair / Testing"
                  {...register('purpose')}
                  className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  disabled={isLocked}
                  title={isLocked ? "Cannot edit vehicle number because Material Inward has already been processed." : ""}
                  placeholder="e.g. GJ-01-AB-1234"
                  {...register('vehicleNumber')}
                  className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Name</label>
                <input
                  type="text"
                  disabled={isLocked}
                  title={isLocked ? "Cannot edit driver name because Material Inward has already been processed." : ""}
                  placeholder="Driver name"
                  {...register('driverName')}
                  className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  disabled={isLocked}
                  title={isLocked ? "Cannot edit department because Material Inward has already been processed." : ""}
                  placeholder="e.g. Maintenance"
                  {...register('department')}
                  className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                />
              </div>
            </div>

            {/* Auto-Fetched Vendor Address & Tax Details Block */}
            <div className="mt-4 bg-blue-50/40 border border-blue-200/80 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2 border-b border-blue-200/60 pb-1.5">
                <span className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center">
                  <Building2 size={14} className="mr-1.5 text-brand-denim flex-shrink-0" />
                  Auto-Fetched Vendor Details (Master Data)
                </span>
                <span className="text-[11px] text-brand-denim font-bold bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">Read-Only</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={vendorAddress || ''}
                    placeholder="No vendor address registered"
                    {...register('vendorAddress')}
                    className="w-full px-3 py-1.5 bg-slate-100/90 border border-slate-300 rounded-md text-xs text-slate-900 font-bold cursor-not-allowed opacity-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={vendorCity || ''}
                    placeholder="No city"
                    {...register('vendorCity')}
                    className="w-full px-3 py-1.5 bg-slate-100/90 border border-slate-300 rounded-md text-xs text-slate-900 font-bold cursor-not-allowed opacity-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={vendorPincode || ''}
                    placeholder="No pincode"
                    {...register('vendorPincode')}
                    className="w-full px-3 py-1.5 bg-slate-100/90 border border-slate-300 rounded-md text-xs text-slate-900 font-bold cursor-not-allowed opacity-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">GSTIN / PAN Card</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={vendorGstin || ''}
                      placeholder="GSTIN"
                      {...register('vendorGstin')}
                      className="w-full px-2 py-1.5 bg-slate-100/90 border border-slate-300 rounded-md text-[11px] font-mono uppercase text-slate-900 font-bold cursor-not-allowed opacity-100 focus:outline-none"
                    />
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={vendorPanCard || ''}
                      placeholder="PAN Card"
                      {...register('vendorPanCard')}
                      className="w-full px-2 py-1.5 bg-slate-100/90 border border-slate-300 rounded-md text-[11px] font-mono uppercase text-slate-900 font-bold cursor-not-allowed opacity-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white border border-border-subtle rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-brand-navy">Material Items</h4>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Add all items being updated</span>
            </div>

            {/* --- SINGLE RESPONSIVE TABLE VIEW --- */}
            <div className="overflow-x-auto min-h-[360px] pb-32">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-surface-bg border-y border-border-subtle">
                    <th className="p-3 text-xs font-semibold text-slate-600 w-12 text-center">Sr.</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 min-w-[240px]">Description & Lock Status *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-48 min-w-[180px]">Category *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-28 min-w-[100px]">Quantity *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-28 min-w-[100px]">UM</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-40 min-w-[140px]">Cost Centre</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 min-w-[180px]">Remarks</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-12 text-center">Act</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => {
                    const itemLock = lockState?.items?.[index];
                    const itemIsLocked = Boolean(itemLock?.locked || isLocked);

                    return (
                      <tr key={item.id} className="border-b border-border-subtle hover:bg-slate-50/50">
                        <td className="p-3 text-sm text-center text-slate-500 font-medium">{index + 1}</td>
                        <td className="p-2 min-w-[240px]">
                          <div className="space-y-1">
                            {renderItemBadge(index)}
                            {itemIsLocked ? (
                              <input
                                type="text"
                                disabled
                                value={watch(`items.${index}.description`)}
                                title="Cannot edit this item because Material Inward has already been processed."
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 bg-slate-100 cursor-not-allowed"
                              />
                            ) : (
                              <ItemDescriptionSelect
                                value={watch(`items.${index}.description`)}
                                onChange={(newDesc) => setValue(`items.${index}.description`, newDesc, { shouldValidate: true })}
                                onSelectUom={(newUom) => setValue(`items.${index}.uom`, newUom, { shouldValidate: true })}
                                error={errors.items?.[index]?.description?.message}
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-2 w-48">
                          <select
                            disabled={itemIsLocked}
                            title={itemIsLocked ? "Cannot edit item category because Material Inward has already been processed." : ""}
                            {...register(`items.${index}.category`)}
                            className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${itemIsLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim font-medium text-slate-800'}`}
                          >
                            <option value="On Cost Repair (OCR)">On Cost Repair (OCR)</option>
                            <option value="Free Of Cost Repair (FOC)">Free Of Cost Repair (FOC)</option>
                            <option value="Sample">Sample</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td className="p-2 w-28">
                          <input
                            type="number"
                            step="any"
                            disabled={itemIsLocked}
                            title={itemIsLocked ? "Cannot edit item quantity because Material Inward has already been processed." : ""}
                            {...register(`items.${index}.quantity`)}
                            className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${itemIsLocked ? 'bg-slate-100 text-slate-500 font-bold cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                          />
                        </td>
                        <td className="p-2 w-28">
                          <select
                            disabled={itemIsLocked}
                            title={itemIsLocked ? "Cannot edit item UOM because Material Inward has already been processed." : ""}
                            {...register(`items.${index}.uom`)}
                            className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${itemIsLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                          >
                            <option value="Nos">Nos</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Kg">Kg</option>
                            <option value="Mtr">Mtr</option>
                            <option value="Roll">Roll</option>
                            <option value="Set">Set</option>
                            <option value="Box">Box</option>
                            <option value="Pair">Pair</option>
                            <option value="Ltr">Ltr</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td className="p-2 w-40">
                          <input
                            type="text"
                            disabled={itemIsLocked}
                            title={itemIsLocked ? "Cannot edit cost centre because Material Inward has already been processed." : ""}
                            {...register(`items.${index}.costCentre`)}
                            placeholder="Cost Centre"
                            className={`w-full px-3 py-2 border border-border-subtle rounded-md text-sm ${itemIsLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-2 focus:ring-brand-denim'}`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            {...register(`items.${index}.remarks`)}
                            placeholder="Optional remarks"
                            className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1 || isLocked || itemIsLocked}
                            title={isLocked || itemIsLocked ? "Cannot delete item row because Material Inward has already been processed." : "Delete Item"}
                            className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded disabled:opacity-40 cursor-not-allowed transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => append({ description: '', category: 'On Cost Repair (OCR)', quantity: 1, uom: 'Nos', returnable: true, costCentre: '', remarks: '' })}
              disabled={isLocked}
              title={isLocked ? "Cannot add new item rows because Material Inward has already been processed." : "Add Material Item"}
              className="mt-4 flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-denim rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} className="mr-1.5" /> Add Material Item
            </button>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-subtle text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50"
            >
              {(isApproved || isCancelled) ? 'Close' : 'Cancel'}
            </button>
            {!(isApproved || isCancelled) && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-brand-denim text-white rounded-md text-sm font-medium hover:bg-brand-navy disabled:opacity-70"
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGatePassModal;
