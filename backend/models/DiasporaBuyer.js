import mongoose from 'mongoose';

const diasporaBuyerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  businessName: { type: String, required: true, trim: true },
  businessType: {
    type: String,
    enum: ['restaurant', 'retailer', 'distributor', 'manufacturer', 'importer', 'other']
  },
  cityState: { type: String, trim: true },
  country: { type: String, default: 'USA', trim: true },
  productsSought: [{ type: String, trim: true }],
  monthlyVolumeNeededKg: { type: Number, min: 0 },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  whatsapp: { type: String, trim: true },
  importExperience: { type: Boolean, default: false },
  certificationRequired: { type: String, trim: true },
  status: { type: String, enum: ['new', 'contacted', 'matched', 'active'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

diasporaBuyerSchema.index({ status: 1, createdAt: -1 });
diasporaBuyerSchema.index({ email: 1 });

const DiasporaBuyer = mongoose.model('DiasporaBuyer', diasporaBuyerSchema);

export default DiasporaBuyer;

