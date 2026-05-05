import express from 'express';
import Opportunity from '../models/Opportunity.js';
import MeetingRequest from '../models/MeetingRequest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res) => {
  try {
    const q = { status: 'active' };
    if (req.query.commodity) q.commodity = req.query.commodity;
    if (req.query.track) q.track = req.query.track;
    if (req.query.country) {
      q.country = new RegExp(`^${escapeRegex(req.query.country.trim())}$`, 'i');
    }
    const opportunities = await Opportunity.find(q)
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    res.json({ success: true, opportunities });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  try {
    const opportunities = await Opportunity.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, opportunities });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/meeting-requests', authenticateToken, async (req, res) => {
  try {
    const meetingRequests = await MeetingRequest.find()
      .populate('opportunityId', 'centerName location country')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, meetingRequests });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid opportunity id' });
    }
    const opportunity = await Opportunity.findById(req.params.id).lean();
    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    res.json({ success: true, opportunity });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/meeting-requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const meetingRequest = await MeetingRequest.findByIdAndUpdate(
      req.params.requestId,
      { status },
      { new: true, runValidators: true }
    );
    if (!meetingRequest) {
      return res.status(404).json({ success: false, error: 'Meeting request not found' });
    }
    res.json({ success: true, meetingRequest });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const opportunity = await Opportunity.create(req.body);
    res.status(201).json({ success: true, opportunity });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/meeting-request', async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    const { investorName, investorEmail, preferredDate, message, centerName } = req.body;
    await MeetingRequest.create({
      investorName,
      investorEmail,
      opportunityId: opportunity._id,
      centerName: centerName || opportunity.centerName,
      preferredDate: preferredDate || '',
      message: message || '',
      status: 'pending',
    });
    res.status(201).json({
      success: true,
      message: 'Meeting request received',
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!opportunity) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, opportunity });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Opportunity.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Not found' });
    await MeetingRequest.deleteMany({ opportunityId: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
