import mongoose from 'mongoose';

const diasporaContactInquirySchema = new mongoose.Schema({
  contactName: { type: String, required: true, trim: true },
  contactEmail: { type: String, trim: true },
  contactPhone: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  producerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiasporaProducer', required: true },
  createdAt: { type: Date, default: Date.now }
});

diasporaContactInquirySchema.index({ producerId: 1, createdAt: -1 });

const DiasporaContactInquiry = mongoose.model('DiasporaContactInquiry', diasporaContactInquirySchema);

export default DiasporaContactInquiry;

