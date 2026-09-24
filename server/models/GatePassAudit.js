const mongoose = require('mongoose');

const gatePassAuditSchema = new mongoose.Schema(
  {
    gatePassId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', required: true },
    inwardId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialInward' },
    performedBy: { type: String, default: 'Admin' },
    action: { type: String, required: true },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GatePassAudit', gatePassAuditSchema);
