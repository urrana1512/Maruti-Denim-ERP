const express = require('express');
const router = express.Router();
const gatePassController = require('../controllers/gatePassController');

router.post('/', gatePassController.createGatePass);
router.get('/', gatePassController.getGatePasses);
router.get('/next-number', gatePassController.getNextGatePassNumber);

// Lock State & Individual Document Routes
router.get('/:id/lock-state', gatePassController.getGatePassLockState);
router.get('/:id/pdf', gatePassController.downloadGatePassPdf);
router.get('/:id', gatePassController.getGatePassById);
router.put('/:id/approve', gatePassController.approveGatePass);
router.put('/:id/cancel', gatePassController.cancelGatePass);
router.put('/:id', gatePassController.updateGatePass);
router.delete('/:id', gatePassController.deleteGatePass);

module.exports = router;
