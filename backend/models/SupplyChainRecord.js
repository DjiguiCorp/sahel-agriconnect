import mongoose from 'mongoose';

const supplyChainRecordSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true, unique: true },
  commodity: { type: String, required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  farmerName: String,
  farmerCountry: String,
  farmerRegion: String,
  cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative' },
  cooperativeName: String,
  processorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Processor' },
  processorName: String,
  harvestDate: Date,
  processingDate: Date,
  quantityHarvestedKg: Number,
  quantityProcessedKg: Number,
  certificationStatus: { type: String, enum: ['None', 'Local', 'Regional', 'USDA', 'EU Organic'] },
  qualityGrade: { type: String, enum: ['A', 'B', 'C', 'Export Grade'] },
  buyerName: String,
  buyerCountry: String,
  exportDate: Date,
  exportValueUSD: Number,
  status: {
    type: String,
    enum: ['harvest', 'processing', 'certified', 'sold', 'exported'],
    default: 'harvest',
  },
  documents: [{ type: String }],
  adminNotes: String,
  createdAt: { type: Date, default: Date.now },
});

supplyChainRecordSchema.index({ status: 1, createdAt: -1 });
supplyChainRecordSchema.index({ buyerCountry: 1, createdAt: -1 });

export default mongoose.model('SupplyChainRecord', supplyChainRecordSchema);

