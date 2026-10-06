const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    roleName: {
      type: String,
      default: 'Department Staff'
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE'],
      default: 'PENDING_APPROVAL'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      default: null
    },
    tokenVersion: {
      type: Number,
      default: 0
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: String,
      default: null
    },

    // Profile Management Fields
    avatarUrl: {
      type: String,
      default: null
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      default: null
    },
    employeeCode: {
      type: String,
      trim: true,
      default: null
    },
    officeLocation: {
      type: String,
      trim: true,
      default: 'Main Plant'
    },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    dateOfJoining: {
      type: Date,
      default: null
    },
    notificationPreferences: {
      emailGatePass: { type: Boolean, default: true },
      emailApprovals: { type: Boolean, default: true },
      emailSystem: { type: Boolean, default: true }
    },
    displayPreferences: {
      pageSize: { type: Number, default: 10 },
      compactMode: { type: Boolean, default: false }
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

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ status: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);
