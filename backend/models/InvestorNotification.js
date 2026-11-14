import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  investorEmail: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: [
      'payout',
      'opportunity',
      'commodity',
      'update',
      'welcome',
      'kyc_submitted',
      'kyc_approved',
      'kyc_rejected',
      'kyc_additional_docs',
      'payment_verified',
      'investment_confirmed',
      'escrow_milestone',
    ],
    default: 'update',
  },
  title: String,
  message: String,
  lang: { type: String, enum: ['en', 'fr'] },
  read: { type: Boolean, default: false },
  link: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('InvestorNotification', schema);
