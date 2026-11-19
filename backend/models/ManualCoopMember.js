import mongoose from 'mongoose';

const manualCoopMemberSchema = new mongoose.Schema({
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CooperativePlatformRegistration',
    required: true,
    index: true,
  },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  village: { type: String, trim: true, default: '' },
  region: { type: String, trim: true, default: '' },
  cropTypes: { type: [String], default: [] },
  hectares: { type: Number, default: null },
  joinedDate: { type: Date, default: Date.now },
  notes: { type: String, trim: true, default: '' },
  platformLinked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

manualCoopMemberSchema.index({ cooperativeId: 1, phone: 1 });

export default mongoose.model('ManualCoopMember', manualCoopMemberSchema);
