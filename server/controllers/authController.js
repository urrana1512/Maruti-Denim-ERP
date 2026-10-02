const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

const sendTokenResponse = (user, statusCode, res, message = 'Authenticated successfully') => {
  const token = generateToken(user._id);

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
        status: user.status
      }
    });
};

// @desc    Register a new user (Pending Admin Approval)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, phone, department, designation, password } = req.body;

    if (!name || !email || !phone || !department || !designation || !password) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Find default role for department staff
    let defaultRole = await Role.findOne({ code: 'department_staff' });
    if (!defaultRole) {
      defaultRole = await Role.findOne({});
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      password,
      role: defaultRole?._id,
      roleName: defaultRole?.name || 'Department Staff',
      status: 'PENDING_APPROVAL'
    });

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.roleName,
      action: 'USER_REGISTERED',
      module: 'AUTH',
      details: { department, designation },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your account is currently Pending Approval by an Administrator.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
};

// @desc    User Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to repeated failed logins. Try again in ${remainingMins} minutes.`
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await user.save();

      return res.status(401).json({ 
        success: false, 
        message: `Invalid credentials. Failed attempts: ${user.failedLoginAttempts}/5` 
      });
    }

    // Status checks
    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({
        success: false,
        message: 'Your registration is Pending Admin Approval. Access will be granted once approved.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        message: `Account registration rejected. ${user.rejectionReason ? 'Reason: ' + user.rejectionReason : ''}`
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Reset failed login counters
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

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

// @desc    Admin dedicated login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('role');
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

    sendTokenResponse(user, 200, res, 'Admin authenticated successfully');
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during Admin login.', error: error.message });
  }
};

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

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user account found with that email address.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'FORGOT_PASSWORD_REQUEST',
      module: 'AUTH'
    });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated. In a live mail setup an email would be sent.',
      resetToken // Returned for easy UI testing/demonstration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error generating password reset token.' });
  }
};

// @desc    Reset Password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'PASSWORD_RESET_SUCCESS',
      module: 'AUTH'
    });

    res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};
