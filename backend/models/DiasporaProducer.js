import mongoose from 'mongoose';

const diasporaProducerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  cooperativeName: { type: String, trim: true },
  country: { type: String, required: true, trim: true },
  region: { type: String, trim: true },
  products: [{ type: String, trim: true }],
  monthlyVolumeKg: { type: Number, min: 0 },
  certification: { type: String, default: 'Aucune', trim: true },
  email: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  whatsapp: { type: String, trim: true },
  exportExperience: {
    type: String,
    enum: ['none', 'local', 'regional', 'international'],
    default: 'none'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'active', 'inactive'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

// Helpful indexes for common reads
diasporaProducerSchema.index({ status: 1, createdAt: -1 });
diasporaProducerSchema.index({ country: 1 });

const DiasporaProducer = mongoose.model('DiasporaProducer', diasporaProducerSchema);

export default DiasporaProducer;

