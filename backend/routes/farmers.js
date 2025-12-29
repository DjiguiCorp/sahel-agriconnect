import express from 'express';
import Farmer from '../models/Farmer.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateFarmer, validateFarmerUpdate } from '../middleware/validation.js';

const router = express.Router();

// POST /api/farmers - Enregistrement d'un agriculteur (public)
router.post('/', validateFarmer, async (req, res) => {
  try {
    const farmerData = {
      ...req.body,
      localisation: `${req.body.latitude}, ${req.body.longitude}`
    };

    const farmer = new Farmer(farmerData);
    await farmer.save();

    // Émettre l'événement WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('farmer:created', farmer);
    }

    res.status(201).json({
      success: true,
      message: 'Agriculteur enregistré avec succès',
      farmer
    });
  } catch (error) {
    console.error('Erreur création agriculteur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'enregistrement',
      details: error.message 
    });
  }
});

// GET /api/farmers - Liste des agriculteurs (protégée admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      region, 
      statut, 
      investissement, 
      page = 1, 
      limit = 50,
      search 
    } = req.query;

    const query = {};
    
    if (region) query.region = region;
    if (statut) query.statut = statut;
    if (investissement) query.investissementCooperative = investissement;
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const farmers = await Farmer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Farmer.countDocuments(query);

    res.json({
      success: true,
      farmers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération agriculteurs:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/farmers/:id - Détails d'un agriculteur (protégée admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    
    if (!farmer) {
      return res.status(404).json({ error: 'Agriculteur non trouvé' });
    }

    res.json({
      success: true,
      farmer
    });
  } catch (error) {
    console.error('Erreur récupération agriculteur:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// PUT /api/farmers/:id - Mise à jour d'un agriculteur (protégée admin)
router.put('/:id', authenticateToken, validateFarmerUpdate, async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!farmer) {
      return res.status(404).json({ error: 'Agriculteur non trouvé' });
    }

    // Émettre l'événement WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('farmer:updated', farmer);
    }

    res.json({
      success: true,
      message: 'Agriculteur mis à jour avec succès',
      farmer
    });
  } catch (error) {
    console.error('Erreur mise à jour agriculteur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// DELETE /api/farmers/:id - Suppression d'un agriculteur (protégée admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.id);

    if (!farmer) {
      return res.status(404).json({ error: 'Agriculteur non trouvé' });
    }

    res.json({
      success: true,
      message: 'Agriculteur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression agriculteur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

// GET /api/farmers/stats/summary - Statistiques (protégée admin)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const total = await Farmer.countDocuments();
    const actifs = await Farmer.countDocuments({ statut: 'Actif' });
    const enAttente = await Farmer.countDocuments({ statut: 'En attente' });
    const avecInvestissement = await Farmer.countDocuments({ investissementCooperative: 'Oui' });
    
    const totalSuperficie = await Farmer.aggregate([
      { $group: { _id: null, total: { $sum: '$superficie' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        actifs,
        enAttente,
        avecInvestissement,
        superficieTotale: totalSuperficie[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

export default router;

