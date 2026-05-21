import mongoose from 'mongoose';

const investorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: { type: String, trim: true },
  countryOfResidence: { type: String, trim: true },
  investmentTrack: {
    type: String,
    enum: ['Track A', 'Track B', 'Both'],
    required: true,
  },
  commodityInterest: {
    type: String,
    enum: ['Shea Butter', 'Sesame', 'Both'],
    required: true,
  },
  investmentRange: { type: String, trim: true },
  heardFrom: { type: String, trim: true },
  message: { type: String, trim: true },
  status: {
    type: String,
    // Keep legacy values for compatibility, plus new pipeline workflow
    enum: [
      'new',
      'contacted',
      'active',
      'declined',
      'New',
      'Call Scheduled',
      'Call Completed',
      'Opportunity Sent',
      'Investment Active',
      'Paid Out',
    ],
    default: 'New',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  fcmToken: { type: String },
  fcmUpdatedAt: Date,
  kycStatus: {
    type: String,
    enum: [
      'not_started', 'in_progress',
      'african_pending_review', 'pending_review',
      'pending_kyc', 'additional_docs',
      'approved', 'rejected', 'suspended',
    ],
    default: 'not_started',
  },
  kycSubmittedAt: { type: Date },
  kycReviewedAt: { type: Date },
  countryCategory: {
    type: String,
    enum: ['african', 'diaspora', 'other'],
  },
});

const Investor = mongoose.model('Investor', investorSchema);
export default Investor;
