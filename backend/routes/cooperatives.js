import express from 'express';
import Cooperative from '../models/Cooperative.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import { authenticateToken } from '../middleware/auth.js';
import { countryFilter } from '../middleware/countryFilter.js';
import { confirmCooperativeRegistration, notifyAdminNewCooperative } from '../services/emailService.js';

const router = express.Router();

router.post('/register-platform', async (req, res) => {
  try {
    const cooperative = await CooperativePlatformRegistration.create({
      cooperativeName: req.body.cooperativeName,
      country: req.body.country,
      regionCity: req.body.regionCity,
      memberCount: Number(req.body.memberCount ?? req.body.currentMembers ?? 0),
      primaryCrops: Array.isArray(req.body.primaryCrops) ? req.body.primaryCrops : [],
      certificationStatus: req.body.certificationStatus || 'None',
      leaderName: req.body.leaderName,
      email: req.body.email,
      phone: req.body.phone || '',
      interests: Array.isArray(req.body.interests) ? req.body.interests : [],
    });

    notifyAdminNewCooperative(cooperative).catch(console.error);
    confirmCooperativeRegistration(cooperative).catch(console.error);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur enregistrement coopérative plateforme:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de l’enregistrement',
    });
  }
});

// GET /api/cooperatives - Liste des coopératives par région (public)
router.get('/', async (req, res) => {
  try {
    const { region } = req.query;
    const email = String(req.query.email || '').trim().toLowerCase();
    const phone = String(req.query.phone || '').trim();

    // Public lookup for cooperative platform registration (no admin token required)
    if (email || phone) {
      const q = {};
      if (email) q.email = email;
      if (phone) q.phone = phone;
      const registration = await CooperativePlatformRegistration.findOne(q)
        .sort({ createdAt: -1 })
        .lean();
      if (!registration) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, cooperative: registration });
    }

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

// GET /api/cooperatives/platform-registrations — protected admin list (supports ?status=...)
router.get('/platform-registrations', authenticateToken, async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const registrations = await CooperativePlatformRegistration.find(q).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, registrations });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/cooperatives/admin - Liste complète (protégée admin, filtrée par pays si country-admin)
router.get('/admin', authenticateToken, countryFilter, async (req, res) => {
  try {
    const { region } = req.query;
    const query = { ...(req.countryFilter || {}) };
    if (region) query.region = region;

    const cooperatives = await Cooperative.find(query).sort({ nom: 1 }).lean();
    res.json({ success: true, cooperatives });
  } catch (error) {
    console.error('Erreur récupération coopératives (admin):', error);
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

