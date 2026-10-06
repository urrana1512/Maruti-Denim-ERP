const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      default: 'SUPER_ADMIN'
    },
    tokenVersion: {
      type: Number,
      default: 0
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    avatarUrl: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'Central Administration'
    },
    officeLocation: {
      type: String,
      default: 'Corporate HQ'
    },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    notificationPreferences: {
      emailGatePass: { type: Boolean, default: true },
      emailApprovals: { type: Boolean, default: true },
      emailSystem: { type: Boolean, default: true }
    },
    activeSessions: [
      {
        sessionId: { type: String, required: true },
        deviceLabel: { type: String, default: 'Desktop Web' },
        browser: { type: String, default: 'Chrome' },
        ipAddress: { type: String, default: '127.0.0.1' },
        lastActiveAt: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    passwordHistory: [
      {
        hash: { type: String, required: true },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    pendingEmailChange: {
      newEmail: { type: String, lowercase: true, trim: true, default: null },
      otpHash: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

superAdminUserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

superAdminUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = superAdminUserSchema;
