import mongoose from 'mongoose';

const expertRequestSchema = new mongoose.Schema({
  farmerName: { type: String, required: true, trim: true },
  farmerEmail: { type: String, required: true, trim: true, lowercase: true },
  farmerPhone: { type: String, trim: true },
  country: { type: String, trim: true },
  region: { type: String, trim: true },
  cropType: { type: String, trim: true },
  problemDescription: { type: String, required: true, trim: true },
  diseaseDetected: { type: String, trim: true },
  cooperativeMember: { type: Boolean, default: false },
  cooperativeName: { type: String, trim: true },
  cooperativeId: { type: String, trim: true },
  routedTo: {
    type: String,
    enum: ['admin', 'cooperative_and_admin'],
    default: 'admin',
  },
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'whatsapp'],
    default: 'email',
  },
  urgency: {
    type: String,
    enum: ['immediate', 'within_week', 'seasonal'],
    default: 'within_week',
  },
  status: {
    type: String,
    enum: ['new', 'assigned', 'in_progress', 'resolved'],
    default: 'new',
  },
  assignedExpert: { type: String, default: null },
  source: {
    type: String,
    enum: ['disease_detection', 'think_tank', 'soil_diagnosis', 'direct'],
    default: 'direct',
  },
  createdAt: { type: Date, default: Date.now },
});

const ExpertRequest = mongoose.model('ExpertRequest', expertRequestSchema);
export default ExpertRequest;
