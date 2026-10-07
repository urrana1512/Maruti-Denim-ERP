const mongoose = require('mongoose');

const superAdminNotificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: String,
      default: null // null if meant for all super admins
    },
    companyCode: {
      type: String,
      default: 'PLATFORM'
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
      enum: ['Platform', 'Security', 'Company', 'System', 'Gate Pass'],
      default: 'Platform',
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
      default: 'PLATFORM'
    },
    relatedRecordId: {
      type: String,
      default: ''
    },
    actionUrl: {
      type: String,
      default: ''
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

superAdminNotificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = superAdminNotificationSchema;
