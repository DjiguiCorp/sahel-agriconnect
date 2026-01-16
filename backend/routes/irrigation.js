import express from 'express';
import IrrigationSurvey from '../models/IrrigationSurvey.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/irrigation/assess - Soumettre une évaluation d'irrigation (public - farmer)
router.post('/assess', async (req, res) => {
  try {
    // Valider les données requises
    if (!req.body.region) {
      return res.status(400).json({ 
        error: 'La région est requise' 
      });
    }

    const surveyData = {
      ...req.body,
      statut: 'submitted'
    };

    const survey = new IrrigationSurvey(surveyData);
    await survey.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('irrigation:assessed', survey);
    }

    res.status(201).json({
      success: true,
      message: 'Évaluation soumise avec succès',
      survey
    });
  } catch (error) {
    console.error('Erreur évaluation irrigation:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de l\'évaluation',
      details: error.message
    });
  }
});

// GET /api/irrigation - Liste des évaluations (protégée admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { region, statut, priorite } = req.query;
    const query = {};

    if (region) query.region = region;
    if (statut) query.statut = statut;
    if (priorite) query['needs.priorite'] = priorite;

    const surveys = await IrrigationSurvey.find(query)
      .populate('farmerId', 'nom telephone region superficie')
      .populate('assessment.assessedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      surveys
    });
  } catch (error) {
    console.error('Erreur récupération évaluations:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/irrigation/regional - Statistiques régionales (protégée admin)
router.get('/regional', authenticateToken, async (req, res) => {
  try {
    const { region } = req.query;

    const query = region ? { region } : {};

    const total = await IrrigationSurvey.countDocuments(query);
    const pending = await IrrigationSurvey.countDocuments({ ...query, statut: 'submitted' });
    const approved = await IrrigationSurvey.countDocuments({ ...query, statut: 'approved' });
    const inProgress = await IrrigationSurvey.countDocuments({ ...query, statut: 'in_progress' });

    const byPriority = await IrrigationSurvey.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$needs.priorite',
          count: { $sum: 1 }
        }
      }
    ]);

    const byType = await IrrigationSurvey.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$needs.typeIrrigation',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        inProgress,
        byPriority,
        byType
      }
    });
  } catch (error) {
    console.error('Erreur statistiques régionales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/irrigation/:id - Détails d'une évaluation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const survey = await IrrigationSurvey.findById(req.params.id)
      .populate('farmerId', 'nom telephone region superficie cultures')
      .populate('assessment.assessedBy', 'name email');

    if (!survey) {
      return res.status(404).json({ error: 'Évaluation non trouvée' });
    }

    res.json({
      success: true,
      survey
    });
  } catch (error) {
    console.error('Erreur récupération évaluation:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// PUT /api/irrigation/:id/assess - Évaluer une demande (protégée admin)
router.put('/:id/assess', authenticateToken, async (req, res) => {
  try {
    const { faisabilite, impactEstime, notes, statut } = req.body;

    const survey = await IrrigationSurvey.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'assessment.faisabilite': faisabilite,
          'assessment.impactEstime': impactEstime,
          'assessment.notes': notes,
          'assessment.assessedBy': req.adminId,
          'assessment.assessedAt': new Date(),
          statut: statut || 'under_review'
        }
      },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ error: 'Évaluation non trouvée' });
    }

    res.json({
      success: true,
      message: 'Évaluation mise à jour avec succès',
      survey
    });
  } catch (error) {
    console.error('Erreur mise à jour évaluation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/irrigation/:id/upgrade-request - Demander une amélioration (public - farmer)
router.post('/:id/upgrade-request', async (req, res) => {
  try {
    const survey = await IrrigationSurvey.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'upgradeRequest.requested': true,
          'upgradeRequest.requestedAt': new Date()
        }
      },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ error: 'Évaluation non trouvée' });
    }

    res.json({
      success: true,
      message: 'Demande d\'amélioration soumise',
      survey
    });
  } catch (error) {
    console.error('Erreur demande amélioration:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
