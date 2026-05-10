import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  farmerName: String,
  farmerPhone: String,
  farmerEmail: String,
  cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative' },
  cooperativeName: String,
  serviceType: { type: String, required: true },
  requestedDate: Date,
  durationHours: Number,
  landAreaHa: Number,
  estimatedCostUSD: Number,
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'completed', 'cancelled'],
    default: 'requested',
  },
  notes: String,
  country: String,
  region: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ServiceBooking', schema);
