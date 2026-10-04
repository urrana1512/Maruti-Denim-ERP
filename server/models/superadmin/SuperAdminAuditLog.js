const mongoose = require('mongoose');

const superAdminAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: null
    },
    userName: {
      type: String,
      default: 'Super Admin'
    },
    userEmail: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true
    },
    module: {
      type: String,
      default: 'PLATFORM'
    },
    companyCode: {
      type: String,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = superAdminAuditLogSchema;
