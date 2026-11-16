import mongoose from 'mongoose';

const memberDuesPaymentSchema = new mongoose.Schema({
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CooperativePlatformRegistration',
    required: true,
    index: true,
  },
  memberType: {
    type: String,
    enum: ['platform', 'manual'],
    required: true,
  },
  memberId: { type: String, required: true, index: true },
  memberName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'XOF' },
  paymentMethod: {
    type: String,
    enum: ['orange_money', 'wave', 'mtn', 'cash', 'bank_transfer', 'other'],
    required: true,
  },
  paymentReference: { type: String, trim: true, default: '' },
  periodMonth: { type: Number, min: 1, max: 12, default: null },
  periodYear: { type: Number, default: null },
  notes: { type: String, trim: true, default: '' },
  recordedBy: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

memberDuesPaymentSchema.index({ cooperativeId: 1, periodYear: 1, periodMonth: 1 });
memberDuesPaymentSchema.index({ cooperativeId: 1, memberId: 1 });

export default mongoose.model('MemberDuesPayment', memberDuesPaymentSchema);
