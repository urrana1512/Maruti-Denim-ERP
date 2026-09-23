const gatePassService = require('../services/gatePassService');

exports.createGatePass = async (req, res) => {
  try {
    const gatePass = await gatePassService.createGatePass(req.body);
    res.status(201).json({ success: true, message: 'Gate pass created successfully', data: gatePass });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to create gate pass', error: error.message });
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

exports.updateGatePass = async (req, res) => {
  try {
    const gatePass = await gatePassService.updateGatePass(req.params.id, req.body);
    if (!gatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });
    res.status(200).json({ success: true, message: 'Gate pass updated successfully', data: gatePass });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Unable to update gate pass', error: error.message });
  }
};

exports.deleteGatePass = async (req, res) => {
  try {
    const gatePass = await gatePassService.deleteGatePass(req.params.id);
    if (!gatePass) return res.status(404).json({ success: false, message: 'Gate pass not found' });
    res.status(200).json({ success: true, message: 'Gate pass deleted successfully', data: gatePass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete gate pass', error: error.message });
  }
};
