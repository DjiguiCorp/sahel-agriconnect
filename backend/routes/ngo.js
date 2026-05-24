import express from 'express';
import jwt from 'jsonwebtoken';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import NgoProgram from '../models/NgoProgram.js';
import NgoBeneficiary from '../models/NgoBeneficiary.js';
import NgoReport from '../models/NgoReport.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Farmer from '../models/Farmer.js';
import { authNgo } from '../middleware/authNgo.js';
import {
  buildBeneficiaryReportPdf,
  buildProgramReportPdf,
  buildCooperativeReportPdf,
  buildImpactReportPdf,
  computeInsights,
  programToClient,
} from '../services/ngoReportService.js';
import DeviceSession from '../models/DeviceSession.js';

const router = express.Router();

function formatMonthYear(d) {
  if (!d) return 'TBD';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

async function seedDemoPrograms(orgId, orgName, country) {
  const existing = await NgoProgram.countDocuments({ organizationId: orgId });
  if (existing > 0) return;

  const seeds = [
    {
      name: 'Shea Butter Value Chain',
      status: 'active',
      beneficiaries: 1240,
      target: 2000,
      region: 'Koulikoro, Mali',
      type: 'value_chain',
      startLabel: 'Jan 2025',
      endLabel: 'Dec 2026',
      budget: 485000,
      spent: 212000,
      sdgGoals: [1, 2, 8],
    },
    {
      name: 'Women Farmers Empowerment',
      status: 'active',
      beneficiaries: 870,
      target: 1500,
      region: 'Ségou, Mali',
      type: 'empowerment',
      startLabel: 'Mar 2025',
      endLabel: 'Mar 2027',
      budget: 320000,
      spent: 98000,
      sdgGoals: [5, 8],
    },
    {
      name: 'Digital Agriculture Training',
      status: 'planning',
      beneficiaries: 0,
      target: 800,
      region: 'Mopti, Gao, Mali',
      type: 'training',
      startLabel: 'Jul 2026',
      endLabel: 'Jun 2027',
      budget: 195000,
      spent: 0,
      sdgGoals: [2, 4],
    },
  ];

  await NgoProgram.insertMany(
    seeds.map((s) => ({
      ...s,
      organizationId: orgId,
      organizationName: orgName,
      country,
    }))
  );
}

// POST /api/ngo/login — same credentials as government portal (NGO org types only)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await GovernmentAdmin.findOne({ email: String(email).toLowerCase().trim() });
    if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (admin.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account not active' });
    }
    const orgType = admin.orgType || 'government';
    if (!['ngo', 'international_org'].includes(orgType)) {
      return res.status(403).json({
        success: false,
        error: 'This login is for NGO and international organization accounts.',
      });
    }
    const valid = await admin.verifyPassword(password);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

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
        orgType,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );

    const sessionSeed = await DeviceSession.issue(
      admin._id.toString(),
      'ngo',
      req.headers['user-agent']?.slice(0, 80) || '',
    );

    res.json({
      success: true,
      token,
      sessionSeed,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        organization: admin.organization,
        country: admin.country,
        orgType,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/ngo/portal — aggregate dashboard (mobile + web)
router.get('/portal', authNgo, async (req, res) => {
  try {
    const { id, organization, country } = req.ngoAdmin;
    await seedDemoPrograms(id, organization, country);

    const programs = await NgoProgram.find({ organizationId: id }).sort({ updatedAt: -1 }).lean();
    const beneficiaries = await NgoBeneficiary.find({ organizationId: id }).sort({ registeredAt: -1 }).lean();

    const coopFilter = { country };
    const cooperatives = await CooperativePlatformRegistration.find(coopFilter)
      .select('cooperativeName nomCooperative region zone email phone memberCount members')
      .limit(50)
      .lean();

    const network = cooperatives.map((c) => ({
      id: c._id.toString(),
      name: c.cooperativeName || c.nomCooperative || 'Cooperative',
      members: c.memberCount ?? c.members ?? 0,
      region: c.region || c.zone || country,
      contact: c.phone || c.email || '',
    }));

    const insights = computeInsights(programs, beneficiaries, cooperatives);
    const reports = await NgoReport.find({ organizationId: id })
      .select('-pdfBase64')
      .sort({ generatedAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      admin: req.ngoAdmin,
      stats: {
        beneficiaries: insights.totalBeneficiaries,
        activePrograms: insights.activePrograms,
        cooperatives: network.length,
        registeredBeneficiaries: beneficiaries.length,
      },
      insights,
      programs: programs.map(programToClient),
      beneficiaries: beneficiaries.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        phone: b.phone,
        region: b.region,
        mainCrop: b.mainCrop,
        program: b.programName,
        programId: b.programId?.toString(),
        gender: b.gender,
        registeredAt: b.registeredAt,
        syncedWithRegistry: b.syncedWithRegistry,
      })),
      network,
      reports: reports.map((r) => ({
        id: r._id.toString(),
        reportType: r.reportType,
        title: r.title,
        fileName: r.fileName,
        fileSize: r.fileSize,
        generatedAt: r.generatedAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Programs ───────────────────────────────────────────────
router.get('/programs', authNgo, async (req, res) => {
  const programs = await NgoProgram.find({ organizationId: req.ngoAdmin.id }).sort({ updatedAt: -1 });
  res.json({ success: true, programs: programs.map(programToClient) });
});

router.post('/programs', authNgo, async (req, res) => {
  try {
    const {
      name,
      objectives,
      region,
      type,
      status,
      target,
      budget,
      startDate,
      endDate,
      sdgGoals,
    } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Program name required' });

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const program = await NgoProgram.create({
      organizationId: req.ngoAdmin.id,
      organizationName: req.ngoAdmin.organization,
      country: req.ngoAdmin.country,
      name: name.trim(),
      objectives,
      region,
      type: type || 'value_chain',
      status: status || 'planning',
      target: Number(target) || 0,
      budget: Number(budget) || 0,
      spent: 0,
      beneficiaries: 0,
      startDate: start,
      endDate: end,
      startLabel: formatMonthYear(start),
      endLabel: formatMonthYear(end),
      sdgGoals: Array.isArray(sdgGoals) ? sdgGoals : [],
    });

    res.status(201).json({ success: true, program: programToClient(program) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/programs/:id', authNgo, async (req, res) => {
  try {
    const program = await NgoProgram.findOne({
      _id: req.params.id,
      organizationId: req.ngoAdmin.id,
    });
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });

    const fields = [
      'name',
      'objectives',
      'region',
      'type',
      'status',
      'target',
      'beneficiaries',
      'budget',
      'spent',
      'sdgGoals',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) program[f] = req.body[f];
    }
    if (req.body.startDate) {
      program.startDate = new Date(req.body.startDate);
      program.startLabel = formatMonthYear(program.startDate);
    }
    if (req.body.endDate) {
      program.endDate = new Date(req.body.endDate);
      program.endLabel = formatMonthYear(program.endDate);
    }
    program.updatedAt = new Date();
    await program.save();
    res.json({ success: true, program: programToClient(program) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Beneficiaries ────────────────────────────────────────────
router.post('/beneficiaries', authNgo, async (req, res) => {
  try {
    const { name, phone, region, mainCrop, programId, gender } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name required' });

    let programName = req.body.program;
    if (programId) {
      const prog = await NgoProgram.findOne({
        _id: programId,
        organizationId: req.ngoAdmin.id,
      });
      if (prog) {
        programName = prog.name;
        prog.beneficiaries = (prog.beneficiaries || 0) + 1;
        await prog.save();
      }
    }

    let syncedWithRegistry = false;
    let farmerId = null;
    if (phone) {
      const farmer = await Farmer.findOne({
        $or: [{ telephone: phone }, { phone }],
      }).select('_id');
      if (farmer) {
        syncedWithRegistry = true;
        farmerId = farmer._id;
      }
    }

    const beneficiary = await NgoBeneficiary.create({
      organizationId: req.ngoAdmin.id,
      programId: programId || undefined,
      programName,
      country: req.ngoAdmin.country,
      name: name.trim(),
      phone,
      region,
      mainCrop,
      gender: gender || 'unspecified',
      syncedWithRegistry,
      farmerId,
    });

    res.status(201).json({
      success: true,
      beneficiary: {
        id: beneficiary._id.toString(),
        name: beneficiary.name,
        phone: beneficiary.phone,
        region: beneficiary.region,
        mainCrop: beneficiary.mainCrop,
        program: beneficiary.programName,
        gender: beneficiary.gender,
        registeredAt: beneficiary.registeredAt,
        syncedWithRegistry: beneficiary.syncedWithRegistry,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Reports ──────────────────────────────────────────────────
const REPORT_META = {
  beneficiary: {
    title: 'Beneficiary Report',
    titleFr: 'Rapport bénéficiaires',
    build: buildBeneficiaryReportPdf,
  },
  program: {
    title: 'Program Report',
    titleFr: 'Rapport programmes',
    build: buildProgramReportPdf,
  },
  cooperative: {
    title: 'Cooperative Network Report',
    titleFr: 'Rapport réseau coopératives',
    build: buildCooperativeReportPdf,
  },
  impact: {
    title: 'Impact & KPI Report',
    titleFr: 'Rapport impact & indicateurs',
    build: buildImpactReportPdf,
  },
};

router.get('/reports', authNgo, async (req, res) => {
  const reports = await NgoReport.find({ organizationId: req.ngoAdmin.id })
    .select('-pdfBase64')
    .sort({ generatedAt: -1 })
    .limit(50)
    .lean();
  res.json({
    success: true,
    reports: reports.map((r) => ({
      id: r._id.toString(),
      reportType: r.reportType,
      title: r.title,
      fileName: r.fileName,
      fileSize: r.fileSize,
      generatedAt: r.generatedAt,
    })),
  });
});

router.post('/reports/:type/generate', authNgo, async (req, res) => {
  try {
    const type = req.params.type;
    const meta = REPORT_META[type];
    if (!meta) return res.status(400).json({ success: false, error: 'Invalid report type' });

    const { id, organization, country } = req.ngoAdmin;
    const programs = await NgoProgram.find({ organizationId: id }).lean();
    const beneficiaries = await NgoBeneficiary.find({ organizationId: id }).lean();
    const cooperatives = await CooperativePlatformRegistration.find({ country })
      .select('cooperativeName nomCooperative region zone email phone memberCount members')
      .lean();

    const insights = computeInsights(programs, beneficiaries, cooperatives);
    let pdfBuffer;

    if (type === 'beneficiary') {
      pdfBuffer = await meta.build({ org: organization, country, beneficiaries, programs });
    } else if (type === 'program') {
      pdfBuffer = await meta.build({ org: organization, country, programs });
    } else if (type === 'cooperative') {
      pdfBuffer = await meta.build({ org: organization, country, cooperatives });
    } else if (type === 'impact') {
      if (!programs.length) {
        return res.status(400).json({
          success: false,
          error: 'Add at least one program before generating the impact report.',
        });
      }
      pdfBuffer = await meta.build({ org: organization, country, insights });
    }

    const fileName = `${type}-report-${Date.now()}.pdf`;
    const isFr = req.query.lang === 'fr';
    const title = isFr ? meta.titleFr : meta.title;

    const report = await NgoReport.create({
      organizationId: id,
      organizationName: organization,
      country,
      reportType: type,
      title,
      titleFr: meta.titleFr,
      fileName,
      fileSize: pdfBuffer.length,
      pdfBase64: pdfBuffer.toString('base64'),
      dataSnapshot: { insights, programCount: programs.length, beneficiaryCount: beneficiaries.length },
      generatedBy: req.ngoAdmin.email,
    });

    res.json({
      success: true,
      report: {
        id: report._id.toString(),
        reportType: type,
        title,
        fileName,
        fileSize: pdfBuffer.length,
        generatedAt: report.generatedAt,
        downloadUrl: `/api/ngo/reports/${report._id}/download`,
      },
    });
  } catch (e) {
    console.error('NGO report generation error:', e);
    res.status(500).json({ success: false, error: e.message || 'Report generation failed' });
  }
});

router.get('/reports/:id/download', authNgo, async (req, res) => {
  try {
    const report = await NgoReport.findOne({
      _id: req.params.id,
      organizationId: req.ngoAdmin.id,
    }).select('+pdfBase64');

    if (!report?.pdfBase64) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const buf = Buffer.from(report.pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName || 'report.pdf'}"`);
    res.send(buf);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /api/ngo/profile
router.put('/profile', authNgo, async (req, res) => {
  try {
    const admin = await GovernmentAdmin.findById(req.ngoAdmin.id);
    if (!admin) return res.status(404).json({ success: false, error: 'Not found' });

    const { name, organization, mission, focusArea, regions, phone } = req.body;
    if (name) admin.name = name;
    if (organization) admin.organization = organization;
    await admin.save();

    res.json({
      success: true,
      profile: {
        name: admin.name,
        email: admin.email,
        organization: admin.organization,
        country: admin.country,
        orgType: admin.orgType,
        mission,
        focusArea,
        regions,
        phone,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
