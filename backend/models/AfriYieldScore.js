import mongoose from 'mongoose';

const scoreEventSchema = new mongoose.Schema(
  {
    event: String,
    points: Number,
    date: { type: Date, default: Date.now },
    transactionId: mongoose.Schema.Types.ObjectId,
  },
  { _id: false }
);

const afriyieldScoreSchema = new mongoose.Schema({
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityType: { type: String, enum: ['cooperative', 'processor', 'investor', 'supplier'] },
  entityName: String,
  country: String,
  score: { type: Number, default: 0, min: 0, max: 100 },
  completedTransactions: { type: Number, default: 0 },
  totalVolumeUSD: { type: Number, default: 0 },
  onTimeDeliveryRate: { type: Number, default: 0 },
  qualityPassRate: { type: Number, default: 0 },
  disputeCount: { type: Number, default: 0 },
  events: [scoreEventSchema],
  verifiedByAfriYield: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('AfriYieldScore', afriyieldScoreSchema);
