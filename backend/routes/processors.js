import express from 'express';
import Processor from '../models/Processor.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateProcessor } from '../middleware/validation.js';
import { countryFilter } from '../middleware/countryFilter.js';

const router = express.Router();

// GET /api/processors/public-stats — public summary, no auth
router.get('/public-stats', async (req, res) => {
  try {
    const total = await Processor.countDocuments();
    const certified = await Processor.countDocuments({ certifie: true });
    const byCountry = await Processor.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const recent = await Processor.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('nom region country statut certifie produitsTransformes autresTypesProduits createdAt')
      .lean();
    res.json({ success: true, total, certified, byCountry, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/processors - Inscription d'un processeur (public)
router.post('/', validateProcessor, async (req, res) => {
  try {
    const processorData = {
      ...req.body,
      localisation: `${req.body.latitude}, ${req.body.longitude}`
    };

    const processor = new Processor(processorData);
    await processor.save();

    res.status(201).json({
      success: true,
      message: 'Processeur enregistré avec succès',
      processor
    });
  } catch (error) {
    console.error('Erreur création processeur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'enregistrement',
      details: error.message 
    });
  }
});

// GET /api/processors - Liste des processeurs (protégée admin)
router.get('/', authenticateToken, countryFilter, async (req, res) => {
  try {
    const { region, statut } = req.query;
    const query = { ...(req.countryFilter || {}) };
    
    if (region) query.region = region;
    if (statut) query.statut = statut;

    const processors = await Processor.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      processors
    });
  } catch (error) {
    console.error('Erreur récupération processeurs:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/processors/:id - Détails d'un processeur (protégée admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const processor = await Processor.findById(req.params.id);
    
    if (!processor) {
      return res.status(404).json({ error: 'Processeur non trouvé' });
    }

    res.json({
      success: true,
      processor
    });
  } catch (error) {
    console.error('Erreur récupération processeur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/processors/region/:region - Processeurs par région (public pour suggestions)
router.get('/region/:region', async (req, res) => {
  try {
    const processors = await Processor.find({ 
      region: req.params.region,
      statut: 'Opérationnelle'
    }).sort({ capaciteMax: -1 });

    res.json({
      success: true,
      processors
    });
  } catch (error) {
    console.error('Erreur récupération processeurs par région:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

export default router;

