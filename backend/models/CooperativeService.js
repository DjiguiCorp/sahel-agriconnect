import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative' },
  cooperativeName: String,
  country: String,
  region: String,
  services: [
    {
      type: {
        type: String,
        enum: [
          'tractor',
          'irrigation',
          'cold_storage',
          'training',
          'micro_loan',
          'solar_pump',
          'processing',
          'transport',
        ],
      },
      available: { type: Boolean, default: true },
      capacity: String,
      pricePerUse: Number,
      currency: { type: String, default: 'USD' },
      description: String,
      bookingRequired: { type: Boolean, default: true },
    },
  ],
  maxMembers: Number,
  currentMembers: { type: Number, default: 0 },
  openForNewMembers: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CooperativeService', schema);
