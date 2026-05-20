import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'GovernmentAdmin', required: true },
  organizationName: String,
  country: { type: String, required: true },

  name: { type: String, required: true },
  objectives: String,
  region: String,
  type: {
    type: String,
    enum: ['value_chain', 'empowerment', 'training', 'food_security', 'climate', 'finance', 'other'],
    default: 'value_chain',
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed'],
    default: 'planning',
  },

  beneficiaries: { type: Number, default: 0 },
  target: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },

  startDate: Date,
  endDate: Date,
  startLabel: String,
  endLabel: String,

  sdgGoals: [{ type: Number }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

schema.index({ organizationId: 1, status: 1 });

export default mongoose.model('NgoProgram', schema);
