import mongoose from 'mongoose';

const milestoneEventSchema = new mongoose.Schema(
  {
    milestoneNumber: { type: Number, required: true },
    label: String,
    scheduledDate: Date,
    verifiedDate: Date,
    releasedDate: Date,
    amountUSD: Number,
    percentOfTotal: Number,
    status: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'released', 'disputed', 'missed'],
      default: 'pending',
    },
    inspectorName: String,
    inspectorNotes: String,
    documentUrls: [String],
  },
  { _id: false }
);

const escrowSchema = new mongoose.Schema({
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
  investorEmail: String,
  investorName: String,
  supplierName: String,
  track: { type: String, enum: ['Track A', 'Track B', 'Track C'] },
  totalAmountUSD: { type: Number, required: true },
  afriyieldFeeUSD: Number,
  netToSupplierUSD: Number,
  escrowAgent: { type: String, default: 'LemonWay' },
  escrowReference: String,
  milestones: [milestoneEventSchema],
  status: {
    type: String,
    enum: [
      'funded',
      'milestone_1_pending',
      'milestone_1_complete',
      'milestone_2_pending',
      'milestone_2_complete',
      'milestone_3_pending',
      'completed',
      'disputed',
      'refunded',
    ],
    default: 'funded',
  },
  paymentMethod: String,
  paymentReference: String,
  fundsReceivedAt: Date,
  completedAt: Date,
  returnedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('EscrowTransaction', escrowSchema);
