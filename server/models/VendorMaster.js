const mongoose = require('mongoose');

const vendorMasterSchema = new mongoose.Schema(
  {
    vendorCode: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    vendorName: { 
      type: String, 
      required: true,
      trim: true 
    },
    vendorNameNormalized: { 
      type: String, 
      required: true,
      unique: true,
      trim: true,
      lowercase: true 
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    city: {
      type: String,
      default: '',
      trim: true
    },
    pincode: {
      type: String,
      default: '',
      trim: true
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
      uppercase: true
    },
    panCard: {
      type: String,
      default: '',
      trim: true,
      uppercase: true
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE'], 
      default: 'ACTIVE' 
    },
    createdBy: { 
      type: String, 
      default: 'Admin' 
    },
    updatedBy: { 
      type: String, 
      default: 'Admin' 
    }
  },
  { timestamps: true }
);

vendorMasterSchema.index({ status: 1 });
vendorMasterSchema.index({ vendorNameNormalized: 'text' });

module.exports = mongoose.model('VendorMaster', vendorMasterSchema);
