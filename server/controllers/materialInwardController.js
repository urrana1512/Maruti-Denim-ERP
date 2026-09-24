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
    const result = await materialInwardService.createMaterialInward(req.body);
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
