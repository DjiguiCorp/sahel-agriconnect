import mongoose from 'mongoose';

const officialKycSchema = new mongoose.Schema(
  {
    fullLegalName: { type: String, required: true, trim: true },
    officialTitle: { type: String, required: true, trim: true },
    ministryDepartment: { type: String, required: true, trim: true },
    governmentIdNumber: { type: String, required: true, trim: true },
    authorizationReference: { type: String, required: true, trim: true },
    officialPhone: { type: String, required: true, trim: true },
    officialEmail: { type: String, required: true, trim: true, lowercase: true },
    digitalSignatureAck: { type: Boolean, required: true },
    signedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const schema = new mongoose.Schema({
  country: { type: String, required: true, index: true },
  countryCode: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentAdmin' },
  createdByName: String,
  organization: String,

  directiveType: {
    type: String,
    enum: [
      'policy_directive',
      'coop_registration_drive',
      'export_opportunity',
      'traceability_mandate',
      'project_delegation',
    ],
    required: true,
  },

  title: { type: String, required: true, trim: true },
  titleFr: String,
  body: { type: String, required: true },
  bodyFr: String,

  targetAudience: [{ type: String, enum: ['farmers', 'cooperatives', 'processors', 'all'] }],
  targetRegions: [String],
  assignedCooperativeIds: [{ type: mongoose.Schema.Types.ObjectId }],
  linkedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalProject' },

  effectiveDate: Date,
  reviewDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'broadcast', 'archived'],
    default: 'draft',
  },

  officialKyc: { type: officialKycSchema, required: true },

  broadcastSentAt: Date,
  broadcastCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('GovernmentDirective', schema);
