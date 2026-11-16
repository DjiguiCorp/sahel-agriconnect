import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    maxScore: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const ICSScoreSchema = new mongoose.Schema({
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CooperativePlatformRegistration',
    unique: true,
    required: true,
    index: true,
  },
  scoreTotal: { type: Number, default: 0 },
  breakdown: {
    memberRecords: { type: categorySchema, default: () => ({ score: 0, maxScore: 20, notes: '' }) },
    harvestLogs: { type: categorySchema, default: () => ({ score: 0, maxScore: 20, notes: '' }) },
    inputTracking: { type: categorySchema, default: () => ({ score: 0, maxScore: 15, notes: '' }) },
    plotDocumentation: { type: categorySchema, default: () => ({ score: 0, maxScore: 15, notes: '' }) },
    coopVerification: { type: categorySchema, default: () => ({ score: 0, maxScore: 20, notes: '' }) },
    subscriptionActive: { type: categorySchema, default: () => ({ score: 0, maxScore: 10, notes: '' }) },
  },
  readinessLevel: {
    type: String,
    enum: ['not_ready', 'developing', 'nearly_ready', 'audit_ready'],
    default: 'not_ready',
  },
  missingItems: [String],
  recommendations: [String],
  lastComputedAt: { type: Date },
});

export default mongoose.model('ICSScore', ICSScoreSchema);
