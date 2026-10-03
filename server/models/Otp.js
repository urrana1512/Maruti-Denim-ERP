const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['REGISTRATION', 'PASSWORD_RESET'],
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Mongoose TTL index to automatically drop expired OTP documents
    },
    attempts: {
      type: Number,
      default: 0
    },
    resendCount: {
      type: Number,
      default: 1
    },
    lastResentAt: {
      type: Date,
      default: Date.now
    },
    lockUntil: {
      type: Date,
      default: null
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    registrationData: {
      type: Object,
      default: null
    }
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('Otp', otpSchema);
