import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Plus, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { gatePassService } from '../../services/gatePassService';
import GatePassPreviewModal from '../../components/gate-pass/GatePassPreviewModal';
import ItemDescriptionSelect from '../../components/common/ItemDescriptionSelect';

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

const AddGatePass = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdData, setCreatedData] = useState(null);
  const [autoGatePassNumber, setAutoGatePassNumber] = useState('');

  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const res = await gatePassService.getNextNumber();
        if (res.success && res.gatePassNumber) {
          setAutoGatePassNumber(res.gatePassNumber);
        }
      } catch (err) {
        console.warn('Failed to fetch next gate pass number:', err);
      }
    };
    fetchNextNumber();
  }, []);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(gatePassSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      companyName: '',
      passType: 'Returnable',
      purpose: '',
      vehicleNumber: '',
      driverName: '',
      department: '',
      items: [{ description: '', category: 'On Cost Repair (OCR)', quantity: 1, uom: 'Nos', returnable: true, remarks: '' }]
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
        gatePassNumber: autoGatePassNumber,
        items: data.items.map((item, index) => ({ 
          ...item, 
          serialNumber: index + 1,
          returnable: isReturnablePass ? item.returnable : false
        }))
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
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 min-w-0 max-w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Create Gate Pass</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Create and issue a new material gate pass.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
          {/* Gate Pass Info */}
          <div className="bg-surface-card rounded-lg border border-border-subtle p-4 sm:p-6 shadow-sm min-w-0 max-w-full">
            <h2 className="text-sm sm:text-base font-semibold text-brand-navy mb-4 border-b border-border-subtle pb-2 flex items-center">
              <FileText size={18} className="mr-2 text-brand-denim flex-shrink-0" />
              Gate Pass Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gate Pass Number</label>
                <input
                  type="text"
                  disabled
                  value={autoGatePassNumber || 'Loading...'}
                  className="w-full px-3 py-2 bg-slate-100 border border-border-subtle rounded-md text-brand-navy font-bold text-sm cursor-not-allowed"
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

              {/* Extended fields */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Repair / Testing"
                  {...register('purpose')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  placeholder="e.g. GJ-01-AB-1234"
                  {...register('vehicleNumber')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  placeholder="Driver name"
                  {...register('driverName')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Maintenance / Spinning"
                  {...register('department')}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-surface-card rounded-lg border border-border-subtle p-3 sm:p-6 shadow-sm min-w-0 max-w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border-subtle pb-2">
              <h2 className="text-sm sm:text-base font-semibold text-brand-navy">Material Items</h2>
              <span className="text-xs text-slate-500 font-medium">Add all items being sent out</span>
            </div>

            {/* --- DESKTOP TABLE VIEW (md:block) --- */}
            <div className="hidden md:block overflow-x-auto max-w-full rounded-lg border border-border-subtle min-h-[360px] pb-32">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-bg border-b border-border-subtle">
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
                        {errors.items?.[index]?.category && (
                          <p className="text-danger text-xs mt-1">{errors.items[index].category.message}</p>
                        )}
                      </td>
                      <td className="p-2 w-28">
                        <input
                          type="number"
                          step="any"
                          {...register(`items.${index}.quantity`)}
                          className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-danger text-xs mt-1">{errors.items[index].quantity.message}</p>
                        )}
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
                          className="w-full px-3 py-2 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-denim"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      {errors.items?.[index]?.category && (
                        <p className="text-danger text-xs mt-1">{errors.items[index].category.message}</p>
                      )}
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
                        {errors.items?.[index]?.quantity && (
                          <p className="text-danger text-xs mt-1">{errors.items[index].quantity.message}</p>
                        )}
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

            {errors.items?.root && <p className="text-danger text-xs mt-2">{errors.items.root.message}</p>}
            
            <button
              type="button"
              onClick={() => append({ description: '', category: 'On Cost Repair (OCR)', quantity: 1, uom: 'Nos', returnable: true, remarks: '' })}
              className="mt-4 flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-denim rounded-lg text-xs font-bold transition-colors"
            >
              <Plus size={16} className="mr-1.5" /> Add Material Item
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
