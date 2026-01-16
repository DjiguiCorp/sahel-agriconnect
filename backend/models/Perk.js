import mongoose from 'mongoose';

const perkSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cooperative',
    required: true
  },
  type: {
    type: String,
    enum: ['equipment', 'fertilizer', 'insurance', 'training', 'financial'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    equipment: {
      nom: String,
      quantite: Number,
      dureePret: Number // en jours
    },
    fertilizer: {
      nom: String,
      quantite: Number,
      unite: String
    },
    insurance: {
      typeAssurance: String,
      montant: Number,
      duree: Number // en mois
    },
    training: {
      sujet: String,
      duree: Number // en heures
    },
    financial: {
      montant: Number,
      tauxInteret: Number,
      dureeRemboursement: Number // en mois
    }
  },
  paybackOption: {
    type: String,
    enum: ['cash', 'crop', 'service', 'none'],
    default: 'none'
  },
  paybackDetails: {
    montant: Number,
    cropType: String,
    quantiteCrop: Number,
    serviceDescription: String
  },
  statut: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'completed'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  fulfilledAt: Date,
  notes: String
}, {
  timestamps: true
});

perkSchema.index({ farmerId: 1 });
perkSchema.index({ cooperativeId: 1 });
perkSchema.index({ statut: 1 });
perkSchema.index({ type: 1 });

export default mongoose.model('Perk', perkSchema);
