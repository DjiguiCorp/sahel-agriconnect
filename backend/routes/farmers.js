import express from 'express';
import jwt from 'jsonwebtoken';
import Farmer from '../models/Farmer.js';
import VerificationCode from '../models/VerificationCode.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateFarmer, validateFarmerUpdate } from '../middleware/validation.js';
import { countryFilter } from '../middleware/countryFilter.js';
import { queueNotification, messageTemplates } from '../services/notificationService.js';
import { normalizePhone, farmerTelephoneQuery } from '../utils/phone.js';
import DeviceSession from '../models/DeviceSession.js';

const router = express.Router();

// GET /api/farmers/public-stats — public summary stats, no auth required
router.get('/public-stats', async (req, res) => {
  try {
    const total = await Farmer.countDocuments({ statut: 'Actif' });
    const active = await Farmer.countDocuments({ statut: 'Actif' });
    const totalAreaResult = await Farmer.aggregate([{ $group: { _id: null, total: { $sum: '$superficie' } } }]);
    const totalArea = totalAreaResult[0]?.total || 0;
    const byCountry = await Farmer.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const byCrop = await Farmer.aggregate([
      { $unwind: '$cultures' },
      { $group: { _id: '$cultures', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);
    // Get recent farmers (last 10, anonymized for privacy)
    const recent = await Farmer.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('nom cultures autresCultures superficie region country statut createdAt nomCooperative lienCooperative')
      .lean();
    res.json({ success: true, total, active, totalArea, byCountry, byCrop, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farmers/session — mobile app session (JWT) by registered email or phone
router.post('/session', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const phone = req.body?.phone ? normalizePhone(req.body.phone) : '';

    if (!email && !phone) {
      return res.status(400).json({ error: 'email or phone required' });
    }

    const farmer = email
      ? await Farmer.findOne({ email }).lean()
      : await Farmer.findOne(farmerTelephoneQuery(phone)).lean();

    if (!farmer) return res.status(404).json({ success: false, error: 'Not found' });

    const token = jwt.sign(
      {
        role: 'farmer',
        id: farmer._id.toString(),
        email: farmer.email || email,
        nom: farmer.nom,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const sessionSeed = await DeviceSession.issue(
      farmer._id.toString(),
      'farmer',
      req.headers['user-agent']?.slice(0, 80) || '',
    );

    res.json({
      success: true,
      token,
      sessionSeed,
      farmer: {
        nom: farmer.nom,
        email: farmer.email,
        country: farmer.country,
        region: farmer.region,
        statut: farmer.statut,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farmers/register-mobile — complete signup after OTP (requires pendingRegistrationId)
router.post('/register-mobile', async (req, res) => {
  try {
    const pendingRegistrationId = String(req.body?.pendingRegistrationId || '').trim();
    const nom = String(req.body?.nom || '').trim();
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const telephone = req.body?.telephone ? String(req.body.telephone).trim() : '';
    const region = req.body?.region ? String(req.body.region).trim() : 'Unknown';
    const cultures = Array.isArray(req.body?.cultures) ? req.body.cultures : [];
    const statutRaw = String(req.body?.statut || 'Actif');
    const statut = statutRaw === 'Actif' ? 'Actif' : 'En attente';

    if (!pendingRegistrationId) {
      return res.status(400).json({ success: false, error: 'pendingRegistrationId required' });
    }
    if (nom.length < 2) {
      return res.status(400).json({ success: false, error: 'nom required' });
    }
    if (!email && !telephone) {
      return res.status(400).json({ success: false, error: 'email or telephone required' });
    }

    const v = await VerificationCode.findById(pendingRegistrationId);
    if (!v || !v.used || !['farmer_verify', 'login'].includes(v.purpose) || v.registrationUsed) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification' });
    }
    const verifiedAt = new Date(v.updatedAt || v.createdAt).getTime();
    if (Date.now() - verifiedAt > 45 * 60 * 1000) {
      return res.status(400).json({ success: false, error: 'Verification expired' });
    }

    const contactOk =
      (email && v.email && v.email === email) ||
      (telephone &&
        v.phone &&
        normalizePhone(v.phone) === normalizePhone(telephone));
    if (!contactOk) {
      return res.status(400).json({ success: false, error: 'Contact mismatch' });
    }

    const dupQ = email ? { email } : farmerTelephoneQuery(normalizePhone(telephone));
    const existing = await Farmer.findOne(dupQ).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: 'Account already exists' });
    }

    const farmer = new Farmer({
      nom,
      telephone: telephone ? normalizePhone(telephone) : `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      email: email || '',
      region,
      latitude: req.body?.latitude != null ? String(req.body.latitude) : '0',
      longitude: req.body?.longitude != null ? String(req.body.longitude) : '0',
      superficie: 0,
      cultures: cultures.length ? cultures.map(String) : ['Other'],
      typeExploitation: 'Familiale',
      objectifsProduction: ['Souveraineté alimentaire locale'],
      accesElectricite: 'Partiel',
      accesStockage: 'Non',
      statut,
      emailVerified: true,
      verifiedAt: new Date(),
    });
    await farmer.save();

    v.registrationUsed = true;
    await v.save();

    const lean = farmer.toObject();
    const token = jwt.sign(
      {
        role: 'farmer',
        id: farmer._id.toString(),
        email: lean.email || email,
        nom: lean.nom,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' },
    );

    const sessionSeed = await DeviceSession.issue(
      farmer._id.toString(),
      'farmer',
      req.headers['user-agent']?.slice(0, 80) || '',
    );

    res.status(201).json({
      success: true,
      token,
      sessionSeed,
      farmer: {
        id: farmer._id.toString(),
        nom: lean.nom,
        email: lean.email,
        telephone: lean.telephone,
        country: lean.country,
        region: lean.region,
        statut: lean.statut,
      },
    });
  } catch (err) {
    console.error('register-mobile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/farmers/flag-pending-sms — phone-only web registration (SMS pending)
router.patch('/flag-pending-sms', async (req, res) => {
  try {
    const telephone = normalizePhone(req.body?.telephone);
    if (!telephone) return res.status(400).json({ error: 'telephone required' });

    const farmer = await Farmer.findOneAndUpdate(
      farmerTelephoneQuery(telephone),
      { statut: 'En attente' },
      { new: true },
    );

    res.json({ success: true, updated: Boolean(farmer) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farmers - Enregistrement d'un agriculteur (public)
router.post('/', validateFarmer, async (req, res) => {
  try {
    if (req.body.telephone) {
      req.body.telephone = normalizePhone(req.body.telephone);
    }
    const farmerData = {
      ...req.body,
      localisation: `${req.body.latitude}, ${req.body.longitude}`
    };

    const farmer = new Farmer(farmerData);
    await farmer.save();

    queueNotification({
      name: farmer.nom || '',
      phone: farmer.telephone || farmer.phone,
      email: farmer.email,
      message: messageTemplates.farmerRegistered(farmer.nom || ''),
      source: 'farmer_registration',
    }).catch(console.error);

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

// GET /api/farmers - Public lookup (email/phone) OR admin list
router.get('/', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    const phone = String(req.query.phone || '').trim();

    // Public self-lookup by email or phone (no admin token required)
    if (email || phone) {
      const q = {};
      if (email) q.email = email;
      if (phone) q.telephone = phone;

      const farmer = await Farmer.findOne(q)
        .sort({ createdAt: -1 })
        .select('nom telephone email country region statut createdAt qualityLevel nomCooperative lienCooperative investissementCooperative diseaseDetection')
        .lean();

      if (!farmer) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, farmer });
    }

    // Otherwise: protected admin listing
    await authenticateToken(req, res, async () => {
      await countryFilter(req, res, async () => {
        const { 
          region, 
          statut, 
          investissement, 
          page = 1, 
          limit = 50,
          search 
        } = req.query;

        const query = { ...(req.countryFilter || {}) };
        
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

        return res.json({
          success: true,
          farmers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        });
      });
    });
    return;
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
router.get('/stats/summary', authenticateToken, countryFilter, async (req, res) => {
  try {
    const f = req.countryFilter || {};
    const total = await Farmer.countDocuments(f);
    const actifs = await Farmer.countDocuments({ ...f, statut: 'Actif' });
    const enAttente = await Farmer.countDocuments({ ...f, statut: 'En attente' });
    const avecInvestissement = await Farmer.countDocuments({ ...f, investissementCooperative: 'Oui' });
    
    const totalSuperficie = await Farmer.aggregate([
      { $match: f },
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

