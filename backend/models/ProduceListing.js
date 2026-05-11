import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CooperativePlatformRegistration' },
  farmerName: String,
  farmerPhone: String,
  farmerEmail: String,
  cooperativeName: String,
  country: String,
  region: String,
  commodity: { type: String, required: true },
  variety: String,
  quantityKg: { type: Number, required: true },
  pricePerKgUSD: { type: Number, required: true },
  availableFrom: Date,
  availableUntil: Date,
  certificationLevel: {
    type: String,
    enum: ['None', 'Local', 'Regional', 'International'],
    default: 'None',
  },
  qualityGrade: { type: String, enum: ['A', 'B', 'C', 'Export Grade'], default: 'B' },
  description: String,
  photos: [String],
  minimumOrderKg: { type: Number, default: 50 },
  visibility: {
    type: String,
    enum: ['cooperative_only', 'platform', 'marketplace'],
    default: 'cooperative_only',
  },
  listingType: {
    type: String,
    enum: ['cooperative_supply', 'direct_sale'],
    default: 'cooperative_supply',
  },
  cooperativeApproved: { type: Boolean, default: false },
  cooperativeApprovedAt: Date,
  promotedToMarketplace: { type: Boolean, default: false },
  promotedAt: Date,
  status: { type: String, enum: ['active', 'sold', 'expired', 'pending'], default: 'active' },
  viewCount: { type: Number, default: 0 },
  inquiryCount: { type: Number, default: 0 },
  totalEarningsUSD: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ProduceListing', schema);
