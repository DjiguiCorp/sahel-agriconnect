import express from 'express';
import crypto from 'crypto';
import CooperativeInvitation from '../models/CooperativeInvitation.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Farmer from '../models/Farmer.js';
import PendingNotification from '../models/PendingNotification.js';

const router = express.Router();

// POST /api/coop-invitations — cooperative creates invitation
router.post('/', async (req, res) => {
  try {
    const { cooperativeId, inviteePhone, inviteeEmail, inviteeName, inviteeRegion, message } = req.body;
    if (!cooperativeId || (!inviteePhone && !inviteeEmail)) {
      return res.status(400).json({ error: 'cooperativeId and at least phone or email required' });
    }
    const coop = await CooperativePlatformRegistration.findById(cooperativeId);
    if (!coop) return res.status(404).json({ error: 'Cooperative not found' });
    if (coop.status !== 'active') return res.status(403).json({ error: 'Cooperative not active' });

    const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const invitation = await CooperativeInvitation.create({
      cooperativeId,
      cooperativeName: coop.cooperativeName || coop.nomCooperative,
      cooperativeEmail: coop.email,
      cooperativeCountry: coop.country,
      cooperativeLeader: coop.leaderName || coop.nomResponsable,
      inviteePhone,
      inviteeEmail,
      inviteeName,
      inviteeRegion,
      message: message || null,
      inviteCode,
      expiresAt,
    });

    // Queue WhatsApp notification
    const inviteMsg = `🤝 INVITATION COOPÉRATIVE\n${coop.cooperativeName || coop.nomCooperative} vous invite à rejoindre leur coopérative sur Sahel AgriConnect.\n\n${message || ''}\n\nCode d'invitation: ${inviteCode}\nAcceptez sur: sahelagriconnect.com/join-cooperative/${inviteCode}`;
    await PendingNotification.create({
      recipientName: inviteeName || 'Agriculteur',
      recipientPhone: inviteePhone,
      recipientEmail: inviteeEmail,
      message: inviteMsg,
      source: 'cooperative_invitation',
      status: 'pending',
    });

    res.status(201).json({ success: true, invitation: { _id: invitation._id, inviteCode, expiresAt } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/coop-invitations/cooperative/:id — cooperative's sent invitations
router.get('/cooperative/:id', async (req, res) => {
  try {
    const invitations = await CooperativeInvitation.find({ cooperativeId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, invitations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coop-invitations/accept/:code — get invitation details by code
router.get('/accept/:code', async (req, res) => {
  try {
    const invitation = await CooperativeInvitation.findOne({ inviteCode: req.params.code });
    if (!invitation) return res.status(404).json({ error: 'Invalid invitation code' });
    if (invitation.expiresAt < new Date()) return res.status(410).json({ error: 'Invitation expired' });
    if (invitation.status !== 'sent' && invitation.status !== 'viewed') {
      return res.status(409).json({ error: `Invitation already ${invitation.status}` });
    }
    invitation.status = 'viewed';
    await invitation.save();
    res.json({
      success: true,
      invitation: {
        cooperativeName: invitation.cooperativeName,
        cooperativeCountry: invitation.cooperativeCountry,
        cooperativeLeader: invitation.cooperativeLeader,
        inviteeName: invitation.inviteeName,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        inviteCode: invitation.inviteCode,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coop-invitations/accept/:code — accept invitation
router.post('/accept/:code', async (req, res) => {
  try {
    const { farmerName, farmerPhone, farmerEmail, farmerId } = req.body;
    const invitation = await CooperativeInvitation.findOne({ inviteCode: req.params.code });
    if (!invitation) return res.status(404).json({ error: 'Invalid code' });
    if (invitation.expiresAt < new Date()) return res.status(410).json({ error: 'Invitation expired' });

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    if (farmerId) invitation.linkedFarmerId = farmerId;
    await invitation.save();

    if (farmerId) {
      await Farmer.findByIdAndUpdate(farmerId, {
        lienCooperative: 'oui',
        nomCooperative: invitation.cooperativeName,
        cooperativeId: invitation.cooperativeId,
      });
    }

    await CooperativePlatformRegistration.findByIdAndUpdate(invitation.cooperativeId, {
      $inc: { memberCount: 1 },
      $push: { invitedMembers: { name: farmerName, phone: farmerPhone, email: farmerEmail, joinedAt: new Date() } },
    });

    await PendingNotification.create({
      recipientName: invitation.cooperativeLeader,
      recipientEmail: invitation.cooperativeEmail,
      message: `✅ ${farmerName || invitation.inviteeName || 'Un agriculteur'} a accepté votre invitation à rejoindre ${invitation.cooperativeName} sur Sahel AgriConnect.`,
      source: 'invitation_accepted',
      status: 'pending',
    });

    res.json({ success: true, message: 'Invitation accepted', cooperativeName: invitation.cooperativeName });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/coop-invitations/decline/:code
router.post('/decline/:code', async (req, res) => {
  try {
    const invitation = await CooperativeInvitation.findOneAndUpdate(
      { inviteCode: req.params.code },
      { status: 'declined', respondedAt: new Date() },
      { new: true }
    );
    if (!invitation) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

