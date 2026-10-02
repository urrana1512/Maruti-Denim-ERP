const express = require('express');
const router = express.Router();
const materialInwardController = require('../controllers/materialInwardController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.use(optionalAuth);

router.get('/gate-pass/:gatePassNumber', materialInwardController.fetchGatePassForInward);
router.post('/', materialInwardController.createMaterialInward);
router.get('/consolidated/:gatePassNumber', materialInwardController.getConsolidatedInward);
router.put('/:id/approve', materialInwardController.approveMaterialInward);
router.put('/:id', materialInwardController.updateMaterialInward);
router.get('/:id/pdf', materialInwardController.downloadMaterialInwardPdf);
router.get('/:id', materialInwardController.getMaterialInwardById);
router.get('/gate-pass/:gatePassNumber/history', materialInwardController.getInwardHistory);

module.exports = router;
