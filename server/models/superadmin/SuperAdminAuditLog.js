const mongoose = require('mongoose');

const superAdminAuditLogSchema = new mongoose.Schema(
  {
    companyCode: {
      type: String,
      default: 'PLATFORM',
      index: true
    },
    userId: {
      type: String,
      default: null,
      index: true
    },
    userName: {
      type: String,
      default: 'Super Admin'
    },
    userEmail: {
      type: String,
      default: ''
    },
    userRole: {
      type: String,
      default: 'Root Super Admin'
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    module: {
      type: String,
      default: 'PLATFORM',
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

superAdminAuditLogSchema.index({ createdAt: -1 });
superAdminAuditLogSchema.index({ companyCode: 1, createdAt: -1 });

module.exports = superAdminAuditLogSchema;
