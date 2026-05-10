import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  farmerName: String,
  farmerPhone: String,
  farmerEmail: String,
  cooperativeName: String,
  country: String,
  region: String,
  needType: {
    type: String,
    enum: [
      'equipment',
      'training',
      'certification',
      'irrigation',
      'seeds',
      'financing',
      'market_access',
      'other',
    ],
    required: true,
  },
  specificEquipment: [String],
  description: String,
  urgencyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: {
    type: String,
    enum: ['submitted', 'received_by_cooperative', 'processing', 'fulfilled', 'declined'],
    default: 'submitted',
  },
  cooperativeResponse: String,
  adminNotes: String,
  fulfilledAt: Date,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('FarmerNeed', schema);
