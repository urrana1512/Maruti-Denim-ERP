const gatePassService = require('../services/gatePassService');
const { getGatePassLockState, diffAndValidateGatePassUpdate } = require('../services/gatePassLockService');
const { logGatePassAudit } = require('../services/auditService');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');

exports.createGatePass = async (req, res) => {
  try {
    const user = req.user;
    const createdBy = req.body.createdBy || user?.name || 'Authorized Staff';
    const createdByDesignation = req.body.createdByDesignation || user?.designation || user?.roleName || '';

    const payload = {
      ...req.body,
      createdBy,
      createdByDesignation
    };

    const gatePass = await gatePassService.createGatePass(payload);
    
    await logGatePassAudit({
      action: 'GATE_PASS_CREATED',
      gatePassId: gatePass._id,
      metadata: { gatePassNumber: gatePass.gatePassNumber, createdByDesignation },
      performedBy: `${createdBy}${createdByDesignation ? ` (${createdByDesignation})` : ''}`
    });

    // Enterprise Audit Event
    await auditService.logAuditEvent({
      req,
      companyCode: req.companyCode,
      action: 'CREATE',
      module: 'GATE_PASS',
      description: `${createdBy} created Gate Pass ${gatePass.gatePassNumber}`,
      entityType: 'GatePass',
      entityId: gatePass._id,
      targetId: gatePass.gatePassNumber,
      newValue: { gatePassNumber: gatePass.gatePassNumber, passType: gatePass.passType },
      status: 'SUCCESS'
    });

    // Enterprise Notifications
    if (user?._id) {
      await notificationService.createNotification({
        recipientUserId: user._id,
        companyCode: req.companyCode,
        type: 'GATE_PASS_CREATED',
        title: 'Gate Pass Created',
        message: `Gate Pass ${gatePass.gatePassNumber} has been successfully created.`,
        category: 'Gate Pass',
        priority: 'Normal',
        relatedModule: 'GATE_PASS',
        relatedRecordId: gatePass._id.toString(),
        actionUrl: '/gate-pass/manage',
        eventKey: `gatepass:${gatePass._id}:created:employee`
      });
    }

    await notificationService.createNotification({
      toAdmins: true,
      companyCode: req.companyCode,
      type: 'GATE_PASS_CREATED',
      title: 'New Gate Pass Created',
      message: `New Gate Pass ${gatePass.gatePassNumber} created by ${createdBy}.`,
      category: 'Gate Pass',
      priority: 'Normal',
      relatedModule: 'GATE_PASS',
      relatedRecordId: gatePass._id.toString(),
      actionUrl: '/admin/gate-passes',
      eventKey: `gatepass:${gatePass._id}:created:admin`
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

    if (existingGatePass.approvalStatus === 'Approved') {
      return res.status(409).json({
        success: false,
        message: 'Approved Gate Pass cannot be edited; only view and PDF download are allowed.',
        code: 'GATE_PASS_APPROVED_LOCKED'
      });
    }

    if (existingGatePass.gatePassStatus === 'CANCELLED' || existingGatePass.status === 'cancelled') {
      return res.status(409).json({
        success: false,
        message: 'Cancelled Gate Pass cannot be edited.',
        code: 'GATE_PASS_CANCELLED_LOCKED'
      });
    }

    const user = req.user;
    const updatedBy = req.body.updatedBy || user?.name || 'Authorized Staff';
    const updatedByDesignation = req.body.updatedByDesignation || user?.designation || user?.roleName || '';

    const payload = {
      ...req.body,
      updatedBy,
      updatedByDesignation
    };

    const lockState = await getGatePassLockState(existingGatePass);
    const validation = diffAndValidateGatePassUpdate(existingGatePass, lockState, payload);

    if (!validation.allowed) {
      await logGatePassAudit({
        action: 'GATE_PASS_EDIT_REJECTED_LOCKED',
        gatePassId: existingGatePass._id,
        metadata: { attemptedPayload: payload, lockedFields: validation.lockedFields },
        performedBy: `${updatedBy}${updatedByDesignation ? ` (${updatedByDesignation})` : ''}`
      });

      return res.status(409).json({
        success: false,
        message: 'Gate Pass cannot be modified because Material Inward has already been processed for this transaction.',
        code: 'GATE_PASS_LOCKED_AFTER_INWARD',
        lockedFields: validation.lockedFields
      });
    }

    const updated = await gatePassService.updateGatePass(req.params.id, payload);
    await logGatePassAudit({
      action: 'GATE_PASS_EDITED',
      gatePassId: updated._id,
      metadata: { updatedFields: Object.keys(payload) },
      performedBy: `${updatedBy}${updatedByDesignation ? ` (${updatedByDesignation})` : ''}`
    });

    res.status(200).json({ success: true, message: 'Gate pass updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to update gate pass', error: error.message });
  }
};

exports.approveGatePass = async (req, res) => {
  try {
    const existingGatePass = await gatePassService.getGatePassById(req.params.id);
    if (!existingGatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });

    if (existingGatePass.gatePassStatus === 'CANCELLED' || existingGatePass.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled Gate Pass cannot be approved.' });
    }

    const user = req.user;
    const approvedBy = req.body.approvedBy || user?.name || 'Authorized Staff';
    const approvedByDesignation = req.body.approvedByDesignation || user?.designation || user?.roleName || '';

    const updated = await gatePassService.approveGatePass(req.params.id, {
      approvedBy,
      approvedByDesignation
    });

    await logGatePassAudit({
      action: 'GATE_PASS_APPROVED',
      gatePassId: updated._id,
      metadata: { approvedBy, approvedByDesignation },
      performedBy: `${approvedBy}${approvedByDesignation ? ` (${approvedByDesignation})` : ''}`
    });

    // Enterprise Audit Event
    await auditService.logAuditEvent({
      req,
      companyCode: req.companyCode,
      action: 'APPROVE',
      module: 'GATE_PASS',
      description: `${approvedBy} approved Gate Pass ${updated.gatePassNumber}`,
      entityType: 'GatePass',
      entityId: updated._id,
      targetId: updated.gatePassNumber,
      oldValue: { approvalStatus: 'Pending' },
      newValue: { approvalStatus: 'Approved', approvedBy },
      status: 'SUCCESS'
    });

    // Notification to Employee Creator
    if (updated.createdByUserId || updated.userId) {
      await notificationService.createNotification({
        recipientUserId: updated.createdByUserId || updated.userId,
        companyCode: req.companyCode,
        type: 'GATE_PASS_APPROVED',
        title: 'Gate Pass Approved',
        message: `Your Gate Pass ${updated.gatePassNumber} has been approved.`,
        category: 'Gate Pass',
        priority: 'High',
        relatedModule: 'GATE_PASS',
        relatedRecordId: updated._id.toString(),
        actionUrl: '/gate-pass/manage',
        eventKey: `gatepass:${updated._id}:approved`
      });
    }

    res.status(200).json({ success: true, message: 'Gate pass approved successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to approve gate pass', error: error.message });
  }
};

exports.cancelGatePass = async (req, res) => {
  try {
    const existingGatePass = await gatePassService.getGatePassById(req.params.id);
    if (!existingGatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });

    if (existingGatePass.approvalStatus === 'Approved') {
      return res.status(400).json({ success: false, message: 'Approved Gate Pass cannot be cancelled.' });
    }

    const lockState = await getGatePassLockState(existingGatePass);
    if (lockState.gatePassLocked) {
      return res.status(409).json({
        success: false,
        message: 'Gate Pass cannot be cancelled because Material Inward has already been processed for this transaction.',
        code: 'GATE_PASS_LOCKED_AFTER_INWARD'
      });
    }

    const cancelReason = (req.body.cancelReason || req.body.reason || '').trim();
    if (!cancelReason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
    }

    const user = req.user;
    const cancelledBy = req.body.cancelledBy || user?.name || 'Authorized Staff';
    const cancelledByDesignation = req.body.cancelledByDesignation || user?.designation || user?.roleName || '';

    const updated = await gatePassService.cancelGatePass(req.params.id, {
      cancelReason,
      cancelledBy,
      cancelledByDesignation
    });

    await logGatePassAudit({
      action: 'GATE_PASS_CANCELLED',
      gatePassId: updated._id,
      metadata: { cancelReason, cancelledBy, cancelledByDesignation },
      performedBy: `${cancelledBy}${cancelledByDesignation ? ` (${cancelledByDesignation})` : ''}`
    });

    // Enterprise Audit Event
    await auditService.logAuditEvent({
      req,
      companyCode: req.companyCode,
      action: 'CANCEL',
      module: 'GATE_PASS',
      description: `${cancelledBy} cancelled Gate Pass ${updated.gatePassNumber}. Reason: ${cancelReason}`,
      entityType: 'GatePass',
      entityId: updated._id,
      targetId: updated.gatePassNumber,
      newValue: { status: 'CANCELLED', cancelReason },
      status: 'SUCCESS'
    });

    // Notification to Creator
    if (updated.createdByUserId || updated.userId) {
      await notificationService.createNotification({
        recipientUserId: updated.createdByUserId || updated.userId,
        companyCode: req.companyCode,
        type: 'GATE_PASS_CANCELLED',
        title: 'Gate Pass Cancelled',
        message: `Gate Pass ${updated.gatePassNumber} was cancelled.`,
        category: 'Gate Pass',
        priority: 'High',
        relatedModule: 'GATE_PASS',
        relatedRecordId: updated._id.toString(),
        actionUrl: '/gate-pass/manage',
        eventKey: `gatepass:${updated._id}:cancelled`
      });
    }

    res.status(200).json({ success: true, message: 'Gate pass cancelled successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to cancel gate pass', error: error.message });
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
        performedBy: req.user ? `${req.user.name} (${req.user.designation})` : 'User'
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
