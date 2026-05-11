import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['farmer_verify', 'coop_verify', 'login', 'password_reset'], required: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('VerificationCode', schema);
