import mongoose from 'mongoose';

const cooperativePlatformRegistrationSchema = new mongoose.Schema({
  cooperativeName: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  regionCity: { type: String, required: true, trim: true },
  memberCount: { type: Number, required: true, min: 0 },
  tier: {
    type: String,
    enum: ['starter', 'growth'],
    default: 'starter',
  },
  certificationEligible: { type: Boolean, default: false },
  afriyieldEligible: { type: Boolean, default: false },
  exportEligible: { type: Boolean, default: false },
  /** Path B Growth: provisional access until verifiedCount >= 25 */
  pendingFullVerification: { type: Boolean, default: false },
  gracePeriodStartDate: { type: Date },
  primaryCrops: [{ type: String, trim: true }],
  autresCrops: { type: String, trim: true },
  certificationStatus: { type: String, trim: true },
  leaderName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  interests: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['pending_payment', 'pending', 'active', 'declined', 'suspended'],
    default: 'pending_payment',
  },
  paymentReceived: { type: Boolean, default: false },
  paymentDate: { type: Date },
  paymentMethod: { type: String },
  activatedAt: { type: Date },
  /** Growth subscription window (optional; set on Stripe activation) */
  subscriptionExpiresAt: { type: Date },
  subscriptionRenewedAt: { type: Date },
  emailVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  /** Admin membership / legitimacy verification (Growth) */
  verificationStatus: {
    type: String,
    enum: ['unverified', 'verified', 'flagged'],
    default: 'unverified',
  },
  verifiedBy: { type: String, trim: true },
  verificationNotes: { type: String, trim: true },
  passwordHash: { type: String },
  tempPassword: { type: String },
  /** Linked transformation / processing partner */
  processorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Processor',
    default: null,
  },
  processorName: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
  fcmToken: { type: String },
  fcmUpdatedAt: Date,
});

const CooperativePlatformRegistration = mongoose.model(
  'CooperativePlatformRegistration',
  cooperativePlatformRegistrationSchema
);
export default CooperativePlatformRegistration;
