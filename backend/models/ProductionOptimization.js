import mongoose from 'mongoose';

const productionOptimizationSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  region: {
    type: String,
    required: true
  },
  crop: {
    type: String,
    required: true
  },
  superficie: {
    type: Number,
    required: true
  },
  saison: {
    type: String,
    enum: ['Sèche', 'Pluvieuse', 'Hivernale'],
    required: true
  },
  currentPractices: {
    irrigation: String,
    fertilisation: String,
    semis: String,
    autres: String
  },
  soilConditions: {
    type: String,
    ph: Number,
    texture: String,
    autres: String
  },
  aiRecommendations: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    recommendations: [{
      category: {
        type: String,
        enum: ['Irrigation', 'Fertilisation', 'Semis', 'Traitement', 'Récolte', 'Autre']
      },
      title: String,
      description: String,
      priority: {
        type: String,
        enum: ['Haute', 'Moyenne', 'Basse']
      },
      estimatedImpact: String,
      cost: Number
    }],
    forecast: {
      yieldEstimate: Number,
      confidence: Number, // 0-100
      factors: [String]
    },
    budget: {
      total: Number,
      breakdown: [{
        item: String,
        cost: Number
      }]
    },
    geminiModel: String,
    geminiPrompt: String,
    geminiResponse: String
  },
  farmerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    implemented: [String],
    results: String
  },
  statut: {
    type: String,
    enum: ['pending', 'generated', 'reviewed', 'implemented', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

productionOptimizationSchema.index({ farmerId: 1 });
productionOptimizationSchema.index({ region: 1 });
productionOptimizationSchema.index({ crop: 1 });
productionOptimizationSchema.index({ statut: 1 });

export default mongoose.model('ProductionOptimization', productionOptimizationSchema);
