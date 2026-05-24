import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Processor from '../models/Processor.js';
import { authenticateAnyUser, authenticateToken } from '../middleware/auth.js';
import { validateProcessor } from '../middleware/validation.js';
import { countryFilter } from '../middleware/countryFilter.js';
import DeviceSession from '../models/DeviceSession.js';

const router = express.Router();

// GET /api/processors/public-stats — public summary, no auth
router.get('/public-stats', async (req, res) => {
  try {
    const total = await Processor.countDocuments();
    const certified = await Processor.countDocuments({ certifie: true });
    const byCountry = await Processor.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const recent = await Processor.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('nom region country statut certifie produitsTransformes autresTypesProduits createdAt')
      .lean();
    res.json({ success: true, total, certified, byCountry, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/processors/session — mobile app session (JWT) by registered email
router.post('/session', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'email required' });

    const p = await Processor.findOne({ email }).lean();
    if (!p) return res.status(404).json({ success: false, error: 'Not found' });

    const token = jwt.sign(
      {
        role: 'processor',
        id: p._id.toString(),
        email: p.email || email,
        name: p.nom,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const sessionSeed = await DeviceSession.issue(
      p._id.toString(),
      'processor',
      req.headers['user-agent']?.slice(0, 80) || '',
    );

    res.json({
      success: true,
      token,
      sessionSeed,
      processor: {
        nom: p.nom,
        email: p.email,
        country: p.country,
        region: p.region,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/processors/login — email + password (password optional until passwordHash is set)
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password required' });
    }

    const p = await Processor.findOne({ email }).select('+passwordHash').lean();
    if (!p) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    if (p.passwordHash) {
      const ok = await bcrypt.compare(password, p.passwordHash);
      if (!ok) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      {
        role: 'processor',
        id: p._id.toString(),
        email: p.email || email,
        name: p.nom,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' },
    );

    const sessionSeed = await DeviceSession.issue(
      p._id.toString(),
      'processor',
      req.headers['user-agent']?.slice(0, 80) || '',
    );

    return res.json({
      success: true,
      token,
      sessionSeed,
      processor: {
        nom: p.nom,
        email: p.email,
        country: p.country,
        region: p.region,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/processors/my-portal — logged-in processor (mobile JWT)
router.get('/my-portal', authenticateAnyUser, async (req, res) => {
  try {
    if (req.mobileUser?.role !== 'processor') {
      return res.status(403).json({ success: false, error: 'Processor access required' });
    }
    const p = await Processor.findById(req.mobileUser.id).lean();
    if (!p) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    const location = [p.region, p.country].filter(Boolean).join(', ');
    res.json({
      success: true,
      processor: {
        name: p.nom,
        location: location || p.localisation || '',
        activeLots: 0,
        certifiedBatches: 0,
        capacity: p.capaciteMax != null ? `${p.capaciteMax} t` : '—',
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/processors - Inscription d'un processeur (public)
router.post('/', validateProcessor, async (req, res) => {
  try {
    const processorData = {
      ...req.body,
      localisation: `${req.body.latitude}, ${req.body.longitude}`
    };

    const processor = new Processor(processorData);
    await processor.save();

    res.status(201).json({
      success: true,
      message: 'Processeur enregistré avec succès',
      processor
    });
  } catch (error) {
    console.error('Erreur création processeur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'enregistrement',
      details: error.message 
    });
  }
});

// GET /api/processors - Liste des processeurs (protégée admin)
router.get('/', authenticateToken, countryFilter, async (req, res) => {
  try {
    const { region, statut } = req.query;
    const query = { ...(req.countryFilter || {}) };
    
    if (region) query.region = region;
    if (statut) query.statut = statut;

    const processors = await Processor.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      processors
    });
  } catch (error) {
    console.error('Erreur récupération processeurs:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/processors/:id - Détails d'un processeur (protégée admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const processor = await Processor.findById(req.params.id);
    
    if (!processor) {
      return res.status(404).json({ error: 'Processeur non trouvé' });
    }

    res.json({
      success: true,
      processor
    });
  } catch (error) {
    console.error('Erreur récupération processeur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/processors/region/:region - Processeurs par région (public pour suggestions)
router.get('/region/:region', async (req, res) => {
  try {
    const processors = await Processor.find({ 
      region: req.params.region,
      statut: 'Opérationnelle'
    }).sort({ capaciteMax: -1 });

    res.json({
      success: true,
      processors
    });
  } catch (error) {
    console.error('Erreur récupération processeurs par région:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

export default router;

