import express from 'express';
import ProductionOptimization from '../models/ProductionOptimization.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to call Gemini API
async function callGeminiAPI(prompt) {
  try {
    // Use environment variable or fallback to provided key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCUuvVQzgwUD3CRCQ7yyGsO0Mh7UyxlXwc';
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Erreur appel Gemini API:', error);
    throw error;
  }
}

// POST /api/optimize/production - Générer des recommandations de production (public - farmer)
router.post('/production', async (req, res) => {
  try {
    const { farmerId, region, crop, superficie, saison, currentPractices, soilConditions } = req.body;

    // Construire le prompt pour Gemini
    const prompt = `Tu es un expert agronome spécialisé dans l'agriculture au Sahel (Mali, Burkina Faso, Niger).

Contexte:
- Région: ${region}
- Culture: ${crop}
- Superficie: ${superficie} hectares
- Saison: ${saison}
- Pratiques actuelles: ${JSON.stringify(currentPractices)}
- Conditions du sol: ${JSON.stringify(soilConditions)}

Génère des recommandations d'optimisation de production au format JSON avec cette structure:
{
  "recommendations": [
    {
      "category": "Irrigation|Fertilisation|Semis|Traitement|Récolte|Autre",
      "title": "Titre de la recommandation",
      "description": "Description détaillée",
      "priority": "Haute|Moyenne|Basse",
      "estimatedImpact": "Impact estimé sur le rendement",
      "cost": 0
    }
  ],
  "forecast": {
    "yieldEstimate": 0,
    "confidence": 0,
    "factors": ["facteur1", "facteur2"]
  },
  "budget": {
    "total": 0,
    "breakdown": [
      {
        "item": "Nom de l'item",
        "cost": 0
      }
    ]
  }
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

    let geminiResponse;
    let recommendationsData;

    try {
      geminiResponse = await callGeminiAPI(prompt);
      
      // Extraire le JSON de la réponse
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendationsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Réponse Gemini invalide');
      }
    } catch (geminiError) {
      console.error('Erreur Gemini API, utilisation de recommandations par défaut:', geminiError);
      // Recommandations par défaut si Gemini échoue
      recommendationsData = {
        recommendations: [
          {
            category: 'Fertilisation',
            title: 'Fertilisation équilibrée',
            description: 'Utiliser des engrais organiques et minéraux adaptés à la culture',
            priority: 'Moyenne',
            estimatedImpact: 'Augmentation de 15-20% du rendement',
            cost: 50000
          }
        ],
        forecast: {
          yieldEstimate: superficie * 1.5, // tonnes estimées
          confidence: 60,
          factors: ['Conditions météorologiques', 'Qualité du sol', 'Pratiques culturales']
        },
        budget: {
          total: 50000,
          breakdown: [
            { item: 'Engrais', cost: 30000 },
            { item: 'Semences améliorées', cost: 20000 }
          ]
        }
      };
    }

    // Créer l'enregistrement d'optimisation
    const optimization = new ProductionOptimization({
      farmerId,
      region,
      crop,
      superficie,
      saison,
      currentPractices,
      soilConditions,
      aiRecommendations: {
        generatedAt: new Date(),
        recommendations: recommendationsData.recommendations,
        forecast: recommendationsData.forecast,
        budget: recommendationsData.budget,
        geminiModel: 'gemini-pro',
        geminiPrompt: prompt,
        geminiResponse: geminiResponse || 'Utilisation de recommandations par défaut'
      },
      statut: 'generated'
    });

    await optimization.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('optimization:generated', optimization);
    }

    res.status(201).json({
      success: true,
      message: 'Recommandations générées avec succès',
      optimization
    });
  } catch (error) {
    console.error('Erreur optimisation production:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la génération',
      details: error.message
    });
  }
});

// GET /api/optimize/production/:id - Récupérer une optimisation
router.get('/production/:id', async (req, res) => {
  try {
    const optimization = await ProductionOptimization.findById(req.params.id)
      .populate('farmerId', 'nom telephone region cultures superficie');

    if (!optimization) {
      return res.status(404).json({ error: 'Optimisation non trouvée' });
    }

    res.json({
      success: true,
      optimization
    });
  } catch (error) {
    console.error('Erreur récupération optimisation:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/optimize/regional - Prévisions régionales (protégée admin)
router.get('/regional', authenticateToken, async (req, res) => {
  try {
    const { region, crop } = req.query;
    const query = { statut: 'generated' };

    if (region) query.region = region;
    if (crop) query.crop = crop;

    const optimizations = await ProductionOptimization.find(query)
      .populate('farmerId', 'nom region')
      .select('region crop superficie aiRecommendations.forecast')
      .sort({ createdAt: -1 })
      .limit(100);

    // Agréger les prévisions
    const totalSuperficie = optimizations.reduce((sum, opt) => sum + opt.superficie, 0);
    const totalYieldEstimate = optimizations.reduce(
      (sum, opt) => sum + (opt.aiRecommendations?.forecast?.yieldEstimate || 0),
      0
    );

    res.json({
      success: true,
      forecast: {
        totalOptimizations: optimizations.length,
        totalSuperficie,
        totalYieldEstimate,
        averageYield: totalSuperficie > 0 ? totalYieldEstimate / totalSuperficie : 0,
        byCrop: optimizations.reduce((acc, opt) => {
          const crop = opt.crop;
          if (!acc[crop]) {
            acc[crop] = { count: 0, superficie: 0, yield: 0 };
          }
          acc[crop].count++;
          acc[crop].superficie += opt.superficie;
          acc[crop].yield += opt.aiRecommendations?.forecast?.yieldEstimate || 0;
          return acc;
        }, {})
      },
      optimizations: optimizations.slice(0, 10) // Limiter les détails
    });
  } catch (error) {
    console.error('Erreur prévisions régionales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/optimize/production/:id/feedback - Ajouter un feedback (public - farmer)
router.put('/production/:id/feedback', async (req, res) => {
  try {
    const { rating, comments, implemented, results } = req.body;

    const optimization = await ProductionOptimization.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'farmerFeedback.rating': rating,
          'farmerFeedback.comments': comments,
          'farmerFeedback.implemented': implemented,
          'farmerFeedback.results': results,
          statut: 'reviewed'
        }
      },
      { new: true }
    );

    if (!optimization) {
      return res.status(404).json({ error: 'Optimisation non trouvée' });
    }

    res.json({
      success: true,
      message: 'Feedback enregistré avec succès',
      optimization
    });
  } catch (error) {
    console.error('Erreur feedback:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
