import mongoose from 'mongoose';
import crypto from 'crypto';

const deviceSessionSchema = new mongoose.Schema({
  // SHA-256 hash of the raw sessionSeed — never store plain text
  seedHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['farmer', 'investor', 'cooperative', 'government', 'ngo', 'processor'],
  },
  // Device hint — not used for auth, only for admin visibility
  deviceHint: { type: String, default: '' },
  // Expires in 1 year — user must do a full OTP login once a year max
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    index: { expires: 0 },
  },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
});

// Hash a raw seed before storing or looking up
deviceSessionSchema.statics.hashSeed = function (rawSeed) {
  return crypto.createHash('sha256').update(rawSeed).digest('hex');
};

// Issue a new device session — returns the raw seed (only returned once, to client)
deviceSessionSchema.statics.issue = async function (userId, role, deviceHint = '') {
  const rawSeed = crypto.randomBytes(32).toString('hex');
  const seedHash = this.hashSeed(rawSeed);
  await this.create({ seedHash, userId, role, deviceHint });
  return rawSeed;
};

// Validate a raw seed — returns the session doc if valid, null otherwise
deviceSessionSchema.statics.validate = async function (rawSeed) {
  const seedHash = this.hashSeed(rawSeed);
  const session = await this.findOne({
    seedHash,
    expiresAt: { $gt: new Date() },
  });
  if (session) {
    session.lastUsedAt = new Date();
    await session.save();
  }
  return session;
};

export default mongoose.model('DeviceSession', deviceSessionSchema);
