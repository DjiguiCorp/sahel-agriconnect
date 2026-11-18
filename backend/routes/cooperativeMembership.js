import express from 'express';
import mongoose from 'mongoose';
import CooperativeJoinRequest from '../models/CooperativeJoinRequest.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Farmer from '../models/Farmer.js';
import { authFarmer } from '../middleware/auth.js';
import { authCoop } from './cooperatives.js';
import {
  sendJoinRequestToLeaderEmail,
  sendJoinRequestOutcomeEmail,
  maybeUpgradeCoopAt51,
  syncPendingFullVerification,
} from '../services/coopMemberUpgrade.js';

const router = express.Router();

function mapApplication(doc, coop) {
  const status = doc.status === 'declined' ? 'rejected' : doc.status;
  return {
    _id: doc._id,
    applicationId: doc._id,
    farmerId: doc.farmerId,
    cooperativeId: doc.cooperativeId,
    cooperativeName: coop?.cooperativeName || doc.cooperativeName || '',
    status,
    message: doc.message || '',
    reason: doc.reason || '',
    createdAt: doc.createdAt || doc.requestedAt,
    requestedAt: doc.requestedAt || doc.createdAt,
    reviewedAt: doc.reviewedAt || null,
  };
}

/**
 * POST /api/cooperative-membership/applications
 * Auth: farmer JWT
 * Body: { cooperativeId, message? }
 */
router.post('/applications', authFarmer, async (req, res) => {
  try {
    const cooperativeId = String(req.body?.cooperativeId || '').trim();
    const message = String(req.body?.message || '').trim();
    const farmerId = String(req.farmerId || '').trim();

    if (!cooperativeId || !mongoose.Types.ObjectId.isValid(cooperativeId)) {
      return res.status(400).json({
        success: false,
        error: 'cooperativeId is required',
      });
    }

    const [coop, farmer] = await Promise.all([
      CooperativePlatformRegistration.findById(cooperativeId),
      Farmer.findById(farmerId),
    ]);

    if (!coop) {
      return res.status(404).json({ success: false, error: 'Cooperative not found' });
    }
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }

    if (
      farmer.cooperativeId &&
      String(farmer.cooperativeId) === String(cooperativeId)
    ) {
      return res.status(409).json({
        success: false,
        error: 'Already a member of this cooperative',
      });
    }

    const existing = await CooperativeJoinRequest.findOne({
      cooperativeId,
      farmerId,
      status: { $in: ['pending', 'approved'] },
    }).sort({ requestedAt: -1 });

    if (existing) {
      if (existing.status === 'approved') {
        return res.status(409).json({
          success: false,
          error: 'Already a member of this cooperative',
        });
      }
      return res.json({
        success: true,
        message: 'Application already pending',
        applicationId: existing._id,
        alreadyPending: true,
        status: 'pending',
      });
    }

    const now = new Date();
    const joinReq = await CooperativeJoinRequest.create({
      cooperativeId,
      farmerId,
      farmerName: farmer.nom,
      farmerRegion: farmer.region || '',
      farmerCropTypes: farmer.cultures || [],
      message,
      status: 'pending',
      requestedAt: now,
      createdAt: now,
    });

    await sendJoinRequestToLeaderEmail({
      leaderEmail: coop.email,
      leaderName: coop.leaderName,
      cooperativeName: coop.cooperativeName,
      farmerName: farmer.nom,
      farmerRegion: farmer.region,
      farmerCrops: farmer.cultures,
      message,
    }).catch((err) =>
      console.error('[membership] leader email failed:', err.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Application submitted',
      applicationId: joinReq._id,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/cooperative-membership/applications/my
 * Auth: farmer JWT
 */
router.get('/applications/my', authFarmer, async (req, res) => {
  try {
    const farmerId = String(req.farmerId || '').trim();
    const requests = await CooperativeJoinRequest.find({ farmerId })
      .sort({ requestedAt: -1, createdAt: -1 })
      .lean();

    const coopIds = [
      ...new Set(requests.map((r) => String(r.cooperativeId)).filter(Boolean)),
    ];
    const coops = await CooperativePlatformRegistration.find({
      _id: { $in: coopIds },
    })
      .select('cooperativeName regionCity country')
      .lean();
    const byId = Object.fromEntries(coops.map((c) => [String(c._id), c]));

    const applications = requests.map((r) =>
      mapApplication(r, byId[String(r.cooperativeId)])
    );

    return res.json({ success: true, applications });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/cooperative-membership/applications/cooperative/:cooperativeId
 * Auth: cooperative leader JWT
 */
router.get(
  '/applications/cooperative/:cooperativeId',
  authCoop,
  async (req, res) => {
    try {
      const cooperativeId = String(req.params.cooperativeId || '').trim();
      if (String(req.coop._id) !== cooperativeId) {
        return res.status(403).json({
          success: false,
          error: 'Not your cooperative',
        });
      }

      const status = String(req.query.status || 'pending').toLowerCase();
      const filter = { cooperativeId: req.coop._id };
      if (status !== 'all') {
        if (status === 'rejected') {
          filter.status = { $in: ['rejected', 'declined'] };
        } else {
          filter.status = status;
        }
      }

      const requests = await CooperativeJoinRequest.find(filter)
        .sort({ requestedAt: -1 })
        .lean();

      return res.json({
        success: true,
        applications: requests.map((r) => mapApplication(r, req.coop)),
        requests: requests.map((r) => mapApplication(r, req.coop)),
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
);

/**
 * PATCH /api/cooperative-membership/applications/:id/approve
 * Auth: cooperative leader JWT
 */
router.patch('/applications/:id/approve', authCoop, async (req, res) => {
  try {
    const joinReq = await CooperativeJoinRequest.findById(req.params.id);
    if (!joinReq) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    if (String(joinReq.cooperativeId) !== String(req.coop._id)) {
      return res.status(403).json({ success: false, error: 'Not your cooperative' });
    }
    if (joinReq.status !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `Request already ${joinReq.status}`,
      });
    }

    const farmer = await Farmer.findById(joinReq.farmerId);
    const now = new Date();
    joinReq.status = 'approved';
    joinReq.reviewedAt = now;
    joinReq.reviewedBy = req.coop.email || req.coop.leaderName || 'cooperative_leader';
    await joinReq.save();

    if (farmer) {
      farmer.cooperativeId = req.coop._id;
      farmer.lienCooperative = 'Oui';
      farmer.nomCooperative = req.coop.cooperativeName;
      await farmer.save();
    }

    await CooperativePlatformRegistration.findByIdAndUpdate(req.coop._id, {
      $inc: { memberCount: 1 },
    });
    await maybeUpgradeCoopAt51(req.coop._id);
    await syncPendingFullVerification(req.coop._id);

    await sendJoinRequestOutcomeEmail({
      farmerEmail: farmer?.email,
      farmerName: farmer?.nom || joinReq.farmerName,
      cooperativeName: req.coop.cooperativeName,
      approved: true,
    }).catch((err) =>
      console.error('[membership] approve email failed:', err.message)
    );

    return res.json({
      success: true,
      status: 'approved',
      applicationId: joinReq._id,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * PATCH /api/cooperative-membership/applications/:id/reject
 * Auth: cooperative leader JWT
 * Body: { reason? }
 */
router.patch('/applications/:id/reject', authCoop, async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    const joinReq = await CooperativeJoinRequest.findById(req.params.id);
    if (!joinReq) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    if (String(joinReq.cooperativeId) !== String(req.coop._id)) {
      return res.status(403).json({ success: false, error: 'Not your cooperative' });
    }
    if (joinReq.status !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `Request already ${joinReq.status}`,
      });
    }

    const farmer = await Farmer.findById(joinReq.farmerId);
    const now = new Date();
    joinReq.status = 'rejected';
    joinReq.reason = reason;
    joinReq.reviewedAt = now;
    joinReq.reviewedBy = req.coop.email || req.coop.leaderName || 'cooperative_leader';
    await joinReq.save();

    await sendJoinRequestOutcomeEmail({
      farmerEmail: farmer?.email,
      farmerName: farmer?.nom || joinReq.farmerName,
      cooperativeName: req.coop.cooperativeName,
      approved: false,
    }).catch((err) =>
      console.error('[membership] reject email failed:', err.message)
    );

    return res.json({
      success: true,
      status: 'rejected',
      applicationId: joinReq._id,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
