import express from 'express';
import Training from '../models/Training.js';
import Technician from '../models/Technician.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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

// GET /api/trainings - Liste des formations
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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

// GET /api/trainings/user/:userId - Formations d'un utilisateur (farmer)
router.get('/user/:userId', async (req, res) => {
  try {
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

// POST /api/trainings/:id/register - S'inscrire à une session (public - farmer)
router.post('/:id/register', async (req, res) => {
  try {
    const { sessionId, farmerId, nom, telephone } = req.body;

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }

    const session = training.sessions.id(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier la capacité
    if (session.participants.length >= session.capaciteMax) {
      return res.status(400).json({ error: 'Session complète' });
    }

    // Vérifier si déjà inscrit
    const alreadyRegistered = session.participants.some(
      p => p.farmerId && p.farmerId.toString() === farmerId
    );

    if (alreadyRegistered) {
      return res.status(400).json({ error: 'Déjà inscrit à cette session' });
    }

    session.participants.push({
      farmerId,
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

// GET /api/trainings/mentors/available - Liste des mentors disponibles
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

export default router;
