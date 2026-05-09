import express from 'express';
import Investor from '../models/Investor.js';
import InvestorNotification from '../models/InvestorNotification.js';
import PendingNotification from '../models/PendingNotification.js';
import { authenticateInvestor, authenticateToken } from '../middleware/auth.js';
import { confirmInvestorRegistration, notifyAdminNewInvestor } from '../services/emailService.js';
import { queueNotification, messageTemplates } from '../services/notificationService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

function mapInvestmentTrack(input) {
  const s = String(input || '');
  if (s.includes('Both')) return 'Both';
  if (s.includes('Track B')) return 'Track B';
  return 'Track A';
}

function mapCommodityInterest(body) {
  const ci = body.commodityInterest;
  if (Array.isArray(ci)) {
    if (ci.includes('Both')) return 'Both';
    if (ci.includes('Shea Butter') && ci.includes('Sesame')) return 'Both';
    if (ci.includes('Sesame')) return 'Sesame';
    if (ci.includes('Shea Butter')) return 'Shea Butter';
  }
  return 'Shea Butter';
}

router.post('/login', async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    const email = String(emailRaw || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, error: 'email required' });

    const investor = await Investor.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
    if (!investor) {
      return res.status(404).json({ success: false, error: 'Investor not found' });
    }

    const token = jwt.sign(
      { role: 'investor', email: investor.email, name: investor.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      investor: { email: investor.email, fullName: investor.fullName, status: investor.status },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      countryOfResidence,
      investmentTrack,
      investmentRange,
      message,
    } = req.body;
    const heardFrom = req.body.heardFrom ?? req.body.heardAbout ?? '';

    const investor = await Investor.create({
      fullName,
      email,
      phone,
      countryOfResidence,
      investmentTrack: mapInvestmentTrack(investmentTrack),
      commodityInterest: mapCommodityInterest(req.body),
      investmentRange,
      heardFrom,
      message: message || '',
    });

    notifyAdminNewInvestor(investor).catch(console.error);
    confirmInvestorRegistration(investor).catch(console.error);
    queueNotification({
      name: investor.fullName,
      phone: investor.phone,
      email: investor.email,
      message: messageTemplates.investorWelcome(investor.fullName),
      source: 'investor_registration',
    }).catch(console.error);

    InvestorNotification.create({
      investorEmail: investor.email,
      type: 'welcome',
      title: 'Welcome to AfriYield Exchange',
      message:
        'Your investor account is active. Browse opportunities and build your African agricultural portfolio.',
      link: '/afri-yield/portal',
    }).catch(console.error);

    res.status(201).json({ success: true, message: 'Registration received' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'This email is already registered.',
      });
    }
    console.error(err);
    res.status(400).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// POST /api/investors/investment-intent — public
router.post('/investment-intent', async (req, res) => {
  try {
    const { name, email, amount, opportunityId, message } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanOpp = String(opportunityId || '').trim();
    const amt = Number(amount);

    if (!cleanName || !cleanEmail || !Number.isFinite(amt) || amt <= 0 || !cleanOpp) {
      return res.status(400).json({ success: false, error: 'name, email, amount, opportunityId required' });
    }

    await PendingNotification.create({
      recipientName: 'Admin',
      recipientPhone: null,
      recipientEmail: process.env.ADMIN_EMAIL,
      message: `💰 INVESTMENT INTENT: ${cleanName} (${cleanEmail}) wants to invest $${amt}. Opportunity: ${cleanOpp}. Message: ${
        String(message || '').trim() || 'None'
      }`,
      source: 'investment_intent',
      status: 'pending',
      channel: 'email',
    });

    notifyAdminNewInvestor({
      fullName: cleanName,
      email: cleanEmail,
      investmentRange: `$${amt}`,
      investmentTrack: 'Confirmed Intent',
      commodityInterest: 'TBD',
      countryOfResidence: 'TBD',
      phone: '',
      message: String(message || ''),
      heardFrom: 'investment_confirmation',
    }).catch(console.error);

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

router.get('/status-summary', authenticateToken, async (req, res) => {
  try {
    const rows = await Investor.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = {
      New: 0,
      'Call Scheduled': 0,
      'Call Completed': 0,
      'Opportunity Sent': 0,
      'Investment Active': 0,
      'Paid Out': 0,
    };
    for (const r of rows) {
      const k = r?._id;
      if (k in counts) counts[k] = Number(r.count) || 0;
      // Backfill legacy statuses into the first stage
      if (k === 'new') counts.New += Number(r.count) || 0;
    }
    return res.json({ success: true, counts });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

router.get('/', authenticateInvestor, async (req, res, next) => {
  const q = req.query.email;
  if (q != null && String(q).trim() !== '') {
    try {
      const email = String(q).trim().toLowerCase();
      if (String(req.investorEmail || '').trim().toLowerCase() !== email) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      const investor = await Investor.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
      if (!investor) {
        return res.json({ success: true, investors: [], investor: null });
      }
      return res.json({ success: true, investors: [investor], investor });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
  next();
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const investors = await Investor.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, investors });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const inv = await Investor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!inv) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, investor: inv });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
