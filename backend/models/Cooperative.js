import mongoose from 'mongoose';

const cooperativeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  localisation: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  responsable: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  membres: {
    type: Number,
    default: 0,
    min: 0
  },
  statut: {
    type: String,
    enum: ['Fonctionnelle', 'En développement', 'Inactive'],
    default: 'Fonctionnelle'
  },
  outils: {
    tracteurs: {
      type: Number,
      default: 0
    },
    sechoirs: {
      type: Number,
      default: 0
    },
    stockage: {
      type: String,
      enum: ['Oui', 'Non'],
      default: 'Non'
    },
    irrigationSolaire: {
      type: String,
      enum: ['Oui', 'Partiel', 'Non'],
      default: 'Non'
    },
    transformation: {
      type: String,
      enum: ['Oui', 'Non'],
      default: 'Non'
    }
  },
  produits: [{
    type: String
  }],
  capacite: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

cooperativeSchema.index({ region: 1 });
cooperativeSchema.index({ statut: 1 });

const Cooperative = mongoose.model('Cooperative', cooperativeSchema);

export default Cooperative;

