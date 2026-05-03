import mongoose from 'mongoose';

const EquipmentFundApplicationSchema = new mongoose.Schema(
  {
    cooperativeName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    equipmentNeeded: { type: [String], default: [] },
    estimatedValue: { type: Number, default: 0 },
    farmersBenefiting: { type: Number, default: 0 },
    email: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, default: 'pending', trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'equipment_fund_applications' }
);

export default mongoose.models.EquipmentFundApplication ||
  mongoose.model('EquipmentFundApplication', EquipmentFundApplicationSchema);

