import mongoose from 'mongoose';

const licensingInquirySchema = new mongoose.Schema({
  organizationName: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  contactName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  role: { type: String, required: true, trim: true },
  status: {
    type: String,
    default: 'new',
    trim: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const LicensingInquiry = mongoose.model('LicensingInquiry', licensingInquirySchema);
export default LicensingInquiry;
