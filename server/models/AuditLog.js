const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userName: {
      type: String,
      default: 'System'
    },
    userEmail: {
      type: String,
      default: ''
    },
    userRole: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true
    },
    module: {
      type: String,
      enum: ['AUTH', 'USER', 'ROLE', 'GATE_PASS', 'MATERIAL_INWARD', 'MASTER_DATA', 'SYSTEM'],
      default: 'SYSTEM'
    },
    targetId: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
