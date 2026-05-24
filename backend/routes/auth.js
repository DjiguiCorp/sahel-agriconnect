import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Investor from '../models/Investor.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import Farmer from '../models/Farmer.js';
import Processor from '../models/Processor.js';
import { authenticateToken, authenticateAnyUser } from '../middleware/auth.js';
import { sendOtp, verifyOtp } from '../services/otpAuthService.js';

const router = express.Router();

// Login admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Chercher l'admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        country: admin.country ?? null,
        countryCode: admin.countryCode ?? null
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

// Vérifier le token (route protégée)
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      name: req.admin.name,
      role: req.admin.role,
      country: req.admin.country ?? null,
      countryCode: req.admin.countryCode ?? null
    }
  });
});

// POST /api/auth/mobile-handoff-token — short-lived token for web redirect from mobile
router.post('/mobile-handoff-token', authenticateAnyUser, async (req, res) => {
  try {
    const { action } = req.body || {};
    const mu = req.mobileUser;
    let userId = mu.id;
    if (mu.role === 'investor') {
      const inv = await Investor.findOne({ email: mu.email }).select('_id').lean();
      userId = inv?._id?.toString() || mu.email;
    }
    if (!userId) userId = mu.email;
    const handoffToken = jwt.sign(
      {
        userId,
        email: mu.email,
        role: mu.role,
        action: action || 'generic',
        type: 'mobile_handoff',
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ success: true, handoffToken });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/send-otp — mobile app passwordless login (returns verificationId)
router.post('/send-otp', async (req, res) => {
  try {
    const result = await sendOtp({
      purpose: req.body?.purpose || 'login',
      email: req.body?.email,
      phone: req.body?.phone,
      name: req.body?.name,
      role: req.body?.role,
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

// POST /api/auth/verify-otp — validate OTP and issue JWT for registered users
router.post('/verify-otp', async (req, res) => {
  try {
    const result = await verifyOtp({
      verificationId: req.body?.verificationId,
      otp: req.body?.otp,
      role: req.body?.role,
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

// POST /api/auth/fcm-token — register Firebase Cloud Messaging device token
router.post('/fcm-token', authenticateAnyUser, async (req, res) => {
  try {
    const { fcmToken } = req.body || {};
    if (!fcmToken) {
      return res.status(400).json({ error: 'fcmToken required' });
    }
    const mu = req.mobileUser;
    const now = new Date();

    if (mu.role === 'investor') {
      await Investor.findOneAndUpdate(
        { email: mu.email },
        { fcmToken, fcmUpdatedAt: now }
      );
      return res.json({ success: true });
    }
    if (mu.role === 'cooperative_leader') {
      await CooperativePlatformRegistration.findByIdAndUpdate(mu.id, {
        fcmToken,
        fcmUpdatedAt: now,
      });
      return res.json({ success: true });
    }
    if (mu.role === 'country_admin') {
      await GovernmentAdmin.findByIdAndUpdate(mu.id, {
        fcmToken,
        fcmUpdatedAt: now,
      });
      return res.json({ success: true });
    }
    if (mu.role === 'farmer' && mu.id) {
      await Farmer.findByIdAndUpdate(mu.id, { fcmToken, fcmUpdatedAt: now });
      return res.json({ success: true });
    }
    if (mu.role === 'processor' && mu.id) {
      await Processor.findByIdAndUpdate(mu.id, { fcmToken, fcmUpdatedAt: now });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Unsupported role' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

