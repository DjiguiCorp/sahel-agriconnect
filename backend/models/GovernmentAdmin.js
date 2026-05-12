import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const schema = new mongoose.Schema({
  country: { type: String, required: true },
  countryCode: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  organization: { type: String },
  orgType: {
    type: String,
    enum: ['government', 'ngo', 'enterprise', 'international_org'],
    default: 'government',
  },
  accessTier: {
    type: String,
    enum: ['pilot', 'standard', 'enterprise'],
    default: 'pilot',
  },
  role: { type: String, default: 'country_admin' },
  licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'CountryLicense' },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },
  permissions: {
    viewFarmers: { type: Boolean, default: true },
    viewCooperatives: { type: Boolean, default: true },
    viewProcessors: { type: Boolean, default: true },
    createProjects: { type: Boolean, default: true },
    exportData: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
  },
  lastLogin: Date,
  dataCenter: { type: String, default: 'shared' },
  createdAt: { type: Date, default: Date.now },
  fcmToken: { type: String },
  fcmUpdatedAt: Date,
});

schema.methods.verifyPassword = async function (pw) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(pw, this.passwordHash);
};

schema.statics.hashPassword = async function (pw) {
  return bcrypt.hash(pw, 12);
};

export default mongoose.model('GovernmentAdmin', schema);

