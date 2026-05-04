import mongoose from 'mongoose';

const certificationProgramApplicationSchema = new mongoose.Schema({
  applicantType: {
    type: String,
    enum: ['Individual', 'Cooperative'],
    required: true,
  },
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  region: { type: String, required: true, trim: true },
  crop: { type: String, required: true, trim: true },
  farmerOrCooperativeId: { type: String, required: true, trim: true },
  transformationCenterName: { type: String, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  status: {
    type: String,
    enum: ['new', 'reviewing', 'approved', 'declined'],
    default: 'new',
  },
  createdAt: { type: Date, default: Date.now },
});

const CertificationProgramApplication = mongoose.model(
  'CertificationProgramApplication',
  certificationProgramApplicationSchema
);
export default CertificationProgramApplication;
