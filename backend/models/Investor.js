import mongoose from 'mongoose';

const investorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: { type: String, trim: true },
  countryOfResidence: { type: String, trim: true },
  investmentTrack: {
    type: String,
    enum: ['Track A', 'Track B', 'Both'],
    required: true,
  },
  commodityInterest: {
    type: String,
    enum: ['Shea Butter', 'Sesame', 'Both'],
    required: true,
  },
  investmentRange: { type: String, trim: true },
  heardFrom: { type: String, trim: true },
  message: { type: String, trim: true },
  status: {
    type: String,
    enum: ['new', 'contacted', 'active', 'declined'],
    default: 'new',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Investor = mongoose.model('Investor', investorSchema);
export default Investor;
