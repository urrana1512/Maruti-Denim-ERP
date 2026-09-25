const express = require('express');
const router = express.Router();
const gatePassController = require('../controllers/gatePassController');

router.post('/', gatePassController.createGatePass);
router.get('/', gatePassController.getGatePasses);
router.get('/next-number', gatePassController.getNextGatePassNumber);
router.get('/:id/pdf', gatePassController.downloadGatePassPdf);
router.get('/:id', gatePassController.getGatePassById);
router.put('/:id', gatePassController.updateGatePass);
router.delete('/:id', gatePassController.deleteGatePass);

module.exports = router;
