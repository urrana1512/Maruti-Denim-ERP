const mongoose = require('mongoose');
const GatePassAudit = require('../models/GatePassAudit');

let mockAudits = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

const logGatePassAudit = async ({ action, gatePassId, metadata = {}, performedBy = 'Admin', inwardId = null }) => {
  try {
    const payload = {
      action,
      gatePassId,
      metadata,
      performedBy,
      inwardId,
      timestamp: new Date()
    };

    if (isDbConnected() && gatePassId && mongoose.Types.ObjectId.isValid(gatePassId)) {
      const audit = new GatePassAudit(payload);
      return await audit.save();
    } else {
      const mockEntry = { ...payload, _id: `audit-${Date.now()}-${Math.random()}` };
      mockAudits.push(mockEntry);
      return mockEntry;
    }
  } catch (err) {
    console.error('Audit Logging Error:', err);
    return null;
  }
};

const getGatePassAuditHistory = async (gatePassId) => {
  if (isDbConnected() && gatePassId && mongoose.Types.ObjectId.isValid(gatePassId)) {
    return await GatePassAudit.find({ gatePassId }).sort({ timestamp: -1 });
  }
  return mockAudits.filter(a => String(a.gatePassId) === String(gatePassId)).sort((a, b) => b.timestamp - a.timestamp);
};

module.exports = {
  logGatePassAudit,
  getGatePassAuditHistory
};
