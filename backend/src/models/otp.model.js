import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },
  otpHash: {
    type: String,
    default: null,
  },
  resetTokenHash: {
    type: String,
    default: null,
  },
  purpose: {
    type: String,
    enum: ['otp', 'password_reset', 'signup', 'signup_verified'],
    default: 'otp',
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
}, {
  timestamps: true,
});

otpSchema.index({ email: 1, expiresAt: 1 });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
