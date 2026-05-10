import mongoose from 'mongoose';

const equipmentFundApplicationSchema = new mongoose.Schema({
  cooperativeName: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  region: { type: String, trim: true, default: '' },
  equipmentNeeded: [{ type: String, trim: true }],
  estimatedValue: { type: Number, required: true, min: 0 },
  farmersBenefiting: { type: Number, required: true, min: 0 },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true, default: '' },
  urgencyLevel: { type: String, trim: true, default: 'medium' },
  additionalNeeds: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'declined'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

const EquipmentFundApplication = mongoose.model(
  'EquipmentFundApplication',
  equipmentFundApplicationSchema
);
export default EquipmentFundApplication;
