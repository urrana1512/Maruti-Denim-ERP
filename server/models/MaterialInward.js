const mongoose = require('mongoose');

const inwardItemSchema = new mongoose.Schema({
  gatePassItemId: { type: mongoose.Schema.Types.ObjectId },
  serialNumber: { type: Number },
  description: { type: String, required: true },
  originalQuantity: { type: Number, required: true },
  previouslyReceivedQuantity: { type: Number, default: 0 },
  pendingQuantityBefore: { type: Number, required: true },
  receivedQuantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'Nos' },
  rate: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  gstType: { type: String, enum: ['CGST_SGST', 'IGST', 'NONE'], default: 'CGST_SGST' },
  gstPercentage: { type: Number, default: 18 },
  cgstPercentage: { type: Number, default: 9 },
  sgstPercentage: { type: Number, default: 9 },
  igstPercentage: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  inwardDate: { type: Date },
  inwardNumber: { type: String },
  challanInvoiceNumber: { type: String },
  gateEntryNumber: { type: String },
  remarks: { type: String, default: '' },
});

const materialInwardSchema = new mongoose.Schema(
  {
    inwardNumber: { type: String, required: true, unique: true }, // MI-YYYY-XXXX
    gatePassId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', required: true },
    gatePassNumber: { type: String, required: true },
    gateEntryNumber: { type: String, required: true },
    inwardDate: { type: Date, required: true },
    documentType: { type: String, default: 'Challan' },
    challanInvoiceNumber: { type: String, required: true },
    partyName: { type: String, required: true },
    items: [inwardItemSchema],
    subtotal: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    totalGst: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

materialInwardSchema.index({ inwardDate: -1 });
materialInwardSchema.index({ gatePassId: 1 });
materialInwardSchema.index({ gatePassNumber: 1 });
materialInwardSchema.index({ partyName: 1 });
materialInwardSchema.index({ 'items.description': 1 });

module.exports = mongoose.model('MaterialInward', materialInwardSchema);
