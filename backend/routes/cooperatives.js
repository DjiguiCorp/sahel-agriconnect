import express from 'express';
import Cooperative from '../models/Cooperative.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import PendingNotification from '../models/PendingNotification.js';
import { authenticateToken } from '../middleware/auth.js';
import { countryFilter } from '../middleware/countryFilter.js';
import { confirmCooperativeRegistration, notifyAdminNewCooperative } from '../services/emailService.js';
import { queueNotification, messageTemplates } from '../services/notificationService.js';

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
      status: 'pending_payment', // Always starts as pending_payment
      paymentReceived: false,
    });

    notifyAdminNewCooperative(cooperative).catch(console.error);
    confirmCooperativeRegistration(cooperative).catch(console.error);
    queueNotification({
      name: cooperative.leaderName || cooperative.nomResponsable || '',
      phone: cooperative.phone,
      email: cooperative.email,
      message: messageTemplates.cooperativeRegistered(cooperative.leaderName || cooperative.nomResponsable || ''),
      source: 'cooperative_registration',
    }).catch(console.error);

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
    res.json({ success: true, cooperatives: registrations, registrations });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed' });
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

// POST /api/cooperatives/inquiry — public: farmers requesting to join a listed cooperative
router.post('/inquiry', async (req, res) => {
  try {
    const {
      cooperativeId,
      cooperativeName,
      applicantName,
      phone,
      email,
      message,
    } = req.body;

    if (!applicantName || !phone) {
      return res.status(400).json({ error: 'Name and phone required' });
    }

    const name = cooperativeName || '—';
    await PendingNotification.create({
      recipientName: 'Admin',
      recipientEmail: process.env.ADMIN_EMAIL || 'info@djiguicorporation.org',
      message: `🤝 DEMANDE ADHÉSION COOPÉRATIVE\nCoopérative: ${name}\nCoop ID: ${cooperativeId || '—'}\nDemandeur: ${applicantName}\nTél: ${phone}\nEmail: ${email || 'non fourni'}\nMessage: ${message || 'aucun'}`,
      source: 'cooperative_inquiry',
      status: 'pending',
    });

    try {
      await notifyAdminNewCooperative({
        cooperativeName: `[DEMANDE ADHÉSION] ${applicantName} → ${name}`,
        leaderName: applicantName,
        country: cooperativeId ? `Coop ID: ${cooperativeId}` : '',
        memberCount: '—',
        primaryCrops: message ? [String(message)] : [],
        interests: [`Téléphone demandeur: ${phone}`],
        email: email || 'non fourni',
        phone,
      });
    } catch (e) {
      console.error('Cooperative inquiry email:', e);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Cooperative inquiry error:', err);
    res.status(500).json({ error: err.message });
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

// PUT /api/cooperatives/:id - Update platform registration (protégée admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    // If confirming payment, set activation timestamp
    if (req.body.paymentReceived === true || req.body.status === 'active') {
      updateData.activatedAt = new Date();
      updateData.status = 'active';
      updateData.paymentReceived = true;
    }
    const updated = await CooperativePlatformRegistration.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, cooperative: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

