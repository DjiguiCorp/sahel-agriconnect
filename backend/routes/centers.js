import express from 'express';
import Center from '../models/Center.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/centers - Créer un centre (protégée admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const centerData = {
      ...req.body,
      localisation: req.body.localisation || `${req.body.latitude}, ${req.body.longitude}`
    };

    const center = new Center(centerData);
    await center.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('center:created', center);
    }

    res.status(201).json({
      success: true,
      message: 'Centre créé avec succès',
      center
    });
  } catch (error) {
    console.error('Erreur création centre:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la création',
      details: error.message
    });
  }
});

// GET /api/centers - Liste des centres
router.get('/', async (req, res) => {
  try {
    const { region, statut, search } = req.query;
    const query = {};

    if (region) query.region = region;
    if (statut) query.statut = statut;
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { localisation: { $regex: search, $options: 'i' } }
      ];
    }

    const centers = await Center.find(query)
      .populate('cooperativeId', 'nom region')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      centers
    });
  } catch (error) {
    console.error('Erreur récupération centres:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/centers/:id - Détails d'un centre
router.get('/:id', async (req, res) => {
  try {
    const center = await Center.findById(req.params.id)
      .populate('cooperativeId', 'nom region responsable contact')
      .populate('technicians');

    if (!center) {
      return res.status(404).json({ error: 'Centre non trouvé' });
    }

    res.json({
      success: true,
      center
    });
  } catch (error) {
    console.error('Erreur récupération centre:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// PUT /api/centers/:id - Mettre à jour un centre (protégée admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const center = await Center.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!center) {
      return res.status(404).json({ error: 'Centre non trouvé' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('center:updated', center);
    }

    res.json({
      success: true,
      message: 'Centre mis à jour avec succès',
      center
    });
  } catch (error) {
    console.error('Erreur mise à jour centre:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// PUT /api/centers/:id/inventory - Mettre à jour l'inventaire (protégée admin)
router.put('/:id/inventory', authenticateToken, async (req, res) => {
  try {
    const { equipment, fertilizers, seeds } = req.body;
    const update = {};

    if (equipment) update['inventory.equipment'] = equipment;
    if (fertilizers) update['inventory.fertilizers'] = fertilizers;
    if (seeds) update['inventory.seeds'] = seeds;

    const center = await Center.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!center) {
      return res.status(404).json({ error: 'Centre non trouvé' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('center:inventory:updated', center);
    }

    res.json({
      success: true,
      message: 'Inventaire mis à jour avec succès',
      center
    });
  } catch (error) {
    console.error('Erreur mise à jour inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// GET /api/centers/:id/stats - Statistiques d'un centre
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);

    if (!center) {
      return res.status(404).json({ error: 'Centre non trouvé' });
    }

    const Farmer = (await import('../models/Farmer.js')).default;
    const farmersCount = await Farmer.countDocuments({
      region: center.region,
      lienCooperative: 'Oui'
    });

    res.json({
      success: true,
      stats: {
        totalTechnicians: center.technicians.length,
        currentFarmers: center.capacite.currentFarmers,
        maxFarmers: center.capacite.maxFarmers,
        farmersInRegion: farmersCount,
        equipmentCount: center.inventory.equipment.reduce((sum, eq) => sum + eq.quantite, 0),
        fertilizersCount: center.inventory.fertilizers.reduce((sum, f) => sum + f.quantite, 0)
      }
    });
  } catch (error) {
    console.error('Erreur statistiques centre:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

export default router;
