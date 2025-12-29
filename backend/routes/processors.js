import express from 'express';
import Processor from '../models/Processor.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateProcessor } from '../middleware/validation.js';

const router = express.Router();

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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { region, statut } = req.query;
    const query = {};
    
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

