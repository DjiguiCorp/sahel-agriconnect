import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  centerName: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  commodity: {
    type: String,
    required: true,
    enum: ['Shea Butter', 'Sesame', 'Both'],
  },
  track: {
    type: String,
    required: true,
    enum: ['Track A', 'Track B', 'Both'],
  },
  certificationStatus: {
    type: String,
    enum: ['Local', 'Regional', 'International (USDA)'],
    default: 'Local',
  },
  amountSought: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  memberFarmers: {
    type: Number,
    default: 0,
    min: 0,
  },
  contactName: { type: String, trim: true },
  contactEmail: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
  existingBuyers: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'funded', 'closed'],
    default: 'pending',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);
export default Opportunity;
