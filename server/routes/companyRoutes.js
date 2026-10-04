const express = require('express');
const router = express.Router();
const { getPublicCompanies } = require('../controllers/companyController');

// Public route to list active companies for selection screens
router.get('/public', getPublicCompanies);

module.exports = router;
