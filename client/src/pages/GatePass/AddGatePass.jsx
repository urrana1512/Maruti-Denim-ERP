import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Plus, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { gatePassService } from '../../services/gatePassService';
import GatePassPreviewModal from '../../components/gate-pass/GatePassPreviewModal';

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

const AddGatePass = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdData, setCreatedData] = useState(null);
  
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(gatePassSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      companyName: '',
      passType: 'Returnable',
      items: [{ description: '', category: 'On Cost Repair (OCR)', quantity: 1, remarks: '' }]
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
      
      const res = await gatePassService.create(payload);
      if (res.success) {
        toast.success(`Gate Pass ${res.data.gatePassNumber} created successfully.`);
        setCreatedData(res.data);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Unable to create gate pass. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Create Gate Pass</h1>
          <p className="text-slate-500 text-sm mt-1">Create and issue a new material gate pass.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Gate Pass Info */}
          <div className="bg-surface-card rounded-lg border border-border-subtle p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand-navy mb-4 border-b border-border-subtle pb-2 flex items-center">
              <FileText size={18} className="mr-2 text-brand-denim" />
              Gate Pass Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gate Pass Number</label>
                <input
                  type="text"
                  disabled
                  placeholder="Auto-generated"
                  className="w-full px-3 py-2 bg-slate-100 border border-border-subtle rounded-md text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
                {errors.date && <p className="text-danger text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">M/s. / Company Name *</label>
                <input
                  type="text"
                  placeholder="Enter company/vendor name"
                  {...register('companyName')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
                {errors.companyName && <p className="text-danger text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pass Type *</label>
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
          <div className="bg-surface-card rounded-lg border border-border-subtle p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-2">
              <h2 className="text-base font-semibold text-brand-navy">Material Items</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bg border-y border-border-subtle">
                    <th className="p-3 text-xs font-semibold text-slate-600 w-12 text-center">Sr.</th>
                    <th className="p-3 text-xs font-semibold text-slate-600">Description *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-56">Category *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-28">Quantity *</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-1/4">Remarks</th>
                    <th className="p-3 text-xs font-semibold text-slate-600 w-16 text-center">Act</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => (
                    <tr key={item.id} className="border-b border-border-subtle">
                      <td className="p-2 text-sm text-center text-slate-500">{index + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          {...register(`items.${index}.description`)}
                          placeholder="Item description"
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                        {errors.items?.[index]?.description && <p className="text-danger text-xs mt-1">{errors.items[index].description.message}</p>}
                      </td>
                      <td className="p-2">
                        <select
                          {...register(`items.${index}.category`)}
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim bg-white"
                        >
                          <option value="On Cost Repair (OCR)">On Cost Repair (OCR)</option>
                          <option value="Free Of Cost Repair (FOC)">Free Of Cost Repair (FOC)</option>
                          <option value="Sample">Sample</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.items?.[index]?.category && <p className="text-danger text-xs mt-1">{errors.items[index].category.message}</p>}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          {...register(`items.${index}.quantity`)}
                          className="w-full px-3 py-2 border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                        {errors.items?.[index]?.quantity && <p className="text-danger text-xs mt-1">{errors.items[index].quantity.message}</p>}
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
                          className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {errors.items?.root && <p className="text-danger text-sm mt-2">{errors.items.root.message}</p>}
            </div>
            
            <button
              type="button"
              onClick={() => append({ description: '', category: 'On Cost Repair (OCR)', quantity: 1, remarks: '' })}
              className="mt-4 flex items-center text-sm font-medium text-brand-denim hover:text-brand-navy"
            >
              <Plus size={16} className="mr-1" /> Add Item
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/gate-pass/manage')}
              className="px-4 py-2 border border-border-subtle text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-denim text-white rounded-md text-sm font-medium hover:bg-brand-navy transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Gate Pass'}
            </button>
          </div>
        </form>
      </div>

      {createdData && (
        <GatePassPreviewModal
          gatePass={createdData}
          onClose={() => {
            setCreatedData(null);
            navigate('/gate-pass/manage');
          }}
        />
      )}
    </>
  );
};

export default AddGatePass;
