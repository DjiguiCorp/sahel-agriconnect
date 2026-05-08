import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['investor', 'farmer', 'cooperative', 'diaspora_producer', 'diaspora_buyer'],
    required: true,
  },
  userName: String,
  userEmail: { type: String, required: true },
  hasActiveInvestment: { type: Boolean, default: false },
  activeInvestmentIds: [String],
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'notice_period', 'final_payout_pending', 'completed', 'cancelled'],
    default: 'pending',
  },
  noticePeriodStartDate: Date,
  scheduledDeletionDate: Date,
  finalPayoutSent: { type: Boolean, default: false },
  finalPayoutAmount: Number,
  adminNotes: String,
  confirmedByAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('DeletionRequest', schema);

