const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.use(optionalAuth);

// Item Description Master Routes
router.get('/items', masterDataController.getItems);
router.get('/items/active', masterDataController.getActiveItems);
router.get('/items/export/excel', masterDataController.exportItemsExcel);
router.get('/items/:id', masterDataController.getItemById);
router.post('/items', masterDataController.createItem);
router.put('/items/:id', masterDataController.updateItem);
router.patch('/items/:id/status', masterDataController.updateItemStatus);
router.delete('/items/:id', masterDataController.deleteItem);
router.post('/items/import', masterDataController.importItems);

// Vendor Master Routes
router.get('/vendors', masterDataController.getVendors);
router.get('/vendors/active', masterDataController.getActiveVendors);
router.get('/vendors/export/excel', masterDataController.exportVendorsExcel);
router.get('/vendors/:id', masterDataController.getVendorById);
router.post('/vendors', masterDataController.createVendor);
router.put('/vendors/:id', masterDataController.updateVendor);
router.patch('/vendors/:id/status', masterDataController.updateVendorStatus);
router.delete('/vendors/:id', masterDataController.deleteVendor);

// PDF Export Route
router.get('/export/pdf', masterDataController.downloadMasterDataPdf);

// Audit History Route
router.get('/audit/:entityType/:entityId', masterDataController.getAuditHistory);

module.exports = router;
