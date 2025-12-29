import mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema({
  producteur: {
    type: String,
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  produit: {
    type: String,
    required: true
  },
  quantite: {
    type: String,
    required: true
  },
  niveau: {
    type: String,
    enum: ['local', 'regional', 'international'],
    required: true
  },
  statut: {
    type: String,
    enum: ['En inspection', 'Conforme', 'Non conforme', 'En attente'],
    default: 'En attente'
  },
  dateInspection: {
    type: Date,
    default: Date.now
  },
  conformite: {
    type: String,
    default: 'En attente'
  },
  notes: {
    type: String,
    default: ''
  },
  inspecteur: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

certificationSchema.index({ niveau: 1 });
certificationSchema.index({ statut: 1 });
certificationSchema.index({ farmerId: 1 });

const Certification = mongoose.model('Certification', certificationSchema);

export default Certification;

