const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const {
  getMyProfile,
  updatePersonalInfo,
  uploadAvatar: handleUploadAvatar,
  removeAvatar,
  requestEmailChange,
  verifyEmailChange,
  changePassword,
  updatePreferences
} = require('../controllers/profileController');

router.use(protect);

router.get('/', getMyProfile);
router.put('/personal', updatePersonalInfo);
router.post('/avatar', uploadAvatar, handleUploadAvatar);
router.delete('/avatar', removeAvatar);
router.post('/email/request-change', requestEmailChange);
router.post('/email/verify-change', verifyEmailChange);
router.put('/password', changePassword);
router.put('/preferences', updatePreferences);

module.exports = router;
