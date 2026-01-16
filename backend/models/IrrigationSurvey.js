import mongoose from 'mongoose';

const irrigationSurveySchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  region: {
    type: String,
    required: true
  },
  localisation: {
    latitude: Number,
    longitude: Number,
    adresse: String
  },
  currentIrrigation: {
    type: {
      type: String,
      enum: ['Aucune', 'Manuelle', 'Gravitaire', 'Pompe diesel', 'Pompe solaire', 'Goutte à goutte', 'Aspersion'],
      required: true
    },
    superficieIrriguee: {
      type: Number,
      default: 0
    },
    sourceEau: {
      type: String,
      enum: ['Puits', 'Forage', 'Rivière', 'Lac', 'Barrage', 'Autre']
    },
    probleme: String
  },
  needs: {
    typeIrrigation: {
      type: String,
      enum: ['Pompe solaire', 'Goutte à goutte', 'Aspersion', 'Système mixte', 'Amélioration existant']
    },
    superficieCible: Number,
    budgetEstime: Number,
    priorite: {
      type: String,
      enum: ['Haute', 'Moyenne', 'Basse'],
      default: 'Moyenne'
    },
    urgence: {
      type: String,
      enum: ['Immédiate', 'Saison prochaine', 'Long terme'],
      default: 'Saison prochaine'
    }
  },
  assessment: {
    faisabilite: {
      type: String,
      enum: ['Élevée', 'Moyenne', 'Faible'],
      default: 'Moyenne'
    },
    impactEstime: {
      type: String,
      enum: ['Très élevé', 'Élevé', 'Moyen', 'Faible']
    },
    notes: String,
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    assessedAt: Date
  },
  statut: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'rejected'],
    default: 'submitted'
  },
  upgradeRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    requestedAt: Date,
    approved: Boolean,
    approvedAt: Date,
    implementationDate: Date
  }
}, {
  timestamps: true
});

irrigationSurveySchema.index({ farmerId: 1 });
irrigationSurveySchema.index({ region: 1 });
irrigationSurveySchema.index({ statut: 1 });
irrigationSurveySchema.index({ 'needs.priorite': 1 });

export default mongoose.model('IrrigationSurvey', irrigationSurveySchema);
