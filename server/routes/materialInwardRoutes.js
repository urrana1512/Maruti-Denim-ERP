const express = require('express');
const router = express.Router();
const materialInwardController = require('../controllers/materialInwardController');

router.get('/gate-pass/:gatePassNumber', materialInwardController.fetchGatePassForInward);
router.post('/', materialInwardController.createMaterialInward);
router.get('/consolidated/:gatePassNumber', materialInwardController.getConsolidatedInward);
router.get('/:id/pdf', materialInwardController.downloadMaterialInwardPdf);
router.get('/:id', materialInwardController.getMaterialInwardById);
router.get('/gate-pass/:gatePassNumber/history', materialInwardController.getInwardHistory);

module.exports = router;
