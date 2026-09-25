const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/parties', reportController.getParties);
router.get('/export/excel', reportController.exportExcel);

router.get('/gate-pass', reportController.getGatePassRegister);
router.get('/material-inward', reportController.getMaterialInwardRegister);
router.get('/returnable-material', reportController.getReturnableMaterialReport);
router.get('/pending-returns', reportController.getPendingReturnReport);
router.get('/gate-pass-closure', reportController.getGatePassClosureReport);
router.get('/party-summary', reportController.getPartySummaryReport);
router.get('/combined', reportController.getCombinedReport);

module.exports = router;
