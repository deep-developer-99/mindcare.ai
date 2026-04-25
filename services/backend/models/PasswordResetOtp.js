const mongoose = require('mongoose');

const passwordResetOtpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    channel: {
      type: String,
      enum: ['email', 'mobile'],
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    otpHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    consumed: {
      type: Boolean,
      default: false
    },
    consumedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'password_reset_otp'
  }
);

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
