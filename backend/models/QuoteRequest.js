import mongoose from 'mongoose';

const quoteRequestSchema = new mongoose.Schema({
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  buyerName: { type: String, trim: true },
  companyName: { type: String, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  productWanted: { type: String, trim: true },
  quantityKg: { type: Number, min: 0 },
  deliveryCountry: { type: String, trim: true },
  message: { type: String, trim: true },
  status: { type: String, default: 'new', enum: ['new', 'contacted', 'quoted', 'closed'] },
  createdAt: { type: Date, default: Date.now }
});

quoteRequestSchema.index({ status: 1, createdAt: -1 });
quoteRequestSchema.index({ opportunityId: 1, createdAt: -1 });

const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);
export default QuoteRequest;

