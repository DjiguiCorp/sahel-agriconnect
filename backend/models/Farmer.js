import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  telephone: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: String,
    required: true
  },
  longitude: {
    type: String,
    required: true
  },
  localisation: {
    type: String,
    default: function() {
      return `${this.latitude}, ${this.longitude}`;
    }
  },
  superficie: {
    type: Number,
    required: true,
    min: 0
  },
  cultures: [{
    type: String,
    required: true
  }],
  region: {
    type: String,
    required: true
  },
  typeExploitation: {
    type: String,
    enum: ['Familiale', 'Commerciale/Indépendante'],
    required: true
  },
  lienCooperative: {
    type: String,
    enum: ['Oui', 'Non'],
    default: 'Non'
  },
  nomCooperative: {
    type: String,
    default: ''
  },
  roleCooperative: {
    type: String,
    default: ''
  },
  soutienCooperative: [{
    type: String
  }],
  objectifsProduction: [{
    type: String,
    enum: ['Souveraineté alimentaire locale', 'Export régional', 'Export international']
  }],
  connexionTransformation: {
    type: Boolean,
    default: false
  },
  elevage: [{
    type: String
  }],
  elevageAutres: {
    type: String,
    default: ''
  },
  fientesFertilisant: {
    type: String,
    enum: ['Oui', 'Non', ''],
    default: ''
  },
  fientesBiogaz: {
    type: String,
    enum: ['Oui', 'Non', ''],
    default: ''
  },
  accesElectricite: {
    type: String,
    enum: ['Oui', 'Partiel', 'Non'],
    required: true
  },
  besoinSolaire: {
    type: String,
    enum: ['Oui', 'Non', ''],
    default: ''
  },
  accesStockage: {
    type: String,
    enum: ['Oui', 'Non'],
    required: true
  },
  besoinCollecte: {
    type: String,
    enum: ['Oui', 'Non', ''],
    default: ''
  },
  investissementCooperative: {
    type: String,
    enum: ['Oui', 'Non'],
    default: 'Non'
  },
  diseaseDetection: {
    disease: String,
    confidence: Number,
    solutions: [String],
    thinkTank: {
      fertilisant: String,
      irrigation: String,
      rotation: String
    }
  },
  landDetection: {
    totalArea: String,
    detections: [{
      culture: String,
      superficie: String,
      confiance: Number
    }],
    dateDetection: String
  },
  qualityLevel: {
    type: String,
    enum: ['local', 'regional', 'international', 'Non spécifié'],
    default: 'Non spécifié'
  },
  statut: {
    type: String,
    enum: ['Actif', 'En attente', 'Inactif'],
    default: 'En attente'
  },
  defis: [{
    type: String
  }],
  solutions: [{
    titre: String,
    description: String,
    details: [String]
  }]
}, {
  timestamps: true
});

// Index pour recherche rapide
farmerSchema.index({ region: 1 });
farmerSchema.index({ statut: 1 });
farmerSchema.index({ investissementCooperative: 1 });
farmerSchema.index({ createdAt: -1 });

const Farmer = mongoose.model('Farmer', farmerSchema);

export default Farmer;

