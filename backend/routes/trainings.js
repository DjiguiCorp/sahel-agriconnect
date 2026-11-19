import express from 'express';
import jwt from 'jsonwebtoken';
import Training from '../models/Training.js';
import Technician from '../models/Technician.js';
import Admin from '../models/Admin.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireGrowthTier } from '../middleware/requireGrowthTier.js';

const router = express.Router();

/**
 * Training list/detail/register access:
 * - Admin JWT (existing admin panel)
 * - Cooperative leader with Growth tier (authCoop + requireGrowthTier)
 * - Farmer JWT
 */
async function requireTrainingAccess(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin
    if (decoded.id && !decoded.role) {
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        req.admin = admin;
        req.adminId = decoded.id;
        req.trainingAccess = 'admin';
        return next();
      }
    }
    if (decoded.role === 'admin' || decoded.role === 'super-admin' || decoded.role === 'country-admin') {
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        req.admin = admin;
        req.adminId = decoded.id;
        req.trainingAccess = 'admin';
        return next();
      }
    }

    // Cooperative leader — must be Growth
    if (decoded.role === 'cooperative_leader' && decoded.coopId) {
      const coop = await CooperativePlatformRegistration.findById(decoded.coopId);
      if (!coop || coop.status !== 'active') {
        return res.status(403).json({ error: 'Cooperative not active' });
      }
      req.coop = coop;
      req.trainingAccess = 'cooperative';
      return requireGrowthTier(req, res, next);
    }

    // Farmer
    if (decoded.role === 'farmer' && decoded.id) {
      req.mobileUser = { role: 'farmer', id: decoded.id, email: decoded.email };
      req.farmerId = decoded.id;
      req.trainingAccess = 'farmer';
      return next();
    }

    return res.status(403).json({ error: 'Accès formations non autorisé' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
}

// POST /api/trainings/schedule - Planifier une formation (protégée admin)
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const trainingData = {
      ...req.body,
      createdBy: req.adminId,
      statut: 'planned'
    };

    const training = new Training(trainingData);
    await training.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('training:scheduled', training);
    }

    res.status(201).json({
      success: true,
      message: 'Formation planifiée avec succès',
      training
    });
  } catch (error) {
    console.error('Erreur planification formation:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la planification',
      details: error.message
    });
  }
});

// GET /api/trainings/mentors/available - Liste des mentors disponibles (admin)
router.get('/mentors/available', authenticateToken, async (req, res) => {
  try {
    const { region, specialite } = req.query;
    const query = {
      statut: 'Actif',
      disponibilite: 'Disponible'
    };

    if (region) query.region = region;
    if (specialite) query.specialite = specialite;

    const technicians = await Technician.find(query)
      .sort({ mentorRating: -1, experience: -1 });

    res.json({
      success: true,
      mentors: technicians
    });
  } catch (error) {
    console.error('Erreur récupération mentors:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/trainings/user/:userId — farmer's trainings (farmer JWT or admin)
router.get('/user/:userId', requireTrainingAccess, async (req, res) => {
  try {
    if (
      req.trainingAccess === 'farmer' &&
      String(req.farmerId) !== String(req.params.userId)
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const trainings = await Training.find({
      'sessions.participants.farmerId': req.params.userId
    })
      .populate('centerId', 'nom localisation')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      trainings
    });
  } catch (error) {
    console.error('Erreur récupération formations utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/trainings - Liste des formations (admin | growth coop | farmer)
router.get('/', requireTrainingAccess, async (req, res) => {
  try {
    const { region, sujet, statut, niveau } = req.query;
    const query = {};

    if (region) query.region = region;
    if (sujet) query.sujet = sujet;
    if (statut) query.statut = statut;
    if (niveau) query.niveau = niveau;

    const trainings = await Training.find(query)
      .populate('centerId', 'nom localisation')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      trainings
    });
  } catch (error) {
    console.error('Erreur récupération formations:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/trainings/:id - Détails d'une formation
router.get('/:id', requireTrainingAccess, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('centerId', 'nom localisation contact')
      .populate('createdBy', 'name email')
      .populate('sessions.mentorId', 'nom prenom specialite telephone');

    if (!training) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }

    res.json({
      success: true,
      training
    });
  } catch (error) {
    console.error('Erreur récupération formation:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// POST /api/trainings/:id/register - farmer or growth coop
router.post('/:id/register', requireTrainingAccess, async (req, res) => {
  try {
    const { sessionId, farmerId, nom, telephone } = req.body;
    const resolvedFarmerId =
      req.trainingAccess === 'farmer' ? req.farmerId : farmerId;

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }

    const session = training.sessions.id(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (session.participants.length >= session.capaciteMax) {
      return res.status(400).json({ error: 'Session complète' });
    }

    const alreadyRegistered = session.participants.some(
      (p) => p.farmerId && p.farmerId.toString() === String(resolvedFarmerId)
    );

    if (alreadyRegistered) {
      return res.status(400).json({ error: 'Déjà inscrit à cette session' });
    }

    session.participants.push({
      farmerId: resolvedFarmerId,
      nom,
      telephone,
      statut: 'registered'
    });

    await training.save();

    res.json({
      success: true,
      message: 'Inscription réussie',
      training
    });
  } catch (error) {
    console.error('Erreur inscription formation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/trainings/:id/sessions/:sessionId/assign-mentor - Assigner un mentor (protégée admin)
router.put('/:id/sessions/:sessionId/assign-mentor', authenticateToken, async (req, res) => {
  try {
    const { mentorId } = req.body;

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }

    const session = training.sessions.id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (mentorId) {
      const technician = await Technician.findById(mentorId);
      if (!technician) {
        return res.status(404).json({ error: 'Technicien non trouvé' });
      }

      session.mentorId = mentorId;
      session.mentor = {
        nom: `${technician.nom} ${technician.prenom}`,
        specialite: technician.specialite,
        telephone: technician.telephone
      };
    } else {
      session.mentorId = null;
      session.mentor = null;
    }

    await training.save();

    res.json({
      success: true,
      message: 'Mentor assigné avec succès',
      training
    });
  } catch (error) {
    console.error('Erreur assignation mentor:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
