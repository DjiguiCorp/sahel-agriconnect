import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
  investorEmail: { type: String, required: true },
  plan: { type: String, enum: ['monthly', 'annual'], default: 'annual' },
  priceUSD: Number,
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  paymentMethod: String,
  paymentReference: String,
  cancelledAt: Date,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('PremiumSubscription', subscriptionSchema);
