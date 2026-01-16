import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sujet: {
    type: String,
    required: true,
    enum: ['Techniques agricoles', 'Gestion financière', 'Irrigation', 'Transformation', 'Certification', 'Marketing', 'Autre']
  },
  niveau: {
    type: String,
    enum: ['Débutant', 'Intermédiaire', 'Avancé'],
    default: 'Débutant'
  },
  duree: {
    type: Number, // en heures
    required: true
  },
  format: {
    type: String,
    enum: ['Présentiel', 'En ligne', 'Hybride'],
    default: 'Présentiel'
  },
  sessions: [{
    date: {
      type: Date,
      required: true
    },
    heureDebut: String,
    heureFin: String,
    lieu: String,
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician'
    },
    mentor: {
      nom: String,
      specialite: String,
      telephone: String
    },
    participants: [{
      farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer'
      },
      nom: String,
      telephone: String,
      statut: {
        type: String,
        enum: ['registered', 'attended', 'absent'],
        default: 'registered'
      }
    }],
    capaciteMax: {
      type: Number,
      default: 30
    },
    statut: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  }],
  videoUrl: String,
  materials: [{
    type: String,
    enum: ['PDF', 'Video', 'Audio', 'Lien'],
    url: String,
    titre: String
  }],
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center'
  },
  region: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['planned', 'open', 'full', 'completed', 'cancelled'],
    default: 'planned'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

trainingSchema.index({ region: 1 });
trainingSchema.index({ sujet: 1 });
trainingSchema.index({ statut: 1 });
trainingSchema.index({ 'sessions.date': 1 });

export default mongoose.model('Training', trainingSchema);
