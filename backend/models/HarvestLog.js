import mongoose from 'mongoose';
import crypto from 'crypto';

const inputSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['fertilizer', 'pesticide', 'organic', 'none'],
      default: 'none',
    },
    quantity: { type: Number, default: null },
    unit: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const harvestLogSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
    index: true,
  },
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CooperativePlatformRegistration',
    index: true,
  },
  cropType: { type: String, required: true, trim: true },
  plotGps: {
    lat: { type: Number },
    lng: { type: Number },
  },
  plotSizeHectares: { type: Number, min: 0 },
  harvestDate: { type: Date, required: true },
  quantityKg: { type: Number, required: true, min: 0 },
  inputs: { type: [inputSchema], default: [] },
  storageLocation: { type: String, trim: true, default: '' },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'ungraded'],
    default: 'ungraded',
  },
  notes: { type: String, trim: true, default: '' },
  batchId: { type: String, unique: true, required: true, index: true },
  verifiedByCoop: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verifiedBy: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

harvestLogSchema.index({ farmerId: 1, createdAt: -1 });
harvestLogSchema.index({ cooperativeId: 1, verifiedByCoop: 1, createdAt: -1 });

export function generateHarvestBatchId() {
  const year = new Date().getFullYear();
  const shortId = crypto.randomBytes(3).toString('hex'); // 6 hex chars
  return `SAC-${year}-${shortId}`;
}

export default mongoose.model('HarvestLog', harvestLogSchema);
