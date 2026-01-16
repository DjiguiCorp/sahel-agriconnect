import express from 'express';
import Logistics from '../models/Logistics.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/logistics/schedule - Planifier une opération logistique (protégée admin)
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const logisticsData = {
      ...req.body,
      createdBy: req.adminId,
      statut: 'pending'
    };

    const logistics = new Logistics(logisticsData);
    await logistics.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('logistics:scheduled', logistics);
    }

    res.status(201).json({
      success: true,
      message: 'Opération logistique planifiée avec succès',
      logistics
    });
  } catch (error) {
    console.error('Erreur planification logistique:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la planification',
      details: error.message
    });
  }
});

// GET /api/logistics - Liste des opérations logistiques
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, farmerId, statut, region } = req.query;
    const query = {};

    if (type) query.type = type;
    if (farmerId) query.farmerId = farmerId;
    if (statut) query.statut = statut;
    if (region) {
      const Farmer = (await import('../models/Farmer.js')).default;
      const farmers = await Farmer.find({ region }).select('_id');
      query.farmerId = { $in: farmers.map(f => f._id) };
    }

    const logistics = await Logistics.find(query)
      .populate('farmerId', 'nom telephone region')
      .populate('cooperativeId', 'nom region')
      .populate('centerId', 'nom localisation')
      .populate('processorId', 'nom region')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      logistics
    });
  } catch (error) {
    console.error('Erreur récupération logistique:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/logistics/status/:id - Statut d'une opération
router.get('/status/:id', async (req, res) => {
  try {
    const logistics = await Logistics.findById(req.params.id)
      .populate('farmerId', 'nom telephone')
      .select('type statut tracking notes');

    if (!logistics) {
      return res.status(404).json({ error: 'Opération non trouvée' });
    }

    res.json({
      success: true,
      logistics
    });
  } catch (error) {
    console.error('Erreur récupération statut:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/logistics/:id/update-status - Mettre à jour le statut (protégée admin)
router.put('/:id/update-status', authenticateToken, async (req, res) => {
  try {
    const { statut, location, notes } = req.body;

    const logistics = await Logistics.findById(req.params.id);
    if (!logistics) {
      return res.status(404).json({ error: 'Opération non trouvée' });
    }

    logistics.statut = statut;

    if (location || notes) {
      logistics.tracking.push({
        date: new Date(),
        location: location || logistics.tracking[logistics.tracking.length - 1]?.location,
        statut: statut,
        notes: notes || ''
      });
    }

    await logistics.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('logistics:status:updated', logistics);
    }

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      logistics
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/logistics/capacity/planning - Planification de capacité (protégée admin)
router.get('/capacity/planning', authenticateToken, async (req, res) => {
  try {
    const { centerId, date } = req.query;

    const query = {
      type: { $in: ['storage', 'transformation'] },
      statut: { $in: ['scheduled', 'in_storage', 'in_transformation'] }
    };

    if (centerId) {
      query.$or = [
        { centerId },
        { 'storage.centerId': centerId },
        { 'transformation.processorId': centerId }
      ];
    }

    if (date) {
      const targetDate = new Date(date);
      query.$or = [
        { 'storage.dateEntree': { $lte: targetDate } },
        { 'storage.dateSortiePrevue': { $gte: targetDate } },
        { 'transformation.dateReception': { $lte: targetDate } },
        { 'transformation.dateLivraison': { $gte: targetDate } }
      ];
    }

    const logistics = await Logistics.find(query)
      .populate('farmerId', 'nom')
      .select('type storage transformation statut');

    // Calculer la capacité utilisée
    const capacity = {
      storage: {
        total: 0,
        used: 0,
        available: 0
      },
      transformation: {
        total: 0,
        used: 0,
        available: 0
      }
    };

    logistics.forEach(log => {
      if (log.type === 'storage' && log.storage) {
        capacity.storage.used += log.storage.quantite || 0;
      }
      if (log.type === 'transformation' && log.transformation) {
        capacity.transformation.used += log.transformation.quantiteEntree || 0;
      }
    });

    res.json({
      success: true,
      capacity,
      logistics
    });
  } catch (error) {
    console.error('Erreur planification capacité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
