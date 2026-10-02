const express = require('express');
const router = express.Router();
const {
  getRoles,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/roleController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getRoles);
router.post('/', requireAdmin, createRole);
router.put('/:id', requireAdmin, updateRole);
router.delete('/:id', requireAdmin, deleteRole);

module.exports = router;
