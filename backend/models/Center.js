import mongoose from 'mongoose';

const centerSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true
  },
  localisation: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  contact: {
    telephone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  technicians: [{
    nom: {
      type: String,
      required: true
    },
    specialite: {
      type: String,
      required: true
    },
    telephone: String,
    email: String
  }],
  inventory: {
    equipment: [{
      nom: String,
      quantite: {
        type: Number,
        default: 0
      },
      disponible: {
        type: Boolean,
        default: true
      }
    }],
    fertilizers: [{
      nom: String,
      quantite: {
        type: Number,
        default: 0
      },
      unite: {
        type: String,
        enum: ['kg', 'tonnes', 'sacs'],
        default: 'kg'
      }
    }],
    seeds: [{
      nom: String,
      quantite: {
        type: Number,
        default: 0
      },
      unite: {
        type: String,
        enum: ['kg', 'sacs'],
        default: 'kg'
      }
    }]
  },
  capacite: {
    maxFarmers: {
      type: Number,
      default: 0
    },
    currentFarmers: {
      type: Number,
      default: 0
    }
  },
  services: [{
    type: String,
    enum: ['Conseil technique', 'Formation', 'Distribution intrants', 'Stockage', 'Transformation']
  }],
  statut: {
    type: String,
    enum: ['Opérationnel', 'En construction', 'Inactif'],
    default: 'Opérationnel'
  },
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cooperative',
    default: null
  }
}, {
  timestamps: true
});

centerSchema.index({ region: 1 });
centerSchema.index({ latitude: 1, longitude: 1 });
centerSchema.index({ statut: 1 });

export default mongoose.model('Center', centerSchema);
