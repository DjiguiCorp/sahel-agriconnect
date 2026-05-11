import express from 'express';
import jwt from 'jsonwebtoken';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import NationalProject from '../models/NationalProject.js';
import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Processor from '../models/Processor.js';
import PendingNotification from '../models/PendingNotification.js';
import { authenticateToken } from '../middleware/auth.js';

// Accepted institutional domain patterns
const GOVERNMENT_DOMAINS = [
  '.gov',
  '.gouv',
  '.gou',
  '.gov.ml',
  '.gov.gh',
  '.gov.sn',
  '.gov.ng',
  '.gov.bf',
  '.gov.ne',
  '.gov.ci',
  '.gov.tg',
  '.gov.bj',
  '.gov.gn',
  '.gouv.ml',
  '.gouv.sn',
  '.gouv.ci',
  '.gouv.bf',
  '.gouv.ne',
  '.gouv.tg',
  '.gouv.bj',
  '.gouv.cm',
  '.go.ke',
  '.gov.ke',
  '.gov.et',
  '.gov.rw',
  '.gov.tz',
  '.gov.ug',
  '.gov.za',
  '.gov.zm',
  '.gov.mz',
  'sahel-test.gov', // for testing only — remove in production
];

const NGO_DOMAINS = [
  '.org',
  '.ngo',
  '.ong',
  '.int',
  'fao.org',
  'wfp.org',
  'undp.org',
  'worldbank.org',
  'ifad.org',
  'usaid.gov',
  'giz.de',
  'afd.fr',
  'sida.se',
  'dfid.gov.uk',
  'oxfam.org',
  'care.org',
  'africare.org',
  'agra.org',
];

const ENTERPRISE_BLOCKED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'yandex.com',
];

function validateInstitutionalEmail(email, orgType) {
  const e = String(email || '').toLowerCase().trim();
  const domain = e.split('@')[1];
  if (!domain) return { valid: false, reason: 'Invalid email format' };

  if (orgType === 'government') {
    const isGov = GOVERNMENT_DOMAINS.some((d) => domain.endsWith(d) || domain.includes(d));
    if (!isGov) {
      return {
        valid: false,
        reason: `Government accounts require an official government email (.gov, .gouv, .gov.ml etc). Received: @${domain}`,
      };
    }
  }

  if (orgType === 'enterprise') {
    if (ENTERPRISE_BLOCKED_DOMAINS.includes(domain)) {
      return {
        valid: false,
        reason: 'Enterprise accounts cannot use personal email providers. Please use your organization email.',
      };
    }
  }

  if (orgType === 'ngo') {
    const isPersonal = ENTERPRISE_BLOCKED_DOMAINS.includes(domain);
    if (isPersonal) {
      return {
        valid: false,
        reason: 'NGO accounts cannot use personal email providers.',
      };
    }
  }

  return { valid: true };
}

const router = express.Router();

// Middleware: authenticate government admin
const authGov = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'country_admin') return res.status(403).json({ error: 'Not a government admin' });
    req.govAdmin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/government/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await GovernmentAdmin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    if (admin.status !== 'active') {
      return res.status(403).json({ error: 'Account not active. Contact Sahel AgriConnect.' });
    }
    const valid = await admin.verifyPassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const emailCheck = validateInstitutionalEmail(admin.email, admin.orgType || 'government');
    if (!emailCheck.valid && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Account email does not meet institutional requirements. Contact support.',
      });
    }

    admin.lastLogin = new Date();
    await admin.save();
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        country: admin.country,
        countryCode: admin.countryCode,
        role: 'country_admin',
        name: admin.name,
        organization: admin.organization,
        orgType: admin.orgType || 'government',
        accessTier: admin.accessTier || 'pilot',
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        country: admin.country,
        organization: admin.organization,
        orgType: admin.orgType || 'government',
        accessTier: admin.accessTier || 'pilot',
        permissions: admin.permissions,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/government/create-admin — platform admin creates a country admin
router.post('/create-admin', authenticateToken, async (req, res) => {
  try {
    const {
      country,
      countryCode,
      name,
      email,
      password,
      organization,
      licenseId,
      orgType = 'government',
    } = req.body;

    const emailCheck = validateInstitutionalEmail(email, orgType);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.reason });
    }

    const passwordHash = await GovernmentAdmin.hashPassword(password);
    const admin = await GovernmentAdmin.create({
      country,
      countryCode,
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      organization,
      licenseId,
      status: 'active',
      orgType: orgType || 'government',
    });
    res.status(201).json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        country: admin.country,
        orgType: admin.orgType,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/government/test-create — DEV ONLY: create test accounts without email validation
router.post('/test-create', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const { country = 'Mali', countryCode = 'ML', orgType = 'government' } = req.body;
    const testData = {
      government: {
        email: `test.admin@agriculture.gov.ml`,
        name: 'Test Gov Admin Mali',
        organization: 'Ministère Agriculture Mali',
      },
      ngo: { email: `mali.director@testfao.org`, name: 'Test NGO Director', organization: 'FAO Mali Test' },
      enterprise: {
        email: `procurement@testenterprise.com`,
        name: 'Test Enterprise',
        organization: 'AgroTrade Test Corp',
      },
    };
    const data = testData[orgType] || testData.government;
    const passwordHash = await GovernmentAdmin.hashPassword('TestPassword123!');

    await GovernmentAdmin.deleteOne({ email: data.email });

    const admin = await GovernmentAdmin.create({
      country,
      countryCode,
      orgType,
      name: data.name,
      email: data.email,
      passwordHash,
      organization: data.organization,
      status: 'active',
    });
    res.json({
      success: true,
      message: 'Test account created',
      credentials: { email: data.email, password: 'TestPassword123!', country, orgType },
      note: 'This route is disabled in production',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/government/dashboard — country stats overview
router.get('/dashboard', authGov, async (req, res) => {
  try {
    const country = req.govAdmin.country;
    const [farmers, cooperatives, processors, projects] = await Promise.all([
      Farmer.countDocuments({ $or: [{ country }, { pays: country }] }),
      CooperativePlatformRegistration.countDocuments({ country }),
      Processor.countDocuments({ country }),
      NationalProject.countDocuments({ country }),
    ]);
    const activeProjects = await NationalProject.countDocuments({ country, status: 'active' });
    const totalResponses = await NationalProject.aggregate([
      { $match: { country } },
      { $project: { responseCount: { $size: '$responses' } } },
      { $group: { _id: null, total: { $sum: '$responseCount' } } },
    ]);
    res.json({
      success: true,
      stats: {
        farmers,
        cooperatives,
        processors,
        projects,
        activeProjects,
        totalResponses: totalResponses[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/farmers — paginated, country-scoped
router.get('/farmers', authGov, async (req, res) => {
  try {
    const { page = 1, limit = 50, region, crop, search } = req.query;
    const country = req.govAdmin.country;
    const filter = { $or: [{ country }, { pays: country }] };
    if (region) filter.$or = [{ region: new RegExp(region, 'i') }, { zone: new RegExp(region, 'i') }];
    if (crop) filter.cultures = new RegExp(crop, 'i');
    if (search) filter.nom = new RegExp(search, 'i');
    const [farmers, total] = await Promise.all([
      Farmer.find(filter)
        .select('nom cultures superficie region zone statut lienCooperative nomCooperative telephone createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Farmer.countDocuments(filter),
    ]);
    res.json({ success: true, farmers, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/cooperatives
router.get('/cooperatives', authGov, async (req, res) => {
  try {
    const { status, search } = req.query;
    const country = req.govAdmin.country;
    const filter = { country };
    if (status) filter.status = status;
    if (search) filter.cooperativeName = new RegExp(search, 'i');
    const coops = await CooperativePlatformRegistration.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, cooperatives: coops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/processors
router.get('/processors', authGov, async (req, res) => {
  try {
    const country = req.govAdmin.country;
    const processors = await Processor.find({ country }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, processors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/projects
router.get('/projects', authGov, async (req, res) => {
  try {
    const projects = await NationalProject.find({ country: req.govAdmin.country }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/government/projects — create national project
router.post('/projects', authGov, async (req, res) => {
  try {
    const project = await NationalProject.create({
      ...req.body,
      country: req.govAdmin.country,
      countryCode: req.govAdmin.countryCode,
      createdBy: req.govAdmin.id,
      createdByName: req.govAdmin.name,
      organization: req.govAdmin.organization,
    });
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/government/projects/:id — update project
router.put('/projects/:id', authGov, async (req, res) => {
  try {
    const project = await NationalProject.findOneAndUpdate(
      { _id: req.params.id, country: req.govAdmin.country },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/government/projects/:id/broadcast — broadcast to all in country
router.post('/projects/:id/broadcast', authGov, async (req, res) => {
  try {
    const country = req.govAdmin.country;
    const project = await NationalProject.findOne({ _id: req.params.id, country });
    if (!project) return res.status(404).json({ error: 'Not found' });

    const targets = project.targetAudience;
    let broadcastCount = 0;
    const notifications = [];

    const msg = `🇦🇫 MESSAGE OFFICIEL — ${project.organization || 'Gouvernement'} (${country})\n\n${project.title}\n\n${project.description}\n\nRépondez sur Sahel AgriConnect pour participer.`;

    if (targets.includes('farmers') || targets.includes('all')) {
      const farmers = await Farmer.find({ $or: [{ country }, { pays: country }] }).select('nom telephone email').lean();
      farmers.forEach((f) => {
        notifications.push({
          recipientName: f.nom,
          recipientPhone: f.telephone,
          recipientEmail: f.email,
          message: msg,
          source: 'national_project',
          status: 'pending',
        });
        broadcastCount++;
      });
    }

    if (targets.includes('cooperatives') || targets.includes('all')) {
      const coops = await CooperativePlatformRegistration.find({ country })
        .select('cooperativeName nomCooperative email phone')
        .lean();
      coops.forEach((c) => {
        notifications.push({
          recipientName: c.cooperativeName || c.nomCooperative,
          recipientEmail: c.email,
          recipientPhone: c.phone,
          message: msg,
          source: 'national_project',
          status: 'pending',
        });
        broadcastCount++;
      });
    }

    if (targets.includes('processors') || targets.includes('all')) {
      const processors = await Processor.find({ country }).select('nom email telephone').lean();
      processors.forEach((p) => {
        notifications.push({
          recipientName: p.nom,
          recipientEmail: p.email,
          recipientPhone: p.telephone,
          message: msg,
          source: 'national_project',
          status: 'pending',
        });
        broadcastCount++;
      });
    }

    if (notifications.length > 0) await PendingNotification.insertMany(notifications);

    project.broadcastSentAt = new Date();
    project.broadcastCount = broadcastCount;
    project.status = 'active';
    await project.save();

    res.json({ success: true, broadcastCount, message: `Broadcast sent to ${broadcastCount} recipients` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/government/projects/:id/respond — farmer/coop/processor responds
router.post('/projects/:id/respond', async (req, res) => {
  try {
    const { respondentType, respondentName, respondentEmail, respondentPhone, response, notes } = req.body;
    const project = await NationalProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    project.responses.push({
      respondentType,
      respondentName,
      respondentEmail,
      respondentPhone,
      response,
      notes,
      respondedAt: new Date(),
    });
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/government/projects/public/:country — public projects for a country
router.get('/projects/public/:country', async (req, res) => {
  try {
    const projects = await NationalProject.find({
      country: new RegExp(req.params.country, 'i'),
      status: 'active',
    })
      .select(
        'title titleFr description descriptionFr projectType targetAudience targetCommodities season startDate endDate incentives incentivesFr requirements requirementsFr priority'
      )
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

