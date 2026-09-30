const gatePassService = require('../services/gatePassService');
const { getGatePassLockState, diffAndValidateGatePassUpdate } = require('../services/gatePassLockService');
const { logGatePassAudit } = require('../services/auditService');

exports.createGatePass = async (req, res) => {
  try {
    const gatePass = await gatePassService.createGatePass(req.body);
    await logGatePassAudit({
      action: 'GATE_PASS_CREATED',
      gatePassId: gatePass._id,
      metadata: { gatePassNumber: gatePass.gatePassNumber },
      performedBy: req.body.createdBy || 'Admin'
    });
    res.status(201).json({ success: true, message: 'Gate pass created successfully', data: gatePass });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to create gate pass', error: error.message });
  }
};

exports.getNextGatePassNumber = async (req, res) => {
  try {
    const gatePassNumber = await gatePassService.getNextGatePassNumber();
    res.status(200).json({ success: true, gatePassNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate next gate pass number', error: error.message });
  }
};

exports.getGatePasses = async (req, res) => {
  try {
    const gatePasses = await gatePassService.getGatePasses(req.query);
    res.status(200).json({ success: true, message: 'Fetched gate passes', data: gatePasses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch gate passes', error: error.message });
  }
};

exports.getGatePassById = async (req, res) => {
  try {
    const gatePass = await gatePassService.getGatePassById(req.params.id);
    if (!gatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });
    res.status(200).json({ success: true, message: 'Fetched gate pass', data: gatePass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch gate pass', error: error.message });
  }
};

exports.getGatePassLockState = async (req, res) => {
  try {
    const lockState = await getGatePassLockState(req.params.id);
    res.status(200).json({ success: true, ...lockState });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch lock state', error: error.message });
  }
};

exports.updateGatePass = async (req, res) => {
  try {
    const existingGatePass = await gatePassService.getGatePassById(req.params.id);
    if (!existingGatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });

    // Fetch lock state inside the same update handler for immediate concurrency protection
    const lockState = await getGatePassLockState(existingGatePass);
    const validation = diffAndValidateGatePassUpdate(existingGatePass, lockState, req.body);

    if (!validation.allowed) {
      await logGatePassAudit({
        action: 'GATE_PASS_EDIT_REJECTED_LOCKED',
        gatePassId: existingGatePass._id,
        metadata: { attemptedPayload: req.body, lockedFields: validation.lockedFields },
        performedBy: req.body.updatedBy || 'User'
      });

      return res.status(409).json({
        success: false,
        message: 'Gate Pass cannot be modified because Material Inward has already been processed for this transaction.',
        code: 'GATE_PASS_LOCKED_AFTER_INWARD',
        lockedFields: validation.lockedFields
      });
    }

    const updated = await gatePassService.updateGatePass(req.params.id, req.body);
    await logGatePassAudit({
      action: 'GATE_PASS_EDITED',
      gatePassId: updated._id,
      metadata: { updatedFields: Object.keys(req.body) },
      performedBy: req.body.updatedBy || 'Admin'
    });

    res.status(200).json({ success: true, message: 'Gate pass updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to update gate pass', error: error.message });
  }
};

exports.deleteGatePass = async (req, res) => {
  try {
    const lockState = await getGatePassLockState(req.params.id);
    if (lockState.gatePassLocked) {
      await logGatePassAudit({
        action: 'GATE_PASS_EDIT_REJECTED_LOCKED',
        gatePassId: req.params.id,
        metadata: { action: 'delete' },
        performedBy: 'User'
      });

      return res.status(409).json({
        success: false,
        message: 'Gate Pass cannot be deleted because Material Inward has already been processed.',
        code: 'GATE_PASS_LOCKED_AFTER_INWARD',
        lockedFields: ['delete']
      });
    }

    const gatePass = await gatePassService.deleteGatePass(req.params.id);
    if (!gatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });
    res.status(200).json({ success: true, message: 'Gate pass deleted successfully', data: gatePass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete gate pass', error: error.message });
  }
};

const { generatePdfFromUrl } = require('../services/pdfService');

exports.downloadGatePassPdf = async (req, res) => {
  try {
    const gatePass = await gatePassService.getGatePassById(req.params.id);
    if (!gatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const printUrl = `${clientUrl}/documents/gate-pass/${gatePass._id}/print`;

    const pdfBuffer = await generatePdfFromUrl(printUrl);

    const filename = `MarutiDenim_GatePass_${gatePass.gatePassNumber || 'GP'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download Gate Pass PDF Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Gate Pass PDF', error: error.message });
  }
};
