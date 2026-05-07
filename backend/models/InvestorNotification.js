import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  investorEmail: { type: String, required: true, index: true },
  type: { type: String, enum: ['payout', 'opportunity', 'commodity', 'update', 'welcome'], default: 'update' },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  link: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('InvestorNotification', schema);
