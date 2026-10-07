const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { processAndSaveAvatar } = require('../middleware/uploadMiddleware');
const emailService = require('../services/emailService');

// Mask email for PII protection in lists
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

// GET current user profile
const getMyProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const companyInfo = {
      code: req.companyCode,
      name: req.companyCode === 'maruti_nandan' ? 'Maruti Nandan Denim PVT. LTD.' : req.companyCode === 'shri_ram' ? 'Shri Ram Cot Fab' : 'Balaji Polycot'
    };

    const permissions = user.role?.permissions || [];

    res.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        username: user.username || (user.email && user.email.includes('@') ? user.email.split('@')[0] : (user.phone || 'user')),
        email: user.email,
        phone: user.phone,
        department: user.department,
        designation: user.designation,
        employeeCode: user.employeeCode || `EMP-${user._id.toString().slice(-4).toUpperCase()}`,
        officeLocation: user.officeLocation || 'Main Plant',
        timeZone: user.timeZone || 'Asia/Kolkata',
        dateFormat: user.dateFormat || 'DD/MM/YYYY',
        dateOfJoining: user.dateOfJoining || user.createdAt,
        avatarUrl: user.avatarUrl || null,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        passwordChangedAt: user.passwordChangedAt,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roleName: user.roleName || user.role?.name || 'Department Staff',
        permissions,
        company: companyInfo,
        notificationPreferences: user.notificationPreferences || { emailGatePass: true, emailApprovals: true, emailSystem: true },
        displayPreferences: user.displayPreferences || { pageSize: 10, compactMode: false },
        activeSessions: (user.activeSessions || []).map(s => ({
          sessionId: s.sessionId,
          deviceLabel: s.deviceLabel,
          browser: s.browser,
          ipAddress: s.ipAddress,
          lastActiveAt: s.lastActiveAt,
          isCurrent: true
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};

// PUT update personal info (allowlist validated)
const updatePersonalInfo = async (req, res) => {
  try {
    const user = req.user;
    const tenantModels = req.tenantModels;

    // Strict Field Allowlisting (silently ignore any attempts to write role, status, companyCode, department, etc.)
    const { name, username, phone, officeLocation, timeZone, dateFormat } = req.body;

    if (name) user.name = String(name).trim();
    if (phone) user.phone = String(phone).trim();
    if (officeLocation) user.officeLocation = String(officeLocation).trim();
    if (timeZone) user.timeZone = String(timeZone).trim();
    if (dateFormat) user.dateFormat = String(dateFormat).trim();

    if (username && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = String(username).trim().toLowerCase();
      const existing = await tenantModels.User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username is already taken.' });
      }
      user.username = cleanUsername;
    }

    await user.save();

    // Log Audit Event
    if (tenantModels.AuditLog) {
      await tenantModels.AuditLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.roleName || 'User',
        action: 'PROFILE_UPDATE',
        module: 'USER',
        details: { fieldsUpdated: ['name', 'phone', 'officeLocation', 'timeZone', 'dateFormat'].filter(f => req.body[f]) },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || ''
      });
    }

    res.json({
      success: true,
      message: 'Personal profile updated successfully.',
      profile: {
        name: user.name,
        username: user.username,
        phone: user.phone,
        officeLocation: user.officeLocation,
        timeZone: user.timeZone,
        dateFormat: user.dateFormat
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error updating personal info.' });
  }
};

// POST upload profile picture (magic bytes + sharp re-encoding)
const uploadAvatar = async (req, res) => {
  try {
    const user = req.user;
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    // Process image through sharp & magic bytes validation
    const avatarPath = await processAndSaveAvatar(req.file.buffer, user._id.toString());
    user.avatarUrl = avatarPath;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded and processed securely.',
      avatarUrl: avatarPath
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(400).json({ success: false, message: error.message || 'Avatar upload failed.' });
  }
};

// DELETE remove profile picture
const removeAvatar = async (req, res) => {
  try {
    const user = req.user;
    user.avatarUrl = null;
    await user.save();
    res.json({
      success: true,
      message: 'Profile picture removed. Initials avatar restored.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error removing avatar.' });
  }
};

// POST Step-Up Verification: Request Email Change
const requestEmailChange = async (req, res) => {
  try {
    const { currentPassword, newEmail } = req.body;
    const user = req.user;
    const tenantModels = req.tenantModels;

    if (!currentPassword || !newEmail) {
      return res.status(400).json({ success: false, message: 'Current password and new email address are required.' });
    }

    // 1. Password Re-Authentication check
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid current password. Re-authentication failed.' });
    }

    const cleanNewEmail = String(newEmail).trim().toLowerCase();
    if (cleanNewEmail === user.email) {
      return res.status(400).json({ success: false, message: 'New email address must be different from current email.' });
    }

    // Check if new email is already in use
    const existing = await tenantModels.User.findOne({ email: cleanNewEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'The new email address is already registered to another account.' });
    }

    // Generate 6-digit OTP specifically for EMAIL_CHANGE
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    user.pendingEmailChange = {
      newEmail: cleanNewEmail,
      otpHash,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      attempts: 0
    };
    await user.save();

    // Send OTP to NEW email address via EmailService
    const companyName = req.companyCode === 'maruti_nandan' ? 'Maruti Nandan Denim' : req.companyCode === 'shri_ram' ? 'Shri Ram Cot Fab' : 'Balaji Polycot';
    await emailService.sendOtpEmail({
      toEmail: cleanNewEmail,
      userName: user.name,
      otp: otpCode,
      purpose: 'EMAIL_CHANGE',
      companyName
    });

    res.json({
      success: true,
      message: `Step-up verification code sent to ${maskEmail(cleanNewEmail)}. Previous email remains active until verified.`
    });
  } catch (error) {
    console.error('Error requesting email change:', error);
    res.status(500).json({ success: false, message: 'Failed to request email change.' });
  }
};

// POST Step-Up Verification: Verify Email Change OTP
const verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!otp || !user.pendingEmailChange || !user.pendingEmailChange.newEmail) {
      return res.status(400).json({ success: false, message: 'No pending email change request found.' });
    }

    const { newEmail, otpHash, expiresAt } = user.pendingEmailChange;

    if (new Date() > new Date(expiresAt)) {
      user.pendingEmailChange = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request again.' });
    }

    const inputHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (inputHash !== otpHash) {
      user.pendingEmailChange.attempts = (user.pendingEmailChange.attempts || 0) + 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const oldEmail = user.email;
    user.email = newEmail;
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.pendingEmailChange = null;
    await user.save();

    // Send notification to BOTH old and new email addresses
    const companyName = req.companyCode === 'maruti_nandan' ? 'Maruti Nandan Denim' : req.companyCode === 'shri_ram' ? 'Shri Ram Cot Fab' : 'Balaji Polycot';
    
    // Notify new email
    await emailService.sendSecurityAlertEmail({
      toEmail: newEmail,
      userName: user.name,
      alertType: 'Account Email Updated',
      details: `Your account email was successfully updated from ${maskEmail(oldEmail)} to ${newEmail}.`,
      companyName
    });

    // Notify old email for account takeover prevention
    await emailService.sendSecurityAlertEmail({
      toEmail: oldEmail,
      userName: user.name,
      alertType: 'SECURITY NOTICE: Account Email Changed',
      details: `Your account email address was changed to ${newEmail}. If you did not authorize this change, please contact system security immediately.`,
      companyName
    });

    res.json({
      success: true,
      message: 'Email address updated successfully! Security notifications sent to both old and new addresses.',
      email: newEmail
    });
  } catch (error) {
    console.error('Error verifying email change:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email change.' });
  }
};

// PUT Change Password (Current Password Check + Strength + History Check + Token Version Invalidation)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    // Fetch password hash explicitly
    const userWithPassword = await req.tenantModels.User.findById(user._id).select('+password');
    const isMatch = await userWithPassword.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid current password.' });
    }

    // Password strength check
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    // Password History Check (prevent reuse of last 3 passwords)
    const history = userWithPassword.passwordHistory || [];
    for (const oldPass of history.slice(-3)) {
      const reused = await bcrypt.compare(newPassword, oldPass.hash);
      if (reused) {
        return res.status(400).json({ success: false, message: 'Security Policy: You cannot reuse a recent password.' });
      }
    }

    // Push current hash to password history
    userWithPassword.passwordHistory.push({ hash: userWithPassword.password, changedAt: new Date() });
    
    userWithPassword.password = newPassword;
    userWithPassword.passwordChangedAt = new Date();
    userWithPassword.tokenVersion = (userWithPassword.tokenVersion || 0) + 1; // Invalidate all other active sessions

    await userWithPassword.save();

    res.json({
      success: true,
      message: 'Password updated successfully! Other active sessions have been invalidated for security.'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
};

// PUT update Preferences
const updatePreferences = async (req, res) => {
  try {
    const user = req.user;
    const { notificationPreferences, displayPreferences } = req.body;

    if (notificationPreferences) {
      user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };
    }
    if (displayPreferences) {
      user.displayPreferences = { ...user.displayPreferences, ...displayPreferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences saved successfully.',
      notificationPreferences: user.notificationPreferences,
      displayPreferences: user.displayPreferences
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  }
};

module.exports = {
  getMyProfile,
  updatePersonalInfo,
  uploadAvatar,
  removeAvatar,
  requestEmailChange,
  verifyEmailChange,
  changePassword,
  updatePreferences
};
