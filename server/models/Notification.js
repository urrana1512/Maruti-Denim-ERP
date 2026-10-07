const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null if meant for all company admins
    },
    companyCode: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Gate Pass', 'Returnable', 'Inward', 'Account', 'Security', 'User Management', 'System', 'Platform'],
      default: 'System',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Normal', 'High', 'Critical'],
      default: 'Normal',
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    relatedModule: {
      type: String,
      enum: ['GATE_PASS', 'INWARD', 'RETURNABLE', 'USER', 'AUTH', 'SECURITY', 'SYSTEM', 'PLATFORM'],
      default: 'SYSTEM'
    },
    relatedRecordId: {
      type: String,
      default: ''
    },
    actionUrl: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      default: null
    },
    eventKey: {
      type: String,
      default: null,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ companyCode: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
