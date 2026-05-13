import mongoose from 'mongoose';

const CropPriceSchema = new mongoose.Schema(
  {
    commodity: { type: String, required: true },
    commodityFr: String,
    emoji: String,
    pricePerKgUsd: { type: Number, required: true },
    pricePerKgXof: Number,
    weeklyChangePercent: { type: Number, default: 0 },
    trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
    sourceMarket: String,
  },
  { timestamps: true }
);

CropPriceSchema.index({ commodity: 1 }, { unique: true });

export default mongoose.model('CropPrice', CropPriceSchema);
