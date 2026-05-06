import express from 'express';
import mongoose from 'mongoose';
import CountryLicense from '../models/CountryLicense.js';
import Admin from '../models/Admin.js';
import Farmer from '../models/Farmer.js';
import Cooperative from '../models/Cooperative.js';
import Processor from '../models/Processor.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (!req.admin) return res.status(401).json({ error: 'Token d\'authentification requis' });
  if (req.admin.role !== 'super-admin') return res.status(403).json({ error: 'Access denied' });
  return next();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

// GET /api/licenses — return all licenses, super-admin only
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const licenses = await CountryLicense.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, licenses });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/licenses — create new license record, super-admin only
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const license = await CountryLicense.create(req.body);
    res.status(201).json({ success: true, license });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// PUT /api/licenses/:id — update license status, super-admin only
router.put('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
    const license = await CountryLicense.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!license) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, license });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// POST /api/licenses/:id/create-admin — create a country-admin user linked to license, super-admin only
router.post('/:id/create-admin', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'name, email, password are required' });
    }
    const license = await CountryLicense.findById(req.params.id);
    if (!license) return res.status(404).json({ success: false, error: 'License not found' });

    const existing = await Admin.findOne({ email: String(email).toLowerCase() }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: 'Admin email already exists' });
    }

    const admin = await Admin.create({
      name,
      email: String(email).toLowerCase(),
      password,
      role: 'country-admin',
      country: license.country,
      countryCode: license.countryCode,
    });

    license.adminUserId = admin._id;
    await license.save();

    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        country: admin.country,
        countryCode: admin.countryCode,
      },
      credentials: { email: admin.email, password },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// GET /api/licenses/:id/stats — return farmer/cooperative/processor counts for the license country
router.get('/:id/stats', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
    const license = await CountryLicense.findById(req.params.id).lean();
    if (!license) return res.status(404).json({ success: false, error: 'License not found' });

    const filter = { country: license.country };
    const [farmers, cooperatives, processors] = await Promise.all([
      Farmer.countDocuments(filter),
      Cooperative.countDocuments(filter),
      Processor.countDocuments(filter),
    ]);

    res.json({
      success: true,
      stats: {
        country: license.country,
        countryCode: license.countryCode,
        farmers,
        cooperatives,
        processors,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;

