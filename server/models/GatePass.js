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
    items: [itemSchema],
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GatePass', gatePassSchema);
