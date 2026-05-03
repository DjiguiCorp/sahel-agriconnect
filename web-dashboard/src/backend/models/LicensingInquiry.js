import mongoose from 'mongoose';

const LicensingInquirySchema = new mongoose.Schema(
  {
    organizationName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    role: { type: String, default: 'Other', trim: true },
    status: { type: String, default: 'new', trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'licensing_inquiries' }
);

export default mongoose.models.LicensingInquiry ||
  mongoose.model('LicensingInquiry', LicensingInquirySchema);

