import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { gatePassService } from '../../services/gatePassService';

const gatePassSchema = z.object({
  date: z.string().nonempty('Date is required'),
  companyName: z.string().min(2, 'Company name is required'),
  passType: z.enum(['Returnable', 'Non-Returnable']),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    category: z.string().nonempty('Category is required'),
    quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
    remarks: z.string().optional(),
  })).min(1, 'At least one item is required').max(50, 'Max 50 items allowed')
});

const EditGatePassModal = ({ gatePass, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(gatePassSchema),
    defaultValues: {
      date: gatePass?.date ? format(new Date(gatePass.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      companyName: gatePass?.companyName || '',
      passType: gatePass?.passType || 'Returnable',
      items: gatePass?.items?.length > 0 
        ? gatePass.items.map(item => ({
            description: item.description || '',
            category: item.category || 'On Cost Repair (OCR)',
            quantity: item.quantity || 1,
            remarks: item.remarks || ''
          }))
        : [{ description: '', category: 'On Cost Repair (OCR)', quantity: 1, remarks: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        items: data.items.map((item, index) => ({ ...item, serialNumber: index + 1 }))
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Edit2 className="text-brand-denim mr-2" size={20} />
            <h3 className="text-lg font-bold text-brand-navy">Edit Gate Pass — {gatePass.gatePassNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md">
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Gate Pass Info */}
          <div className="bg-surface-bg rounded-lg border border-border-subtle p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white border border-border-subtle rounded-lg p-4">
            <h4 className="text-sm font-semibold text-brand-navy mb-3">Material Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bg border-y border-border-subtle">
                    <th className="p-2 text-xs font-semibold text-slate-600 w-12 text-center">Sr.</th>
                    <th className="p-2 text-xs font-semibold text-slate-600">Description *</th>
                    <th className="p-2 text-xs font-semibold text-slate-600 w-48">Category *</th>
                    <th className="p-2 text-xs font-semibold text-slate-600 w-24">Quantity *</th>
                    <th className="p-2 text-xs font-semibold text-slate-600 w-1/4">Remarks</th>
                    <th className="p-2 text-xs font-semibold text-slate-600 w-12 text-center">Act</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => (
                    <tr key={item.id} className="border-b border-border-subtle">
                      <td className="p-2 text-xs text-center text-slate-500">{index + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          {...register(`items.${index}.description`)}
                          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                        {errors.items?.[index]?.description && <p className="text-danger text-xs mt-1">{errors.items[index].description.message}</p>}
                      </td>
                      <td className="p-2">
                        <select
                          {...register(`items.${index}.category`)}
                          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
                        >
                          <option value="On Cost Repair (OCR)">On Cost Repair (OCR)</option>
                          <option value="Free Of Cost Repair (FOC)">Free Of Cost Repair (FOC)</option>
                          <option value="Sample">Sample</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          {...register(`items.${index}.quantity`)}
                          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          {...register(`items.${index}.remarks`)}
                          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="p-1 text-slate-400 hover:text-danger rounded disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => append({ description: '', category: 'On Cost Repair (OCR)', quantity: 1, remarks: '' })}
              className="mt-3 flex items-center text-xs font-semibold text-brand-denim hover:text-brand-navy"
            >
              <Plus size={14} className="mr-1" /> Add Row
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
