import mongoose from 'mongoose';

const countryLicenseSchema = new mongoose.Schema({
  organizationName: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String },
  role: { type: String },
  licenseType: {
    type: String,
    enum: ['pilot', 'standard', 'enterprise'],
    default: 'pilot',
  },
  status: {
    type: String,
    enum: ['inquiry', 'pilot', 'active', 'suspended', 'expired'],
    default: 'inquiry',
  },
  monthlyFee: { type: Number, default: 999 },
  pilotStartDate: { type: Date },
  licenseStartDate: { type: Date },
  licenseEndDate: { type: Date },
  farmerCount: { type: Number, default: 0 },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CountryLicense', countryLicenseSchema);

