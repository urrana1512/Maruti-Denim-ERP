const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { processAndSaveAvatar } = require('../middleware/uploadMiddleware');
const emailService = require('../services/emailService');

const getSuperAdminProfile = async (req, res) => {
  try {
    const admin = req.superAdmin;
    res.json({
      success: true,
      profile: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        department: admin.department || 'Central Administration',
        designation: 'Root Super Administrator',
        officeLocation: admin.officeLocation || 'Corporate HQ',
        timeZone: admin.timeZone || 'Asia/Kolkata',
        dateFormat: admin.dateFormat || 'DD/MM/YYYY',
        avatarUrl: admin.avatarUrl || null,
        role: admin.role || 'SUPER_ADMIN',
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        notificationPreferences: admin.notificationPreferences || { emailGatePass: true, emailApprovals: true, emailSystem: true }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch Super Admin profile.' });
  }
};

const updateSuperAdminPersonal = async (req, res) => {
  try {
    const admin = req.superAdmin;
    const { name, phone, officeLocation, timeZone, dateFormat } = req.body;

    if (name) admin.name = String(name).trim();
    if (phone) admin.phone = String(phone).trim();
    if (officeLocation) admin.officeLocation = String(officeLocation).trim();
    if (timeZone) admin.timeZone = String(timeZone).trim();
    if (dateFormat) admin.dateFormat = String(dateFormat).trim();

    await admin.save();
    res.json({
      success: true,
      message: 'Super Admin profile updated successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

const uploadSuperAdminAvatar = async (req, res) => {
  try {
    const admin = req.superAdmin;
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }
    const avatarPath = await processAndSaveAvatar(req.file.buffer, admin._id.toString());
    admin.avatarUrl = avatarPath;
    await admin.save();

    res.json({ success: true, avatarUrl: avatarPath, message: 'Super Admin avatar updated.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Avatar upload failed.' });
  }
};

const removeSuperAdminAvatar = async (req, res) => {
  try {
    const admin = req.superAdmin;
    admin.avatarUrl = null;
    await admin.save();
    res.json({ success: true, message: 'Super Admin profile picture removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove avatar.' });
  }
};

const changeSuperAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = req.superAdmin;

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid current password.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    admin.password = newPassword;
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();

    res.json({ success: true, message: 'Super Admin password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

module.exports = {
  getSuperAdminProfile,
  updateSuperAdminPersonal,
  uploadSuperAdminAvatar,
  removeSuperAdminAvatar,
  changeSuperAdminPassword
};
