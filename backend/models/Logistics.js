import mongoose from 'mongoose';

const logisticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['transport', 'storage', 'transformation'],
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  cooperativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cooperative'
  },
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center'
  },
  processorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Processor'
  },
  // Transport
  transport: {
    origine: {
      latitude: Number,
      longitude: Number,
      adresse: String
    },
    destination: {
      latitude: Number,
      longitude: Number,
      adresse: String,
      centerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Center'
      }
    },
    produit: String,
    quantite: Number,
    unite: {
      type: String,
      enum: ['kg', 'tonnes', 'sacs']
    },
    dateEnlevement: Date,
    dateLivraison: Date,
    vehicule: String,
    conducteur: {
      nom: String,
      telephone: String
    },
    cout: Number
  },
  // Stockage
  storage: {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Center',
      required: true
    },
    produit: String,
    quantite: Number,
    unite: {
      type: String,
      enum: ['kg', 'tonnes', 'sacs']
    },
    dateEntree: Date,
    dateSortiePrevue: Date,
    dateSortie: Date,
    conditions: {
      temperature: String,
      humidite: String,
      autres: String
    },
    cout: Number
  },
  // Transformation
  transformation: {
    processorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Processor',
      required: true
    },
    produitEntree: String,
    quantiteEntree: Number,
    produitSortie: String,
    quantiteSortie: Number,
    dateReception: Date,
    dateTransformation: Date,
    dateLivraison: Date,
    cout: Number
  },
  statut: {
    type: String,
    enum: ['pending', 'scheduled', 'in_transit', 'in_storage', 'in_transformation', 'completed', 'cancelled'],
    default: 'pending'
  },
  tracking: [{
    date: {
      type: Date,
      default: Date.now
    },
    location: String,
    statut: String,
    notes: String
  }],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

logisticsSchema.index({ farmerId: 1 });
logisticsSchema.index({ type: 1 });
logisticsSchema.index({ statut: 1 });
logisticsSchema.index({ 'transport.dateEnlevement': 1 });
logisticsSchema.index({ 'storage.dateEntree': 1 });

export default mongoose.model('Logistics', logisticsSchema);
