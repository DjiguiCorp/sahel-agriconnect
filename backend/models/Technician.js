import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  specialite: {
    type: String,
    required: true,
    enum: ['Agronomie', 'Irrigation', 'Transformation', 'Gestion', 'Certification', 'Marketing', 'Autre']
  },
  qualifications: [{
    type: String
  }],
  experience: {
    type: Number, // en années
    default: 0
  },
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center'
  },
  region: {
    type: String,
    required: true
  },
  disponibilite: {
    type: String,
    enum: ['Disponible', 'Occupé', 'Indisponible'],
    default: 'Disponible'
  },
  mentorRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalTrainings: {
    type: Number,
    default: 0
  },
  statut: {
    type: String,
    enum: ['Actif', 'Inactif'],
    default: 'Actif'
  }
}, {
  timestamps: true
});

technicianSchema.index({ region: 1 });
technicianSchema.index({ specialite: 1 });
technicianSchema.index({ statut: 1 });

export default mongoose.model('Technician', technicianSchema);
