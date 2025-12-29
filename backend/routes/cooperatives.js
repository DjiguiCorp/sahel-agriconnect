import express from 'express';
import Cooperative from '../models/Cooperative.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/cooperatives - Liste des coopératives par région (public)
router.get('/', async (req, res) => {
  try {
    const { region } = req.query;
    const query = {};
    
    if (region) {
      query.region = region;
    }

    const cooperatives = await Cooperative.find(query).sort({ nom: 1 });

    res.json({
      success: true,
      cooperatives
    });
  } catch (error) {
    console.error('Erreur récupération coopératives:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/cooperatives/region/:region - Coopératives par région (public)
router.get('/region/:region', async (req, res) => {
  try {
    const cooperatives = await Cooperative.find({ 
      region: req.params.region,
      statut: 'Fonctionnelle'
    }).sort({ nom: 1 });

    res.json({
      success: true,
      cooperatives
    });
  } catch (error) {
    console.error('Erreur récupération coopératives par région:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// POST /api/cooperatives - Création d'une coopérative (protégée admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const cooperative = new Cooperative(req.body);
    await cooperative.save();

    res.status(201).json({
      success: true,
      message: 'Coopérative créée avec succès',
      cooperative
    });
  } catch (error) {
    console.error('Erreur création coopérative:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création',
      details: error.message 
    });
  }
});

// PUT /api/cooperatives/:id - Mise à jour d'une coopérative (protégée admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const cooperative = await Cooperative.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!cooperative) {
      return res.status(404).json({ error: 'Coopérative non trouvée' });
    }

    res.json({
      success: true,
      message: 'Coopérative mise à jour avec succès',
      cooperative
    });
  } catch (error) {
    console.error('Erreur mise à jour coopérative:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

export default router;

