const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { resolveModels } = require('../config/connectionManager');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const {
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail,
  sendRegistrationPendingEmail,
  sendPasswordChangedAlertEmail
} = require('../services/emailService');

const HMAC_SECRET = process.env.OTP_SECRET || 'maruti_denim_otp_hmac_secret_key_2026';

/**
 * Hash OTP using HMAC-SHA256
 */
const hashOtp = (otpCode) => {
  return crypto.createHmac('sha256', HMAC_SECRET).update(String(otpCode).trim()).digest('hex');
};

/**
 * Mask Email for UI Display (e.g. u****@gmail.com)
 */
const maskEmail = (emailStr) => {
  if (!emailStr || !emailStr.includes('@')) return 'u****@gmail.com';
  const [local, domain] = emailStr.split('@');
  const maskedLocal = local.length > 2 ? `${local[0]}****${local[local.length - 1]}` : `${local[0]}****`;
  return `${maskedLocal}@${domain}`;
};

/**
 * Enforce Password Strength Rules
 */
const validatePasswordStrength = (pwd) => {
  if (!pwd || pwd.length < 10) {
    return 'Password must be at least 10 characters long.';
  }
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

  if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
    return 'Password must contain uppercase, lowercase, numbers, and special symbols.';
  }
  return null;
};

/**
 * Generate Main Auth Token
 */
const generateToken = (id, companyCode = 'maruti_nandan', tokenVersion = 0) => {
  return jwt.sign({ id, companyCode, tokenVersion }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Flow-Specific Helper Tokens (15m expiry)
 */
const generateFlowToken = (payload, expiresIn = '15m') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const verifyFlowToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Send Session Token Response
 */
const sendTokenResponse = (user, companyCode, statusCode, res, message = 'Authenticated successfully') => {
  const code = companyCode || user.companyCode || 'maruti_nandan';
  const token = generateToken(user._id, code, user.tokenVersion || 0);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        designation: user.designation,
        roleName: user.roleName || user.role?.name,
        role: user.role,
        status: user.status,
        companyCode: code
      }
    });
};

// =========================================================================
// 1. NEW USER REGISTRATION (4-STEP FLOW)
// =========================================================================

// @desc    Registration Step 1: Initiate Registration & Send Email Verification OTP
// @route   POST /api/auth/register/step1-initiate
// @access  Public
exports.registerStep1Initiate = async (req, res) => {
  try {
    const { name, email, phone, department, designation } = req.body;

    if (!name || !email || !phone || !department || !designation) {
      return res.status(400).json({ success: false, message: 'All registration details are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(String(phone).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
    }

    // Check existing account status in User collection
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      if (['ACTIVE', 'APPROVED'].includes(existingUser.status)) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please try signing in.'
        });
      }
      if (existingUser.status === 'PENDING_APPROVAL') {
        return res.status(400).json({
          success: false,
          message: 'An account with this email is currently pending Admin approval.'
        });
      }
      if (existingUser.status === 'REJECTED') {
        return res.status(400).json({
          success: false,
          message: 'Registration for this email was previously rejected. Please contact administrator.'
        });
      }
      if (existingUser.status === 'INACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'This account has been deactivated. Please contact administrator.'
        });
      }
    }

    // Check for resend cooldown / rate limits on OTP
    let otpRecord = await Otp.findOne({ email: cleanEmail, purpose: 'REGISTRATION' });
    const now = Date.now();

    if (otpRecord) {
      // Cooldown check (60s minimum)
      if (otpRecord.lastResentAt && (now - otpRecord.lastResentAt.getTime()) < 60 * 1000) {
        const remainingSec = Math.ceil((60 * 1000 - (now - otpRecord.lastResentAt.getTime())) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSec} seconds before requesting a new OTP code.`
        });
      }

      // Hourly cap check (max 5 resends per hour)
      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      if (otpRecord.lastResentAt && otpRecord.lastResentAt < oneHourAgo) {
        otpRecord.resendCount = 0; // Reset hourly counter
      }

      if (otpRecord.resendCount >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Maximum OTP resends reached for this hour. Please try again later.'
        });
      }
    }

    // Generate 6-digit OTP code using cryptographically secure random source
    const rawOtp = String(crypto.randomInt(100000, 1000000));
    const hashedOtp = hashOtp(rawOtp);
    const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes expiry

    const regData = {
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      department: String(department).trim(),
      designation: String(designation).trim()
    };

    if (otpRecord) {
      otpRecord.otpHash = hashedOtp;
      otpRecord.expiresAt = expiresAt;
      otpRecord.attempts = 0;
      otpRecord.resendCount = (otpRecord.resendCount || 0) + 1;
      otpRecord.lastResentAt = new Date();
      otpRecord.lockUntil = null;
      otpRecord.verified = false;
      otpRecord.registrationData = regData;
      await otpRecord.save();
    } else {
      otpRecord = await Otp.create({
        email: cleanEmail,
        otpHash: hashedOtp,
        purpose: 'REGISTRATION',
        expiresAt,
        resendCount: 1,
        lastResentAt: new Date(),
        registrationData: regData
      });
    }

    // Dispatch email
    const mailResult = await sendVerificationOtpEmail(cleanEmail, rawOtp, name);

    if (!mailResult.success) {
      return res.status(mailResult.isHardBounce ? 400 : 500).json({
        success: false,
        message: mailResult.error || "We couldn't send the verification email. Please try again."
      });
    }

    // Issue short-lived registrationToken for Step 2 UI flow
    const registrationToken = generateFlowToken({ email: cleanEmail, step: 1, purpose: 'REGISTRATION' });

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${maskEmail(cleanEmail)}`,
      registrationToken,
      maskedEmail: maskEmail(cleanEmail),
      expiresInSeconds: 600
    });
  } catch (error) {
    console.error('Registration Step 1 error:', error);
    res.status(500).json({ success: false, message: 'Server error initiating registration.', error: error.message });
  }
};

// @desc    Registration Step 2: Verify Email OTP Code
// @route   POST /api/auth/register/step2-verify-otp
// @access  Public
exports.registerStep2VerifyOtp = async (req, res) => {
  try {
    const { registrationToken, otp } = req.body;

    if (!registrationToken || !otp) {
      return res.status(400).json({ success: false, message: 'Registration token and 6-digit OTP code are required.' });
    }

    const decoded = verifyFlowToken(registrationToken);
    if (!decoded || decoded.purpose !== 'REGISTRATION' || decoded.step !== 1) {
      return res.status(401).json({ success: false, message: 'Invalid or expired registration session. Please restart registration.' });
    }

    const email = decoded.email;
    const otpRecord = await Otp.findOne({ email, purpose: 'REGISTRATION' });

    if (!otpRecord) {
      return res.status(404).json({ success: false, message: 'No active OTP verification session found.' });
    }

    const now = Date.now();

    // Check account lockout due to failed attempts
    if (otpRecord.lockUntil && otpRecord.lockUntil.getTime() > now) {
      const remainingMins = Math.ceil((otpRecord.lockUntil.getTime() - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Too many failed OTP attempts. Verification locked. Try again in ${remainingMins} minutes.`
      });
    }

    // Expiry check
    if (otpRecord.expiresAt.getTime() < now) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new OTP.' });
    }

    // Compare HMAC OTP hashes
    const computedHash = hashOtp(otp);
    const isMatch = computedHash === otpRecord.otpHash;

    if (!isMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.attempts >= 5) {
        otpRecord.lockUntil = new Date(now + 15 * 60 * 1000); // 15 minute lock
      }
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: `Invalid verification code. Remaining attempts: ${Math.max(0, 5 - otpRecord.attempts)}`
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    otpRecord.verifiedAt = new Date();
    otpRecord.attempts = 0;
    otpRecord.lockUntil = null;
    await otpRecord.save();

    // Issue verified registration token for Step 3 (Create Password)
    const verifiedRegistrationToken = generateFlowToken({ email, step: 2, purpose: 'REGISTRATION_VERIFIED' });

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully!',
      verifiedRegistrationToken
    });
  } catch (error) {
    console.error('Registration Step 2 error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying OTP.', error: error.message });
  }
};

// @desc    Resend Registration OTP
// @route   POST /api/auth/register/resend-otp
// @access  Public
exports.registerResendOtp = async (req, res) => {
  try {
    const { registrationToken } = req.body;

    if (!registrationToken) {
      return res.status(400).json({ success: false, message: 'Registration token required.' });
    }

    const decoded = verifyFlowToken(registrationToken);
    if (!decoded || decoded.purpose !== 'REGISTRATION') {
      return res.status(401).json({ success: false, message: 'Registration session expired. Please restart.' });
    }

    const email = decoded.email;
    const otpRecord = await Otp.findOne({ email, purpose: 'REGISTRATION' });

    if (!otpRecord || !otpRecord.registrationData) {
      return res.status(404).json({ success: false, message: 'Registration details not found. Please restart registration.' });
    }

    const now = Date.now();

    // Cooldown check (60s)
    if (otpRecord.lastResentAt && (now - otpRecord.lastResentAt.getTime()) < 60 * 1000) {
      const remainingSec = Math.ceil((60 * 1000 - (now - otpRecord.lastResentAt.getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSec} seconds before requesting another code.`
      });
    }

    // Hourly cap check
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    if (otpRecord.lastResentAt && otpRecord.lastResentAt < oneHourAgo) {
      otpRecord.resendCount = 0;
    }

    if (otpRecord.resendCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Maximum OTP resends reached for this hour. Please try again later.'
      });
    }

    // Generate fresh OTP
    const rawOtp = String(crypto.randomInt(100000, 1000000));
    otpRecord.otpHash = hashOtp(rawOtp);
    otpRecord.expiresAt = new Date(now + 10 * 60 * 1000);
    otpRecord.attempts = 0;
    otpRecord.resendCount = (otpRecord.resendCount || 0) + 1;
    otpRecord.lastResentAt = new Date();
    otpRecord.lockUntil = null;
    otpRecord.verified = false;
    await otpRecord.save();

    const mailResult = await sendVerificationOtpEmail(email, rawOtp, otpRecord.registrationData.name);

    if (!mailResult.success) {
      return res.status(mailResult.isHardBounce ? 400 : 500).json({
        success: false,
        message: mailResult.error || "We couldn't send the verification email. Please try again."
      });
    }

    res.status(200).json({
      success: true,
      message: `A fresh verification code has been sent to ${maskEmail(email)}.`,
      maskedEmail: maskEmail(email),
      expiresInSeconds: 600
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error resending OTP.' });
  }
};

// @desc    Registration Step 3: Create Password & Create Pending User Account
// @route   POST /api/auth/register/step3-create-password
// @access  Public
exports.registerStep3CreatePassword = async (req, res) => {
  try {
    const { verifiedRegistrationToken, password, confirmPassword } = req.body;

    if (!verifiedRegistrationToken || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Verified token, password, and confirm password are required.' });
    }

    const decoded = verifyFlowToken(verifiedRegistrationToken);
    if (!decoded || decoded.purpose !== 'REGISTRATION_VERIFIED' || decoded.step !== 2) {
      return res.status(401).json({ success: false, message: 'Email verification token expired or invalid. Please verify email again.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      return res.status(400).json({ success: false, message: pwdErr });
    }

    const email = decoded.email;
    const otpRecord = await Otp.findOne({ email, purpose: 'REGISTRATION', verified: true });

    if (!otpRecord || !otpRecord.registrationData) {
      return res.status(400).json({ success: false, message: 'Verified registration record not found. Please restart.' });
    }

    const { name, phone, department, designation } = otpRecord.registrationData;

    // Check if account already created
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Default role assignment
    let defaultRole = await Role.findOne({ code: 'department_staff' });
    if (!defaultRole) {
      defaultRole = await Role.findOne({});
    }

    user = await User.create({
      name,
      email,
      phone,
      department,
      designation,
      password, // Pre-save hook hashes with bcrypt
      role: defaultRole?._id,
      roleName: defaultRole?.name || 'Department Staff',
      status: 'PENDING_APPROVAL',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    });

    // Cleanup OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Send confirmation email
    await sendRegistrationPendingEmail(email, name);

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.roleName,
      action: 'USER_REGISTERED',
      module: 'AUTH',
      details: { department, designation, emailVerified: true },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(201).json({
      success: true,
      message: 'Email verified successfully. Your account is pending Admin approval.',
      userStatus: 'PENDING_APPROVAL'
    });
  } catch (error) {
    console.error('Registration Step 3 error:', error);
    res.status(500).json({ success: false, message: 'Server error completing registration.', error: error.message });
  }
};

// =========================================================================
// 2. LOGIN FLOW
// =========================================================================

// @desc    User Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { User, AuditLog } = resolveModels(req);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('role');

    // Generic error message for non-existent account or wrong password to prevent user enumeration
    const genericInvalidMsg = 'Invalid email address or password.';

    if (!user) {
      return res.status(401).json({ success: false, message: genericInvalidMsg });
    }

    // Check account lockout
    const now = Date.now();
    if (user.lockUntil && user.lockUntil.getTime() > now) {
      const remainingMins = Math.ceil((user.lockUntil.getTime() - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Try again in ${remainingMins} minutes.`
      });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(now + 15 * 60 * 1000); // 15 min lock
      }
      await user.save();

      return res.status(401).json({ success: false, message: genericInvalidMsg });
    }

    // Status checks
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email address is not verified. Please complete email verification.'
      });
    }

    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({
        success: false,
        message: "Your account is awaiting Admin approval. You'll be notified once it's active."
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        message: 'Your registration was not approved. Contact your administrator for details.'
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact your administrator.'
      });
    }

    // Reset failed login counters & record login time
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.roleName,
      action: 'USER_LOGIN',
      module: 'AUTH',
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    const companyCode = req.companyCode || user.companyCode || 'maruti_nandan';
    sendTokenResponse(user, companyCode, 200, res, 'Logged in successfully');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

// @desc    Admin Login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { User, AuditLog } = resolveModels(req);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Admin credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Admin credentials.' });
    }

    const roleCode = user.role?.code;
    const roleName = user.roleName || user.role?.name;

    if (roleCode !== 'admin' && roleName !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Account does not have Admin privileges.' });
    }

    if (user.status !== 'APPROVED' && user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Admin account is not active.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: 'Admin',
      action: 'ADMIN_LOGIN',
      module: 'AUTH',
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    const companyCode = req.companyCode || user.companyCode || 'maruti_nandan';
    sendTokenResponse(user, companyCode, 200, res, 'Admin authenticated successfully');
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during Admin login.', error: error.message });
  }
};

// =========================================================================
// 3. FORGOT PASSWORD FLOW (3-STEP)
// =========================================================================

// @desc    Forgot Password Step 1: Request Password Reset OTP
// @route   POST /api/auth/forgot-password/step1-request
// @access  Public
exports.forgotPasswordStep1Request = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Generic success message to prevent user enumeration
    const genericSuccessMsg = 'If this email address is registered, an OTP has been sent.';

    const user = await User.findOne({ email: cleanEmail });

    // Always issue token payload for UI flow consistency, but only dispatch email if user exists & active
    const resetRequestToken = generateFlowToken({ email: cleanEmail, purpose: 'PASSWORD_RESET', step: 1 });

    if (!user || !['APPROVED', 'ACTIVE'].includes(user.status)) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMsg,
        resetRequestToken,
        maskedEmail: maskEmail(cleanEmail)
      });
    }

    // Rate limits on OTP
    let otpRecord = await Otp.findOne({ email: cleanEmail, purpose: 'PASSWORD_RESET' });
    const now = Date.now();

    if (otpRecord) {
      if (otpRecord.lastResentAt && (now - otpRecord.lastResentAt.getTime()) < 60 * 1000) {
        // Cooldown active, return generic success without re-sending
        return res.status(200).json({
          success: true,
          message: genericSuccessMsg,
          resetRequestToken,
          maskedEmail: maskEmail(cleanEmail)
        });
      }
    }

    const rawOtp = String(crypto.randomInt(100000, 1000000));
    const hashedOtp = hashOtp(rawOtp);
    const expiresAt = new Date(now + 10 * 60 * 1000);

    if (otpRecord) {
      otpRecord.otpHash = hashedOtp;
      otpRecord.expiresAt = expiresAt;
      otpRecord.attempts = 0;
      otpRecord.resendCount = (otpRecord.resendCount || 0) + 1;
      otpRecord.lastResentAt = new Date();
      otpRecord.lockUntil = null;
      otpRecord.verified = false;
      await otpRecord.save();
    } else {
      otpRecord = await Otp.create({
        email: cleanEmail,
        otpHash: hashedOtp,
        purpose: 'PASSWORD_RESET',
        expiresAt,
        resendCount: 1,
        lastResentAt: new Date()
      });
    }

    const mailResult = await sendPasswordResetOtpEmail(cleanEmail, rawOtp);

    if (!mailResult.success) {
      return res.status(mailResult.isHardBounce ? 400 : 500).json({
        success: false,
        message: mailResult.error || "We couldn't send the password reset email. Please try again."
      });
    }

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'FORGOT_PASSWORD_REQUEST',
      module: 'AUTH',
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(200).json({
      success: true,
      message: genericSuccessMsg,
      resetRequestToken,
      maskedEmail: maskEmail(cleanEmail),
      expiresInSeconds: 600
    });
  } catch (error) {
    console.error('Forgot password step 1 error:', error);
    res.status(500).json({ success: false, message: 'Server error initiating password reset.' });
  }
};

// @desc    Forgot Password Step 2: Verify Reset OTP Code
// @route   POST /api/auth/forgot-password/step2-verify-otp
// @access  Public
exports.forgotPasswordStep2VerifyOtp = async (req, res) => {
  try {
    const { resetRequestToken, otp } = req.body;

    if (!resetRequestToken || !otp) {
      return res.status(400).json({ success: false, message: 'Reset token and 6-digit OTP code are required.' });
    }

    const decoded = verifyFlowToken(resetRequestToken);
    if (!decoded || decoded.purpose !== 'PASSWORD_RESET' || decoded.step !== 1) {
      return res.status(401).json({ success: false, message: 'Password reset session expired. Please try again.' });
    }

    const email = decoded.email;
    const otpRecord = await Otp.findOne({ email, purpose: 'PASSWORD_RESET' });

    if (!otpRecord) {
      return res.status(404).json({ success: false, message: 'No active password reset verification session found.' });
    }

    const now = Date.now();

    if (otpRecord.lockUntil && otpRecord.lockUntil.getTime() > now) {
      const remainingMins = Math.ceil((otpRecord.lockUntil.getTime() - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Verification locked. Try again in ${remainingMins} minutes.`
      });
    }

    if (otpRecord.expiresAt.getTime() < now) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new OTP.' });
    }

    const computedHash = hashOtp(otp);
    const isMatch = computedHash === otpRecord.otpHash;

    if (!isMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.attempts >= 5) {
        otpRecord.lockUntil = new Date(now + 15 * 60 * 1000);
      }
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: `Invalid reset code. Remaining attempts: ${Math.max(0, 5 - otpRecord.attempts)}`
      });
    }

    otpRecord.verified = true;
    otpRecord.verifiedAt = new Date();
    otpRecord.attempts = 0;
    otpRecord.lockUntil = null;
    await otpRecord.save();

    const verifiedResetToken = generateFlowToken({ email, step: 2, purpose: 'PASSWORD_RESET_VERIFIED' });

    res.status(200).json({
      success: true,
      message: 'OTP code verified successfully!',
      verifiedResetToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error verifying reset OTP.' });
  }
};

// @desc    Resend Password Reset OTP
// @route   POST /api/auth/forgot-password/resend-otp
// @access  Public
exports.forgotPasswordResendOtp = async (req, res) => {
  try {
    const { resetRequestToken } = req.body;

    if (!resetRequestToken) {
      return res.status(400).json({ success: false, message: 'Reset session token required.' });
    }

    const decoded = verifyFlowToken(resetRequestToken);
    if (!decoded || decoded.purpose !== 'PASSWORD_RESET') {
      return res.status(401).json({ success: false, message: 'Reset session expired. Please restart.' });
    }

    const email = decoded.email;
    const user = await User.findOne({ email });

    const genericMsg = `If registered, a fresh code has been sent to ${maskEmail(email)}.`;

    if (!user || !['APPROVED', 'ACTIVE'].includes(user.status)) {
      return res.status(200).json({ success: true, message: genericMsg });
    }

    const otpRecord = await Otp.findOne({ email, purpose: 'PASSWORD_RESET' });
    const now = Date.now();

    if (otpRecord) {
      if (otpRecord.lastResentAt && (now - otpRecord.lastResentAt.getTime()) < 60 * 1000) {
        const remainingSec = Math.ceil((60 * 1000 - (now - otpRecord.lastResentAt.getTime())) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSec} seconds before requesting another code.`
        });
      }
    }

    const rawOtp = String(crypto.randomInt(100000, 1000000));
    const hashedOtp = hashOtp(rawOtp);

    if (otpRecord) {
      otpRecord.otpHash = hashedOtp;
      otpRecord.expiresAt = new Date(now + 10 * 60 * 1000);
      otpRecord.attempts = 0;
      otpRecord.resendCount = (otpRecord.resendCount || 0) + 1;
      otpRecord.lastResentAt = new Date();
      otpRecord.lockUntil = null;
      otpRecord.verified = false;
      await otpRecord.save();
    } else {
      await Otp.create({
        email,
        otpHash: hashedOtp,
        purpose: 'PASSWORD_RESET',
        expiresAt: new Date(now + 10 * 60 * 1000),
        resendCount: 1,
        lastResentAt: new Date()
      });
    }

    const mailResult = await sendPasswordResetOtpEmail(email, rawOtp);

    if (!mailResult.success) {
      return res.status(mailResult.isHardBounce ? 400 : 500).json({
        success: false,
        message: mailResult.error || "We couldn't send the password reset email. Please try again."
      });
    }

    res.status(200).json({
      success: true,
      message: genericMsg,
      maskedEmail: maskEmail(email),
      expiresInSeconds: 600
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error resending reset OTP.' });
  }
};

// @desc    Forgot Password Step 3: Set New Password & Invalidate All Sessions
// @route   POST /api/auth/forgot-password/step3-reset-password
// @access  Public
exports.forgotPasswordStep3ResetPassword = async (req, res) => {
  try {
    const { verifiedResetToken, newPassword, confirmPassword } = req.body;

    if (!verifiedResetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Verified token, new password, and confirm password are required.' });
    }

    const decoded = verifyFlowToken(verifiedResetToken);
    if (!decoded || decoded.purpose !== 'PASSWORD_RESET_VERIFIED' || decoded.step !== 2) {
      return res.status(401).json({ success: false, message: 'Reset session expired. Please verify OTP again.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const pwdErr = validatePasswordStrength(newPassword);
    if (pwdErr) {
      return res.status(400).json({ success: false, message: pwdErr });
    }

    const email = decoded.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Invalidate OTP
    await Otp.deleteOne({ email, purpose: 'PASSWORD_RESET' });

    // Update password, increment tokenVersion to force logout everywhere
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Send security alert email
    await sendPasswordChangedAlertEmail(email, user.name);

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'PASSWORD_RESET_SUCCESS',
      module: 'AUTH',
      details: { sessionsInvalidated: true },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully! All active sessions have been invalidated. Please sign in with your new password.'
    });
  } catch (error) {
    console.error('Password reset step 3 error:', error);
    res.status(500).json({ success: false, message: 'Server error updating password.', error: error.message });
  }
};

// =========================================================================
// 4. COMMON AUTH FUNCTIONS (Profile, Logout)
// =========================================================================

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        designation: user.designation,
        roleName: user.roleName || user.role?.name,
        role: user.role,
        permissions: user.role?.permissions || [],
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
