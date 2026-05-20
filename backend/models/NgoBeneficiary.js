import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentAdmin', required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'NgoProgram' },
  programName: String,
  country: String,

  name: { type: String, required: true },
  phone: String,
  region: String,
  mainCrop: String,
  gender: { type: String, enum: ['female', 'male', 'other', 'unspecified'], default: 'unspecified' },

  syncedWithRegistry: { type: Boolean, default: false },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },

  registeredAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ organizationId: 1, programId: 1 });

export default mongoose.model('NgoBeneficiary', schema);
