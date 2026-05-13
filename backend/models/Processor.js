import mongoose from 'mongoose';

const processorSchema = new mongoose.Schema({
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
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    select: false,
    default: '',
  },
  region: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: ''
  },
  countryCode: {
    type: String,
    default: 'ML'
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
  capaciteMax: {
    type: Number,
    required: true,
    min: 0
  },
  produitsTransformes: [{
    type: String,
    required: true
  }],
  produitsAcceptes: [{
    type: String,
    required: true
  }],
  autresTypesProduits: { type: String, trim: true },
  autresProduitsAcceptes: { type: String, trim: true },
  genreProprietaire: {
    type: String,
    enum: ['masculin', 'feminin', ''],
    default: ''
  },
  proprietaire: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['Coopérative', 'Privé', 'Public'],
    default: 'Privé'
  },
  statut: {
    type: String,
    enum: ['Opérationnelle', 'En construction', 'Inactive'],
    default: 'Opérationnelle'
  },
  partenaires: [{
    type: String
  }]
}, {
  timestamps: true
});

processorSchema.index({ region: 1 });
processorSchema.index({ country: 1 });
processorSchema.index({ statut: 1 });

const Processor = mongoose.model('Processor', processorSchema);

export default Processor;

