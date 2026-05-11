import mongoose from 'mongoose';

const licensingInquirySchema = new mongoose.Schema({
  organizationName: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  region: { type: String, trim: true, default: '' },
  contactName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  role: { type: String, required: true, trim: true },
  orgType: { type: String, trim: true, default: '' },
  website: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  targetCountries: { type: String, trim: true, default: '' },
  primaryGoal: { type: String, trim: true, default: '' },
  source: { type: String, trim: true, default: '' },
  status: {
    type: String,
    default: 'new',
    trim: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const LicensingInquiry = mongoose.model('LicensingInquiry', licensingInquirySchema);
export default LicensingInquiry;
