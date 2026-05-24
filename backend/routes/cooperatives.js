import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import Cooperative from '../models/Cooperative.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import CooperativeInvitation from '../models/CooperativeInvitation.js';
import PendingNotification from '../models/PendingNotification.js';
import ProduceListing from '../models/ProduceListing.js';
import Farmer from '../models/Farmer.js';
import NationalProject from '../models/NationalProject.js';
import { authenticateToken } from '../middleware/auth.js';
import { countryFilter } from '../middleware/countryFilter.js';
import { confirmCooperativeRegistration, notifyAdminNewCooperative } from '../services/emailService.js';
import { queueNotification, messageTemplates } from '../services/notificationService.js';
import { dispatchNotification } from './notifications.js';
import DeviceSession from '../models/DeviceSession.js';

const router = express.Router();

const authCoop = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'cooperative_leader') return res.status(403).json({ error: 'Not a cooperative leader' });
    const coop = await CooperativePlatformRegistration.findById(decoded.coopId);
    if (!coop || coop.status !== 'active') return res.status(403).json({ error: 'Cooperative not active' });
    req.coop = coop;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/cooperatives/public-stats — public summary, no auth
router.get('/public-stats', async (req, res) => {
  try {
    // total = verified cooperatives only (status: active + payment confirmed)
    const total = await CooperativePlatformRegistration.countDocuments({
      status: 'active',
      paymentReceived: true,
    });
    const active = total; // alias kept for backwards compat
    const pending = await CooperativePlatformRegistration.countDocuments({
      status: 'pending_payment',
    });
    // byCountry: only verified cooperatives feed the country stats
    const byCountry = await CooperativePlatformRegistration.aggregate([
      { $match: { status: 'active', paymentReceived: true } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    // totalMembers: only count members from verified cooperatives
    const totalMembers = await CooperativePlatformRegistration.aggregate([
      { $match: { status: 'active', paymentReceived: true } },
      { $group: { _id: null, total: { $sum: '$memberCount' } } },
    ]);
    const recent = await CooperativePlatformRegistration.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('cooperativeName country regionCity memberCount primaryCrops certificationStatus createdAt')
      .lean();
    res.json({
      success: true,
      total,
      active,
      pending,
      byCountry,
      totalMembers: totalMembers[0]?.total || 0,
      recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register-platform', async (req, res) => {
  try {
    const cooperative = await CooperativePlatformRegistration.create({
      cooperativeName: req.body.cooperativeName,
      country: req.body.country,
      regionCity: req.body.regionCity,
      memberCount: Number(req.body.memberCount ?? req.body.currentMembers ?? 0),
      primaryCrops: Array.isArray(req.body.primaryCrops) ? req.body.primaryCrops : [],
      autresCrops: req.body.autresCrops || '',
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

    res.status(201).json({
      success: true,
      cooperativeId: cooperative._id,
      email: cooperative.email,
    });
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
      details: error.message,
    });
  }
});

// POST /api/cooperatives/login — cooperative leader login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const coop = await CooperativePlatformRegistration.findOne({ email: email?.toLowerCase().trim() });
    if (!coop) return res.status(401).json({ error: 'Invalid credentials' });
    if (coop.status !== 'active') return res.status(403).json({ error: 'Portal not yet activated. Contact support.' });

    const hash = coop.passwordHash || coop.tempPassword;
    if (!hash) return res.status(401).json({ error: 'Account not yet configured. Contact support.' });
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      {
        role: 'cooperative_leader',
        coopId: coop._id,
        email: coop.email,
        country: coop.country,
        name: coop.cooperativeName,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const sessionSeed = await DeviceSession.issue(
      coop._id.toString(),
      'cooperative',
      req.headers['user-agent']?.slice(0, 80) || '',
    );

    res.json({
      success: true,
      token,
      sessionSeed,
      cooperative: {
        _id: coop._id,
        cooperativeName: coop.cooperativeName,
        country: coop.country,
        email: coop.email,
        leaderName: coop.leaderName,
        memberCount: coop.memberCount,
        primaryCrops: coop.primaryCrops,
        certificationStatus: coop.certificationStatus,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cooperatives/session — email-only mobile session
// Mirrors the web platform's first-access flow: a registered, active
// cooperative can sign in by email alone. Returns a JWT shaped like the
// password login above so the existing `authCoop` middleware accepts it.
router.post('/session', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    const coop = await CooperativePlatformRegistration.findOne({ email });
    if (!coop) {
      return res.status(404).json({ success: false, error: 'Cooperative not found' });
    }
    if (coop.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Portal not yet activated. Contact support.',
      });
    }
    const token = jwt.sign(
      {
        role: 'cooperative_leader',
        coopId: coop._id,
        email: coop.email,
        country: coop.country,
        name: coop.cooperativeName,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );
    const sessionSeed = await DeviceSession.issue(
      coop._id.toString(),
      'cooperative',
      req.headers['user-agent']?.slice(0, 80) || '',
    );
    res.json({
      success: true,
      token,
      sessionSeed,
      cooperative: {
        _id: coop._id,
        cooperativeName: coop.cooperativeName,
        country: coop.country,
        email: coop.email,
        leaderName: coop.leaderName,
        memberCount: coop.memberCount,
        primaryCrops: coop.primaryCrops,
        certificationStatus: coop.certificationStatus,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/cooperatives/set-password — cooperative sets own password (first login from temp)
router.post('/set-password', authCoop, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await CooperativePlatformRegistration.findByIdAndUpdate(req.coop._id, {
      passwordHash: hash,
      tempPassword: null,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/cooperatives/my-portal — full cooperative dashboard data
router.get('/my-portal', authCoop, async (req, res) => {
  try {
    const coopName = req.coop.cooperativeName || req.coop.nomCooperative;
    const country = req.coop.country;

    const [memberFarmers, produceListings, invitations, projects] = await Promise.all([
      Farmer.find({
        $or: [{ nomCooperative: new RegExp(String(coopName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { cooperativeId: req.coop._id }],
      })
        .select('nom cultures superficie region statut telephone email createdAt emailVerified')
        .lean(),
      ProduceListing.find({ cooperativeId: req.coop._id }).sort({ createdAt: -1 }).lean(),
      CooperativeInvitation.find({ cooperativeId: req.coop._id }).sort({ createdAt: -1 }).limit(50).lean(),
      NationalProject.find({
        country,
        status: 'active',
        targetAudience: { $in: ['cooperatives', 'all'] },
      })
        .select(
          'title titleFr description descriptionFr projectType priority incentives requirements startDate endDate createdByName organization responses'
        )
        .lean(),
    ]);

    const projectsWithMine = projects.map((p) => {
      const mine = (p.responses || []).find((r) => String(r.respondentId) === String(req.coop._id));
      const { responses, ...rest } = p;
      return { ...rest, myResponse: mine?.response };
    });

    const stats = {
      memberCount: memberFarmers.length,
      totalAreaHa: memberFarmers.reduce((s, f) => s + (Number(f.superficie) || 0), 0),
      pendingListings: produceListings.filter((l) => !l.cooperativeApproved).length,
      promotedListings: produceListings.filter((l) => l.promotedToMarketplace).length,
      invitationsSent: invitations.length,
      invitationsAccepted: invitations.filter((i) => i.status === 'accepted').length,
      activeProjects: projectsWithMine.length,
    };

    res.json({
      success: true,
      stats,
      memberFarmers,
      produceListings,
      invitations,
      nationalProjects: projectsWithMine,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/cooperatives/my-portal/approve-listing/:id — approve a farmer's produce listing
router.put('/my-portal/approve-listing/:id', authCoop, async (req, res) => {
  try {
    const listing = await ProduceListing.findOneAndUpdate(
      { _id: req.params.id, cooperativeId: req.coop._id },
      { cooperativeApproved: true, cooperativeApprovedAt: new Date() },
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ success: true, listing });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cooperatives/my-portal/respond-project/:projectId — respond to national project
router.post('/my-portal/respond-project/:projectId', authCoop, async (req, res) => {
  try {
    const { response, notes } = req.body;
    const project = await NationalProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.responses = (project.responses || []).filter((r) => String(r.respondentId || '') !== String(req.coop._id));
    project.responses.push({
      respondentId: req.coop._id,
      respondentType: 'cooperative',
      respondentName: req.coop.cooperativeName,
      respondentEmail: req.coop.email,
      respondentPhone: req.coop.phone,
      response,
      notes,
      respondedAt: new Date(),
    });
    await project.save();

    if (project.createdByEmail) {
      await PendingNotification.create({
        recipientEmail: project.createdByEmail,
        recipientName: project.createdByName,
        message: `📬 Réponse reçue pour votre projet "${project.title}"\n\nCoopérative: ${req.coop.cooperativeName} (${req.coop.country})\nRéponse: ${response}\n${notes ? `Note: ${notes}` : ''}`,
        source: 'project_response',
        status: 'pending',
      });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cooperatives/my-portal/invite — send farmer invitation
router.post('/my-portal/invite', authCoop, async (req, res) => {
  try {
    const { inviteePhone, inviteeEmail, inviteeName, inviteeRegion, message } = req.body;
    const inviteCode = randomBytes(5).toString('hex').toUpperCase();
    const inv = await CooperativeInvitation.create({
      cooperativeId: req.coop._id,
      cooperativeName: req.coop.cooperativeName,
      cooperativeEmail: req.coop.email,
      cooperativeCountry: req.coop.country,
      cooperativeLeader: req.coop.leaderName,
      inviteePhone,
      inviteeEmail,
      inviteeName,
      inviteeRegion,
      message,
      inviteCode,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const inviteMsg = `🤝 INVITATION COOPÉRATIVE\n\n${req.coop.cooperativeName} vous invite à rejoindre leur coopérative sur Sahel AgriConnect.\n\n${message || ''}\n\nCode: ${inviteCode}\nAcceptez ici: ${base}/join-cooperative/${inviteCode}`;

    const notification = await PendingNotification.create({
      recipientName: inviteeName,
      recipientEmail: inviteeEmail,
      recipientPhone: inviteePhone,
      message: inviteMsg,
      source: 'cooperative_invitation',
      status: 'pending',
    });
    await dispatchNotification(notification.toObject());

    res.status(201).json({ success: true, inviteCode, invitation: inv });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/cooperatives/:id - Update platform registration (protégée admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    const existing = await CooperativePlatformRegistration.findById(req.params.id).lean();
    const activating =
      (updateData.status === 'active' || updateData.paymentReceived === true || req.body.status === 'active' || req.body.paymentReceived === true) &&
      existing &&
      existing.status !== 'active';

    if (activating) {
      const tempPw = randomBytes(5).toString('hex') + '!A1';
      const tempHash = await bcrypt.hash(tempPw, 12);
      updateData.tempPassword = tempHash;
      updateData.status = 'active';
      updateData.paymentReceived = true;
      updateData.activatedAt = new Date();

      const coop = await CooperativePlatformRegistration.findById(req.params.id);
      if (coop?.email) {
        const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
        const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        if (resend) {
          await resend.emails.send({
            from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
            to: coop.email,
            subject: '✅ Votre portail coopérative est activé — Sahel AgriConnect',
            html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#B5850A;margin:0;">Sahel AgriConnect</h1>
            <p style="color:white;margin:8px 0 0;">Portail Coopérative Activé ✅</p>
          </div>
          <div style="padding:32px;background:white;border:1px solid #e0e0e0;">
            <p>Bonjour <strong>${coop.leaderName}</strong>,</p>
            <p>Le portail de votre coopérative <strong>${coop.cooperativeName}</strong> est maintenant actif.</p>
            <div style="background:#f0f9f4;border:1px solid #1a3c2e;border-radius:8px;padding:20px;margin:20px 0;">
              <p style="font-weight:bold;color:#1a3c2e;margin:0 0 12px;">🔐 Vos identifiants de connexion :</p>
              <p style="margin:4px 0;"><strong>Portail :</strong> <a href="${base}/cooperative-portal">${base}/cooperative-portal</a></p>
              <p style="margin:4px 0;"><strong>Email :</strong> ${coop.email}</p>
              <p style="margin:4px 0;"><strong>Mot de passe temporaire :</strong> <code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;">${tempPw}</code></p>
              <p style="color:#e53e3e;font-size:13px;margin-top:8px;">⚠️ Changez votre mot de passe à la première connexion.</p>
            </div>
            <div style="margin-top:20px;">
              <a href="${base}/cooperative-portal" style="background:#1a3c2e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Accéder au portail →</a>
            </div>
          </div>
        </div>`,
          });
        }
      }
    }

    const updated = await CooperativePlatformRegistration.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, cooperative: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

