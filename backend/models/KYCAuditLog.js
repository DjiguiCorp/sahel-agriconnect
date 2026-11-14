import mongoose from 'mongoose';

const kycAuditLogSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investor',
      index: true,
    },
    investorEmail: { type: String, trim: true, lowercase: true, index: true },
    investorName: { type: String, trim: true },
    adminEmail: { type: String, required: true, trim: true, lowercase: true },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'flagged'],
      required: true,
    },
    notes: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    diditStatusAtReview: { type: String },
    documentType: { type: String },
  },
  { timestamps: false }
);

kycAuditLogSchema.index({ timestamp: -1 });

export default mongoose.model('KYCAuditLog', kycAuditLogSchema);
