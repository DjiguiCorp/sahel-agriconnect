import express from 'express';
import jwt from 'jsonwebtoken';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import NationalProject from '../models/NationalProject.js';
import Farmer from '../models/Farmer.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Processor from '../models/Processor.js';
import PendingNotification from '../models/PendingNotification.js';
import GovernmentDirective from '../models/GovernmentDirective.js';
import { authenticateToken } from '../middleware/auth.js';
import { buildTerritoryIntelligence } from '../services/governmentTerritoryService.js';
import DeviceSession from '../models/DeviceSession.js';

// Accepted institutional domain patterns — covers all 54 African countries.
const GOVERNMENT_DOMAINS = [
  // Generic
  '.gov',
  '.gouv',
  '.gou',
  // West Africa — francophone
  '.gov.ml', '.gouv.ml',
  '.gov.sn', '.gouv.sn',
  '.gov.ci', '.gouv.ci',
  '.gov.bf', '.gouv.bf',
  '.gov.ne', '.gouv.ne',
  '.gov.tg', '.gouv.tg',
  '.gov.bj', '.gouv.bj',
  '.gov.gn',
  '.gov.gw',  // Guinea-Bissau
  '.gov.mr',  // Mauritania
  '.gov.cv',  // Cape Verde
  // West Africa — anglophone
  '.gov.gh',
  '.gov.ng',
  '.gov.sl',  // Sierra Leone
  '.gov.lr',  // Liberia
  '.gov.gm',  // Gambia
  // Central Africa
  '.gouv.cm', '.gov.cm',
  '.gov.cd', '.gouv.cd',  // DRC
  '.gov.cg',  // Congo (Brazzaville)
  '.gov.ga',  // Gabon
  '.gov.td',  // Chad
  '.gov.st',  // São Tomé
  // East Africa
  '.go.ke', '.gov.ke',
  '.gov.et',
  '.gov.rw',
  '.gov.tz',
  '.gov.ug',
  '.gov.bi',  // Burundi
  '.gov.so',  // Somalia
  '.gov.dj',  // Djibouti
  '.gov.er',  // Eritrea
  '.gov.sd',  // Sudan
  '.gov.ss',  // South Sudan
  '.gov.km',  // Comoros
  '.gov.sc',  // Seychelles
  // Southern Africa
  '.gov.za',
  '.gov.zm',
  '.gov.mz',
  '.gov.mw',  // Malawi
  '.gov.zw',  // Zimbabwe
  '.gov.bw',  // Botswana
  '.gov.na',  // Namibia
  '.gov.ls',  // Lesotho
  '.gov.sz',  // Eswatini
  '.gov.ao',  // Angola
  '.gov.mg',  // Madagascar
  // North Africa
  '.gov.eg',
  '.gov.ly',
  '.gov.tn',
  '.gov.dz',
  '.gov.ma',
  // Testing only — remove in production
  'sahel-test.gov',
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

function validateOfficialKyc(kyc) {
  if (!kyc || typeof kyc !== 'object') {
    return { valid: false, error: 'Official verification (KYC) is required for this action.' };
  }
  const required = [
    'fullLegalName',
    'officialTitle',
    'ministryDepartment',
    'governmentIdNumber',
    'authorizationReference',
    'officialPhone',
    'officialEmail',
  ];
  for (const field of required) {
    if (!String(kyc[field] || '').trim()) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  if (!kyc.digitalSignatureAck) {
    return { valid: false, error: 'Digital authorization acknowledgment is required.' };
  }
  return { valid: true };
}

async function broadcastDirectiveNotifications(directive, country) {
  const targets = directive.targetAudience?.length ? directive.targetAudience : ['all'];
  const regionFilter = directive.targetRegions?.length
    ? {
        $or: directive.targetRegions.map((r) => ({
          $or: [{ region: new RegExp(r, 'i') }, { zone: new RegExp(r, 'i') }],
        })),
      }
    : null;

  let broadcastCount = 0;
  const notifications = [];
  const org = directive.organization || 'Government';
  const msg = `🏛️ ${org} (${country}) — ${directive.title}\n\n${directive.body}\n\nConsultez Sahel AgriConnect pour les détails officiels.`;

  const farmerBase = { $or: [{ country }, { pays: country }] };
  if (regionFilter) Object.assign(farmerBase, regionFilter);

  if (targets.includes('farmers') || targets.includes('all')) {
    const farmers = await Farmer.find(farmerBase).select('nom telephone email').lean();
    farmers.forEach((f) => {
      notifications.push({
        recipientName: f.nom,
        recipientPhone: f.telephone,
        recipientEmail: f.email,
        message: msg,
        source: `government_directive_${directive.directiveType}`,
        status: 'pending',
      });
      broadcastCount++;
    });
  }

  if (targets.includes('cooperatives') || targets.includes('all')) {
    const coopFilter = { country };
    if (directive.assignedCooperativeIds?.length) {
      coopFilter._id = { $in: directive.assignedCooperativeIds };
    }
    const coops = await CooperativePlatformRegistration.find(coopFilter)
      .select('cooperativeName nomCooperative email phone')
      .lean();
    coops.forEach((c) => {
      notifications.push({
        recipientName: c.cooperativeName || c.nomCooperative,
        recipientEmail: c.email,
        recipientPhone: c.phone,
        message: msg,
        source: `government_directive_${directive.directiveType}`,
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
        source: `government_directive_${directive.directiveType}`,
        status: 'pending',
      });
      broadcastCount++;
    });
  }

  if (notifications.length) await PendingNotification.insertMany(notifications);
  return broadcastCount;
}

const router = express.Router();

// Middleware: authenticate government admin
const authGov = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'country_admin') return res.status(403).json({ error: 'Not a government admin' });

    const govAdmin = await GovernmentAdmin.findById(decoded.id).lean();
    if (!govAdmin) return res.status(401).json({ error: 'Account not found' });
    if (govAdmin.status !== 'active') {
      return res.status(403).json({ error: 'Account suspended or pending. Contact support.' });
    }

    req.govAdmin = {
      id: govAdmin._id,
      email: govAdmin.email,
      country: govAdmin.country,
      countryCode: govAdmin.countryCode,
      name: govAdmin.name,
      organization: govAdmin.organization,
      orgType: govAdmin.orgType,
    };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
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
      { expiresIn: '90d' }
    );
    const sessionSeed = await DeviceSession.issue(
      admin._id.toString(),
      'government',
      req.headers['user-agent']?.slice(0, 80) || '',
    );
    res.json({
      success: true,
      token,
      sessionSeed,
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

// GET /api/government/dashboard — country-scoped stats overview
// All data is filtered by req.govAdmin.country so each government / NGO /
// enterprise user only sees data for their own territory.
router.get('/dashboard', authGov, async (req, res) => {
  try {
    const country = req.govAdmin.country;
    const countryFilter = { country };
    const farmerFilter = { $or: [{ country }, { pays: country }] };

    const [
      farmers,
      cooperatives,
      processors,
      projects,
      activeProjects,
      totalResponses,
      recentNotifications,
      recentProjects,
    ] = await Promise.all([
      Farmer.countDocuments(farmerFilter),
      CooperativePlatformRegistration.countDocuments({
        ...countryFilter,
        status: 'active',
        paymentReceived: true,
      }),
      Processor.countDocuments(countryFilter),
      NationalProject.countDocuments(countryFilter),
      NationalProject.countDocuments({ ...countryFilter, status: 'active' }),
      NationalProject.aggregate([
        { $match: countryFilter },
        { $project: { responseCount: { $size: '$responses' } } },
        { $group: { _id: null, total: { $sum: '$responseCount' } } },
      ]),
      PendingNotification.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      NationalProject.find(countryFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const territory = await buildTerritoryIntelligence(country);

    res.json({
      success: true,
      country,
      countryCode: req.govAdmin.countryCode,
      orgRole: req.govAdmin.orgType,
      stats: {
        farmers,
        cooperatives,
        processors,
        projects,
        activeProjects,
        totalResponses: totalResponses[0]?.total || 0,
        totalArableHa: territory.summary.totalArableHa,
        activeFarmers: territory.summary.activeFarmers,
      },
      territorySummary: territory.summary,
      recentNotifications,
      projects: recentProjects,
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
      createdByEmail: req.govAdmin.email,
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

// GET /api/government/territory — regional intelligence (country-scoped)
router.get('/territory', authGov, async (req, res) => {
  try {
    const { region } = req.query;
    const data = await buildTerritoryIntelligence(req.govAdmin.country, { region });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/directives
router.get('/directives', authGov, async (req, res) => {
  try {
    const directives = await GovernmentDirective.find({ country: req.govAdmin.country })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, directives });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/government/directives — official action with enhanced KYC
router.post('/directives', authGov, async (req, res) => {
  try {
    const kycCheck = validateOfficialKyc(req.body.officialKyc);
    if (!kycCheck.valid) return res.status(400).json({ success: false, error: kycCheck.error });

    const {
      directiveType,
      title,
      titleFr,
      body,
      bodyFr,
      targetAudience,
      targetRegions,
      assignedCooperativeIds,
      linkedProjectId,
      effectiveDate,
      reviewDate,
      priority,
      broadcastNow,
    } = req.body;

    if (!directiveType || !title?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, error: 'directiveType, title, and body are required' });
    }

    const directive = await GovernmentDirective.create({
      country: req.govAdmin.country,
      countryCode: req.govAdmin.countryCode,
      createdBy: req.govAdmin.id,
      createdByName: req.govAdmin.name,
      organization: req.govAdmin.organization,
      directiveType,
      title: title.trim(),
      titleFr,
      body: body.trim(),
      bodyFr,
      targetAudience: targetAudience?.length ? targetAudience : ['cooperatives', 'farmers'],
      targetRegions: targetRegions || [],
      assignedCooperativeIds: assignedCooperativeIds || [],
      linkedProjectId,
      effectiveDate,
      reviewDate,
      priority: priority || 'medium',
      officialKyc: {
        ...req.body.officialKyc,
        fullLegalName: String(req.body.officialKyc.fullLegalName).trim(),
        officialEmail: String(req.body.officialKyc.officialEmail).trim().toLowerCase(),
        signedAt: new Date(),
      },
      status: 'draft',
    });

    if (broadcastNow) {
      const count = await broadcastDirectiveNotifications(directive, req.govAdmin.country);
      directive.status = 'broadcast';
      directive.broadcastSentAt = new Date();
      directive.broadcastCount = count;
      await directive.save();
    }

    res.status(201).json({ success: true, directive });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/government/directives/:id/broadcast
router.post('/directives/:id/broadcast', authGov, async (req, res) => {
  try {
    const directive = await GovernmentDirective.findOne({
      _id: req.params.id,
      country: req.govAdmin.country,
    });
    if (!directive) return res.status(404).json({ error: 'Not found' });

    const count = await broadcastDirectiveNotifications(directive, req.govAdmin.country);
    directive.status = 'broadcast';
    directive.broadcastSentAt = new Date();
    directive.broadcastCount = count;
    await directive.save();

    res.json({ success: true, broadcastCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/government/projects/:id/delegate — assign cooperatives to a national project
router.post('/projects/:id/delegate', authGov, async (req, res) => {
  try {
    const kycCheck = validateOfficialKyc(req.body.officialKyc);
    if (!kycCheck.valid) return res.status(400).json({ success: false, error: kycCheck.error });

    const { cooperativeIds = [], notes } = req.body;
    if (!Array.isArray(cooperativeIds) || cooperativeIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Select at least one cooperative' });
    }

    const project = await NationalProject.findOneAndUpdate(
      { _id: req.params.id, country: req.govAdmin.country },
      {
        assignedCooperativeIds: cooperativeIds,
        delegationNotes: notes || '',
        delegatedAt: new Date(),
        delegatedBy: req.govAdmin.id,
        updatedAt: new Date(),
      },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const coops = await CooperativePlatformRegistration.find({
      _id: { $in: cooperativeIds },
      country: req.govAdmin.country,
    })
      .select('cooperativeName email phone')
      .lean();

    const msg = `🏛️ Délégation de projet — ${project.title}\n\nVotre coopérative est désignée pour ce programme national. Connectez-vous à Sahel AgriConnect.\n\n${notes || ''}`;

    const notifications = coops.map((c) => ({
      recipientName: c.cooperativeName,
      recipientEmail: c.email,
      recipientPhone: c.phone,
      message: msg,
      source: 'government_project_delegation',
      status: 'pending',
    }));
    if (notifications.length) await PendingNotification.insertMany(notifications);

    res.json({ success: true, project, notifiedCooperatives: notifications.length });
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

