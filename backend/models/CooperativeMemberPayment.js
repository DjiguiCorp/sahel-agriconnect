import mongoose from 'mongoose';

const cooperativeMemberPaymentSchema = new mongoose.Schema({
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
  farmerName: { type: String, trim: true, default: '' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'XOF' },
  paymentMethod: {
    type: String,
    enum: ['Orange Money', 'MTN Mobile Money', 'Cash', 'Virement bancaire', 'Autre'],
    required: true,
  },
  reference: { type: String, trim: true, default: '' },
  date: { type: Date, required: true },
  recordedBy: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CooperativeMemberPayment', cooperativeMemberPaymentSchema);
