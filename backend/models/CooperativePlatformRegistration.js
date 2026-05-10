import mongoose from 'mongoose';

const cooperativePlatformRegistrationSchema = new mongoose.Schema({
  cooperativeName: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  regionCity: { type: String, required: true, trim: true },
  memberCount: { type: Number, required: true, min: 0 },
  primaryCrops: [{ type: String, trim: true }],
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
  createdAt: { type: Date, default: Date.now },
});

const CooperativePlatformRegistration = mongoose.model(
  'CooperativePlatformRegistration',
  cooperativePlatformRegistrationSchema
);
export default CooperativePlatformRegistration;
