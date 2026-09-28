const mongoose = require('mongoose');

const masterDataAuditSchema = new mongoose.Schema(
  {
    entityType: { 
      type: String, 
      enum: ['ITEM', 'VENDOR'], 
      required: true 
    },
    entityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    action: { 
      type: String, 
      enum: ['CREATED', 'UPDATED', 'ACTIVATED', 'DEACTIVATED', 'DELETED', 'IMPORTED'], 
      required: true 
    },
    performedBy: { 
      type: String, 
      default: 'Admin' 
    },
    performedAt: { 
      type: Date, 
      default: Date.now 
    },
    oldValue: { 
      type: mongoose.Schema.Types.Mixed, 
      default: null 
    },
    newValue: { 
      type: mongoose.Schema.Types.Mixed, 
      default: null 
    },
    reason: { 
      type: String, 
      default: '' 
    }
  },
  { timestamps: true }
);

masterDataAuditSchema.index({ entityType: 1, entityId: 1 });
masterDataAuditSchema.index({ performedAt: -1 });

module.exports = mongoose.model('MasterDataAudit', masterDataAuditSchema);
