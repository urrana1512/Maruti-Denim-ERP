import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { gatePassService } from '../../services/gatePassService';
import ItemDescriptionSelect from '../common/ItemDescriptionSelect';

const gatePassSchema = z.object({
  date: z.string().nonempty('Date is required'),
  companyName: z.string().min(2, 'Company name is required'),
  passType: z.enum(['Returnable', 'Non-Returnable']),
  purpose: z.string().optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  department: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    category: z.string().nonempty('Category is required'),
    quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
    uom: z.string().default('Nos'),
    returnable: z.boolean().default(true),
    remarks: z.string().optional(),
  })).min(1, 'At least one item is required').max(50, 'Max 50 items allowed')
});

const EditGatePassModal = ({ gatePass, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(gatePassSchema),
    defaultValues: {
      date: gatePass?.date ? format(new Date(gatePass.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      companyName: gatePass?.companyName || '',
      passType: gatePass?.passType || 'Returnable',
      purpose: gatePass?.purpose || '',
      vehicleNumber: gatePass?.vehicleNumber || '',
      driverName: gatePass?.driverName || '',
      department: gatePass?.department || '',
      items: gatePass?.items?.length > 0 
        ? gatePass.items.map(item => ({
            description: item.description || '',
            category: item.category || 'On Cost Repair (OCR)',
            quantity: item.quantity || 1,
            uom: item.uom || 'Nos',
            returnable: item.returnable !== false,
            remarks: item.remarks || ''
          }))
        : [{ description: '', category: 'On Cost Repair (OCR)', quantity: 1, uom: 'Nos', returnable: true, remarks: '' }]
    }
  });

  const passType = watch('passType');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const isReturnablePass = data.passType === 'Returnable';
      const payload = {
        ...data,
        items: data.items.map((item, index) => ({ 
          ...item, 
          serialNumber: index + 1,
          returnable: isReturnablePass ? item.returnable : false
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
            <h3 className="text-base sm:text-lg font-bold text-brand-navy truncate">Edit Gate Pass — {gatePass.gatePassNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md ml-2 flex-shrink-0 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-w-0">
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
                  {...register('date')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
                {errors.date && <p className="text-danger text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                <input
                  type="text"
                  {...register('companyName')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
                {errors.companyName && <p className="text-danger text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pass Type *</label>
                <select
                  {...register('passType')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
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
                  placeholder="e.g. Repair / Testing"
                  {...register('purpose')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  placeholder="e.g. GJ-01-AB-1234"
                  {...register('vehicleNumber')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Name</label>
                <input
                  type="text"
                  placeholder="Driver name"
                  {...register('driverName')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Maintenance"
                  {...register('department')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white border border-border-subtle rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-brand-navy">Material Items</h4>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Add all items being updated</span>
            </div>

            {/* --- DESKTOP TABLE VIEW (md:block) --- */}
            <div className="hidden md:block overflow-x-auto min-h-[360px] pb-32">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-bg border-y border-border-subtle">
                    <th className="p-3 text-xs font-semibold text-slate-600 w-12 text-center">Sr.</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 min-w-[280px]">Description *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-48 min-w-[190px]">Category *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-28 min-w-[100px]">Quantity *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-28 min-w-[100px]">UM</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 min-w-[180px]">Remarks</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-12 text-center">Act</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => (
                    <tr key={item.id} className="border-b border-border-subtle hover:bg-slate-50/50">
                      <td className="p-3 text-sm text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="p-2 min-w-[280px]">
                        <ItemDescriptionSelect
                          value={watch(`items.${index}.description`)}
                          onChange={(newDesc) => setValue(`items.${index}.description`, newDesc, { shouldValidate: true })}
                          onSelectUom={(newUom) => setValue(`items.${index}.uom`, newUom, { shouldValidate: true })}
                          error={errors.items?.[index]?.description?.message}
                        />
                      </td>
                      <td className="p-2 w-48">
                        <select
                          {...register(`items.${index}.category`)}
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
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
                          {...register(`items.${index}.quantity`)}
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <select
                          {...register(`items.${index}.uom`)}
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
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
                      <td className="p-2">
                        <input
                          type="text"
                          {...register(`items.${index}.remarks`)}
                          placeholder="Optional remarks"
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- MOBILE CARDS VIEW (md:hidden) --- */}
            <div className="space-y-4 md:hidden">
              {fields.map((item, index) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <span className="text-xs font-bold text-brand-navy flex items-center">
                      <span className="w-5 h-5 rounded-full bg-brand-navy text-white text-[10px] flex items-center justify-center mr-2">
                        {index + 1}
                      </span>
                      Item #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-40 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description *</label>
                      <ItemDescriptionSelect
                        value={watch(`items.${index}.description`)}
                        onChange={(newDesc) => setValue(`items.${index}.description`, newDesc, { shouldValidate: true })}
                        onSelectUom={(newUom) => setValue(`items.${index}.uom`, newUom, { shouldValidate: true })}
                        error={errors.items?.[index]?.description?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                      <select
                        {...register(`items.${index}.category`)}
                        className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
                      >
                        <option value="On Cost Repair (OCR)">On Cost Repair (OCR)</option>
                        <option value="Free Of Cost Repair (FOC)">Free Of Cost Repair (FOC)</option>
                        <option value="Sample">Sample</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          step="any"
                          {...register(`items.${index}.quantity`)}
                          className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">UM (Unit) *</label>
                        <select
                          {...register(`items.${index}.uom`)}
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
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
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
                      <input
                        type="text"
                        {...register(`items.${index}.remarks`)}
                        placeholder="Optional remarks"
                        className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ description: '', category: 'On Cost Repair (OCR)', quantity: 1, uom: 'Nos', returnable: true, remarks: '' })}
              className="mt-4 flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-denim rounded-lg text-xs font-bold transition-colors"
            >
              <Plus size={16} className="mr-1.5" /> Add Material Item
            </button>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-subtle text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-denim text-white rounded-md text-sm font-medium hover:bg-brand-navy disabled:opacity-70"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGatePassModal;
