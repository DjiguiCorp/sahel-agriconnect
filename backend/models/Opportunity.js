import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    label: String,
    percentOfTotal: { type: Number },
    targetDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'verified', 'released', 'missed'],
      default: 'pending',
    },
    amountReleased: Number,
    inspectorNotes: String,
  },
  { _id: false }
);

const opportunitySchema = new mongoose.Schema({
  // Identity
  centerName: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  region: { type: String, trim: true },

  // Classification
  commodity: { type: String, required: true },
  commodities: [String],
  track: { type: String, enum: ['Track A', 'Track B', 'Track C', 'All'], default: 'Track B' },
  certificationStatus: {
    type: String,
    enum: ['Local', 'Regional (ECOWAS)', 'International (EU/USDA)', 'Pending'],
    default: 'Local',
  },
  afriyieldScore: { type: Number, min: 0, max: 100, default: 0 },

  // Financials
  amountSought: { type: Number, required: true },
  amountRaised: { type: Number, default: 0 },
  minInvestment: { type: Number, default: 1000 },
  maxInvestment: { type: Number },
  expectedROIMin: { type: Number, default: 12 },
  expectedROIMax: { type: Number, default: 25 },
  cycledays: { type: Number, default: 120 },
  currency: { type: String, default: 'USD' },

  // Deal metadata
  description: { type: String, required: true, trim: true },
  descriptionFr: { type: String, trim: true },
  memberFarmers: { type: Number, default: 0 },
  productionCapacityKg: { type: Number },
  existingBuyers: { type: String, trim: true },
  insuranceCoverage: { type: Boolean, default: false },
  collateralDescription: { type: String },

  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'funded', 'in_progress', 'completed', 'closed'],
    default: 'pending',
  },
  milestones: [milestoneSchema],
  featured: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  premiumOnly: { type: Boolean, default: false },

  // Contact
  contactName: { type: String, trim: true },
  contactEmail: { type: String, trim: true },
  contactPhone: { type: String, trim: true },

  // Timestamps
  closingDate: Date,
  launchDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

opportunitySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

opportunitySchema.virtual('fundingPercent').get(function () {
  if (!this.amountSought) return 0;
  return Math.min(100, Math.round((this.amountRaised / this.amountSought) * 100));
});

opportunitySchema.virtual('daysRemaining').get(function () {
  if (!this.closingDate) return null;
  const diff = new Date(this.closingDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

opportunitySchema.set('toJSON', { virtuals: true });
opportunitySchema.set('toObject', { virtuals: true });

opportunitySchema.index({ status: 1 });
opportunitySchema.index({ country: 1 });
opportunitySchema.index({ track: 1 });
opportunitySchema.index({ featured: 1, status: 1 });
opportunitySchema.index({ closingDate: 1 });
opportunitySchema.index({ createdAt: -1 });

export default mongoose.model('Opportunity', opportunitySchema);
