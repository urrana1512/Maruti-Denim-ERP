const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    address: {
      type: String,
      default: ''
    },
    gstNo: {
      type: String,
      default: ''
    },
    dbName: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    adminEmail: {
      type: String,
      default: ''
    },
    adminName: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: '/Maruti%20denim%20logo.png'
    }
  },
  { timestamps: true }
);

module.exports = companySchema;
