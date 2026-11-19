import mongoose from 'mongoose';
import crypto from 'crypto';

const TYPE_PREFIX = {
  cooperative_growth: 'COOP',
  transformation_monthly: 'PROC',
};

function generateReferenceCode(subscriptionType) {
  const prefix = TYPE_PREFIX[subscriptionType] || 'PAY';
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `SAC-${prefix}-${year}-${rand}`;
}

const mobileMoneyPaymentSchema = new mongoose.Schema(
  {
    referenceCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    entityType: {
      type: String,
      enum: ['cooperative', 'transformation_center'],
      required: true,
    },
    entityId: { type: String, required: true, trim: true },
    entityName: { type: String, trim: true, default: '' },
    entityEmail: { type: String, trim: true, lowercase: true, default: '' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    amountXOF: { type: Number, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['orange_money', 'wave', 'cash', 'stripe'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
      index: true,
    },
    confirmedBy: { type: String, trim: true },
    confirmedAt: { type: Date },
    rejectionReason: { type: String, trim: true, default: '' },
    subscriptionType: {
      type: String,
      enum: ['cooperative_growth', 'transformation_monthly'],
      required: true,
    },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

mobileMoneyPaymentSchema.pre('validate', function assignReference(next) {
  if (!this.referenceCode) {
    this.referenceCode = generateReferenceCode(this.subscriptionType);
  }
  if (this.amount != null && (this.amountXOF == null || this.amountXOF === undefined)) {
    this.amountXOF = Math.round(Number(this.amount) * 600);
  }
  next();
});

mobileMoneyPaymentSchema.index({ entityId: 1, createdAt: -1 });
mobileMoneyPaymentSchema.index({ entityEmail: 1, createdAt: -1 });

export { generateReferenceCode };
export default mongoose.model('MobileMoneyPayment', mobileMoneyPaymentSchema);
