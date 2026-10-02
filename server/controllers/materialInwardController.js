const materialInwardService = require('../services/materialInwardService');

exports.fetchGatePassForInward = async (req, res) => {
  try {
    const data = await materialInwardService.fetchGatePassForInward(req.params.gatePassNumber);
    res.status(200).json({ success: true, message: 'Gate pass fetched for inward', data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createMaterialInward = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.body.createdBy || (req.user ? (req.user.name || req.user.username) : 'Admin'),
      createdByDesignation: req.body.createdByDesignation || (req.user ? (req.user.designation || req.user.role) : '')
    };
    const result = await materialInwardService.createMaterialInward(payload);
    res.status(201).json({ success: true, message: result.message, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMaterialInwardById = async (req, res) => {
  try {
    const inward = await materialInwardService.getMaterialInwardById(req.params.id);
    if (!inward) return res.status(404).json({ success: false, message: 'Material Inward record not found' });
    res.status(200).json({ success: true, message: 'Fetched Material Inward', data: inward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInwardHistory = async (req, res) => {
  try {
    const history = await materialInwardService.getInwardHistory(req.params.gatePassNumber);
    res.status(200).json({ success: true, message: 'Fetched Material Inward history', data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getConsolidatedInward = async (req, res) => {
  try {
    const consolidated = await materialInwardService.getConsolidatedInwardByGatePass(req.params.gatePassNumber);
    if (!consolidated) return res.status(404).json({ success: false, message: 'No inward records found for this Gate Pass' });
    res.status(200).json({ success: true, message: 'Fetched Consolidated Material Inward', data: consolidated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveMaterialInward = async (req, res) => {
  try {
    const inward = await materialInwardService.approveMaterialInward(req.params.id, {
      approvedBy: req.body.approvedBy || (req.user ? (req.user.name || req.user.username) : 'Admin'),
      approvedByDesignation: req.body.approvedByDesignation || (req.user ? (req.user.designation || req.user.role) : '')
    });
    res.status(200).json({ success: true, message: `Material Inward ${inward.inwardNumber} approved successfully!`, data: inward });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateMaterialInward = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      updatedBy: req.body.updatedBy || (req.user ? (req.user.name || req.user.username) : 'Admin'),
      updatedByDesignation: req.body.updatedByDesignation || (req.user ? (req.user.designation || req.user.role) : '')
    };
    const inward = await materialInwardService.updateMaterialInward(req.params.id, payload);
    res.status(200).json({ success: true, message: `Material Inward ${inward.inwardNumber} updated successfully!`, data: inward });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const { generatePdfFromUrl } = require('../services/pdfService');

exports.downloadMaterialInwardPdf = async (req, res) => {
  try {
    const inward = await materialInwardService.getMaterialInwardById(req.params.id);
    if (!inward) return res.status(404).json({ success: false, message: 'Material Inward record not found' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const printUrl = `${clientUrl}/documents/material-inward/${inward._id}/print`;

    const pdfBuffer = await generatePdfFromUrl(printUrl);

    const filename = inward.isConsolidated 
      ? `MarutiDenim_ConsolidatedMaterialInwardReceipt_${inward.gatePassNumber || 'MI'}.pdf`
      : `MarutiDenim_MaterialInwardReceipt_${inward.inwardNumber || 'MI'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download Material Inward PDF Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Material Inward PDF', error: error.message });
  }
};
