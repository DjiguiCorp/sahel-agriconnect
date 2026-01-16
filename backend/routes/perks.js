import express from 'express';
import Perk from '../models/Perk.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/perks/request - Demander un avantage (public - farmer)
router.post('/request', async (req, res) => {
  try {
    // Valider les données requises
    if (!req.body.farmerId && !req.body.cooperativeId) {
      return res.status(400).json({ 
        error: 'farmerId ou cooperativeId est requis' 
      });
    }

    const perkData = {
      ...req.body,
      statut: 'pending',
      requestedAt: new Date()
    };

    const perk = new Perk(perkData);
    await perk.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('perk:requested', perk);
    }

    res.status(201).json({
      success: true,
      message: 'Demande d\'avantage soumise avec succès',
      perk
    });
  } catch (error) {
    console.error('Erreur demande avantage:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la demande',
      details: error.message
    });
  }
});

// GET /api/perks - Liste des avantages (protégée admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { farmerId, cooperativeId, type, statut } = req.query;
    const query = {};

    if (farmerId) query.farmerId = farmerId;
    if (cooperativeId) query.cooperativeId = cooperativeId;
    if (type) query.type = type;
    if (statut) query.statut = statut;

    const perks = await Perk.find(query)
      .populate('farmerId', 'nom telephone region')
      .populate('cooperativeId', 'nom region')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      perks
    });
  } catch (error) {
    console.error('Erreur récupération avantages:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/perks/:id - Détails d'un avantage
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const perk = await Perk.findById(req.params.id)
      .populate('farmerId', 'nom telephone region cultures')
      .populate('cooperativeId', 'nom region responsable')
      .populate('approvedBy', 'name email');

    if (!perk) {
      return res.status(404).json({ error: 'Avantage non trouvé' });
    }

    res.json({
      success: true,
      perk
    });
  } catch (error) {
    console.error('Erreur récupération avantage:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// PUT /api/perks/:id/approve - Approuver un avantage (protégée admin)
router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { notes } = req.body;

    const perk = await Perk.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          statut: 'approved',
          approvedAt: new Date(),
          approvedBy: req.adminId,
          notes: notes || perk.notes
        }
      },
      { new: true }
    );

    if (!perk) {
      return res.status(404).json({ error: 'Avantage non trouvé' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('perk:approved', perk);
    }

    res.json({
      success: true,
      message: 'Avantage approuvé avec succès',
      perk
    });
  } catch (error) {
    console.error('Erreur approbation avantage:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'approbation' });
  }
});

// PUT /api/perks/:id/reject - Rejeter un avantage (protégée admin)
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { notes } = req.body;

    const perk = await Perk.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          statut: 'rejected',
          notes: notes || perk.notes
        }
      },
      { new: true }
    );

    if (!perk) {
      return res.status(404).json({ error: 'Avantage non trouvé' });
    }

    res.json({
      success: true,
      message: 'Avantage rejeté',
      perk
    });
  } catch (error) {
    console.error('Erreur rejet avantage:', error);
    res.status(500).json({ error: 'Erreur serveur lors du rejet' });
  }
});

// PUT /api/perks/:id/fulfill - Marquer comme rempli (protégée admin)
router.put('/:id/fulfill', authenticateToken, async (req, res) => {
  try {
    const perk = await Perk.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          statut: 'fulfilled',
          fulfilledAt: new Date()
        }
      },
      { new: true }
    );

    if (!perk) {
      return res.status(404).json({ error: 'Avantage non trouvé' });
    }

    res.json({
      success: true,
      message: 'Avantage marqué comme rempli',
      perk
    });
  } catch (error) {
    console.error('Erreur remplissage avantage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/perks/stats/usage - Statistiques d'utilisation (protégée admin)
router.get('/stats/usage', authenticateToken, async (req, res) => {
  try {
    const total = await Perk.countDocuments();
    const pending = await Perk.countDocuments({ statut: 'pending' });
    const approved = await Perk.countDocuments({ statut: 'approved' });
    const fulfilled = await Perk.countDocuments({ statut: 'fulfilled' });

    const byType = await Perk.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$statut', 'approved'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        fulfilled,
        byType
      }
    });
  } catch (error) {
    console.error('Erreur statistiques avantages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
