import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  code: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['farmer_verify', 'coop_verify', 'login', 'password_reset'],
    required: true,
  },
  used: { type: Boolean, default: false },
  registrationUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  country: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('VerificationCode', schema);
