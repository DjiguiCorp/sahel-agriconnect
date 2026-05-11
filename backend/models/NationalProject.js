import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    respondentId: mongoose.Schema.Types.ObjectId,
    respondentType: { type: String, enum: ['farmer', 'cooperative', 'processor'] },
    respondentName: String,
    respondentEmail: String,
    respondentPhone: String,
    response: {
      type: String,
      enum: ['interested', 'committed', 'declined', 'pending'],
      default: 'pending',
    },
    notes: String,
    respondedAt: Date,
  },
  { _id: false }
);

const schema = new mongoose.Schema({
  country: { type: String, required: true },
  countryCode: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentAdmin' },
  createdByName: String,
  organization: String,

  title: { type: String, required: true },
  titleFr: String,
  description: { type: String, required: true },
  descriptionFr: String,

  projectType: {
    type: String,
    enum: [
      'crop_program',
      'training',
      'export_liaison',
      'diaspora_initiative',
      'off_season',
      'certification_push',
      'business_development',
      'food_security',
      'other',
    ],
    required: true,
  },

  targetAudience: [{ type: String, enum: ['farmers', 'cooperatives', 'processors', 'diaspora', 'all'] }],
  targetCommodities: [String],
  targetRegions: [String],

  season: { type: String, enum: ['rainy', 'dry', 'both', 'year_round'] },
  startDate: Date,
  endDate: Date,

  incentives: String,
  incentivesFr: String,
  requirements: String,
  requirementsFr: String,

  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },

  responses: [responseSchema],
  broadcastSentAt: Date,
  broadcastCount: { type: Number, default: 0 },

  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  partnerCountries: [String],
  externalPartner: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('NationalProject', schema);

