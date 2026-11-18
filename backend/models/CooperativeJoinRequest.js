import mongoose from 'mongoose';

const cooperativeJoinRequestSchema = new mongoose.Schema({
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CooperativePlatformRegistration',
    required: true,
    index: true,
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
    index: true,
  },
  farmerName: { type: String, trim: true },
  farmerRegion: { type: String, trim: true },
  farmerCropTypes: [{ type: String, trim: true }],
  message: { type: String, default: '' },
  reason: { type: String, default: '' },
  status: {
    type: String,
    // `declined` = legacy web portal; `rejected` = Flutter / membership API
    enum: ['pending', 'approved', 'declined', 'rejected'],
    default: 'pending',
    index: true,
  },
  requestedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: String, trim: true },
});

cooperativeJoinRequestSchema.index({ cooperativeId: 1, status: 1 });

export default mongoose.model('CooperativeJoinRequest', cooperativeJoinRequestSchema);
