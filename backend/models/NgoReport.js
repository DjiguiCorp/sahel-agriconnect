import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentAdmin', required: true },
  organizationName: String,
  country: String,

  reportType: {
    type: String,
    enum: ['beneficiary', 'program', 'cooperative', 'impact'],
    required: true,
  },
  title: { type: String, required: true },
  titleFr: String,

  fileName: String,
  fileSize: Number,
  mimeType: { type: String, default: 'application/pdf' },

  /** Snapshot used to render / audit the report */
  dataSnapshot: { type: mongoose.Schema.Types.Mixed },

  generatedAt: { type: Date, default: Date.now },
  generatedBy: String,

  /** Base64-encoded PDF bytes (excluded from list queries) */
  pdfBase64: { type: String, select: false },
});

schema.index({ organizationId: 1, generatedAt: -1 });

export default mongoose.model('NgoReport', schema);
