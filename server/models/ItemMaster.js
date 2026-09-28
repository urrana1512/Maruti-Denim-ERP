const mongoose = require('mongoose');

const itemMasterSchema = new mongoose.Schema(
  {
    itemCode: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    description: { 
      type: String, 
      required: true,
      trim: true 
    },
    descriptionNormalized: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true 
    },
    um: { 
      type: String, 
      required: true,
      trim: true,
      default: 'Nos'
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

// Compound unique index on descriptionNormalized + um
itemMasterSchema.index({ descriptionNormalized: 1, um: 1 }, { unique: true });
itemMasterSchema.index({ status: 1 });
itemMasterSchema.index({ descriptionNormalized: 'text' });

module.exports = mongoose.model('ItemMaster', itemMasterSchema);
