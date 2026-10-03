const express = require('express');
const router = express.Router();
const {
  registerStep1Initiate,
  registerStep2VerifyOtp,
  registerResendOtp,
  registerStep3CreatePassword,
  login,
  adminLogin,
  forgotPasswordStep1Request,
  forgotPasswordStep2VerifyOtp,
  forgotPasswordResendOtp,
  forgotPasswordStep3ResetPassword,
  getMe,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// 1. New Registration 4-Step Flow
router.post('/register/step1-initiate', registerStep1Initiate);
router.post('/register/step2-verify-otp', registerStep2VerifyOtp);
router.post('/register/resend-otp', registerResendOtp);
router.post('/register/step3-create-password', registerStep3CreatePassword);

// 2. Authentication & Admin Login
router.post('/login', login);
router.post('/admin-login', adminLogin);

// 3. Forgot Password 3-Step Flow
router.post('/forgot-password/step1-request', forgotPasswordStep1Request);
router.post('/forgot-password/step2-verify-otp', forgotPasswordStep2VerifyOtp);
router.post('/forgot-password/resend-otp', forgotPasswordResendOtp);
router.post('/forgot-password/step3-reset-password', forgotPasswordStep3ResetPassword);

// 4. Session & Profile Management
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
