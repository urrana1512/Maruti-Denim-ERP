const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    companyCode: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
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
      default: 'User'
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    module: {
      type: String,
      enum: ['AUTH', 'USER', 'PROFILE', 'ROLE', 'GATE_PASS', 'MATERIAL_INWARD', 'RETURNABLE', 'MASTER_DATA', 'SECURITY', 'SYSTEM'],
      default: 'SYSTEM',
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    entityType: {
      type: String,
      default: ''
    },
    entityId: {
      type: String,
      default: ''
    },
    targetId: {
      type: String,
      default: ''
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
      index: true
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    previousHash: {
      type: String,
      default: '0'
    },
    hash: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ companyCode: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
