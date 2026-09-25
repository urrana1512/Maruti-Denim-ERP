const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  serialNumber: { type: Number },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['On Cost Repair (OCR)', 'Free Of Cost Repair (FOC)', 'Sample', 'Other'],
    default: 'On Cost Repair (OCR)',
    required: true 
  },
  quantity: { type: Number, required: true, min: 0.01 },
  uom: { type: String, default: 'Nos' },
  returnable: { type: Boolean, default: true },
  receivedQuantity: { type: Number, default: 0 },
  itemReturnStatus: { 
    type: String, 
    enum: ['PENDING', 'PARTIALLY_RETURNED', 'FULLY_RETURNED'], 
    default: 'PENDING' 
  },
  remarks: { type: String, default: '' },
});

const gatePassSchema = new mongoose.Schema(
  {
    gatePassNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    companyName: { type: String, required: true },
    passType: { 
      type: String, 
      enum: ['Returnable', 'Non-Returnable'], 
      default: 'Returnable', 
      required: true 
    },
    gatePassType: {
      type: String,
      enum: ['Returnable', 'Non-Returnable', 'Mixed'],
      default: 'Returnable'
    },
    purpose: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    driverName: { type: String, default: '' },
    department: { type: String, default: '' },
    items: [itemSchema],
    status: { type: String, enum: ['active', 'cancelled', 'closed'], default: 'active' },
    gatePassStatus: { type: String, enum: ['OPEN', 'CLOSED', 'CANCELLED'], default: 'OPEN' },
    returnStatus: { 
      type: String, 
      enum: ['NOT_APPLICABLE', 'PENDING', 'PARTIALLY_RETURNED', 'FULLY_RETURNED'], 
      default: 'PENDING' 
    },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

gatePassSchema.index({ date: -1 });
gatePassSchema.index({ companyName: 1 });
gatePassSchema.index({ gatePassStatus: 1 });
gatePassSchema.index({ returnStatus: 1 });
gatePassSchema.index({ passType: 1 });
gatePassSchema.index({ 'items.description': 1 });

module.exports = mongoose.model('GatePass', gatePassSchema);
