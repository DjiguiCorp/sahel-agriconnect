import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    payoutDate: Date,
    amount: Number,
    status: { type: String, enum: ['scheduled', 'paid', 'delayed'], default: 'scheduled' },
    notes: String,
  },
  { _id: false }
);

const investmentSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
  investorName: String,
  investorEmail: String,
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  opportunityName: String,
  track: { type: String, enum: ['Track A', 'Track B', 'Track C', 'Both'] },
  commodity: String,
  amountDeployed: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  deploymentDate: { type: Date, default: Date.now },
  expectedROIPercent: { type: Number, default: 8 },
  payoutSchedule: [payoutSchema],
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  adminNotes: String,
  createdAt: { type: Date, default: Date.now },
});

investmentSchema.index({ investorEmail: 1, createdAt: -1 });
investmentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Investment', investmentSchema);

