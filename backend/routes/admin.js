import express from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { Resend } from 'resend';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Investor from '../models/Investor.js';
import InvestorKYC from '../models/InvestorKYC.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/admin/investors/didit-kyc
 * Lists investor KYC rows with Didit verification + trading gate.
 */
router.get('/investors/didit-kyc', authenticateToken, async (req, res) => {
  try {
    const kycs = await InvestorKYC.find({
      $or: [
        { diditSessionId: { $exists: true, $ne: null } },
        { diditVerifiedAt: { $exists: true, $ne: null } },
        { diditStatus: { $in: ['pending', 'approved', 'declined', 'expired'] } },
      ],
    })
      .sort({ updatedAt: -1 })
      .select(
        'investorEmail investorName countryOfResidence countryCategory status ' +
          'diditStatus diditSessionId diditVerifiedAt tradingApproved paymentVerified submittedAt'
      )
      .lean();

    // Attach Investor Mongo ids when available (for approve-trading :id)
    const emails = kycs.map((k) => k.investorEmail);
    const investors = await Investor.find({ email: { $in: emails } })
      .select('_id email fullName')
      .lean();
    const byEmail = Object.fromEntries(
      investors.map((i) => [String(i.email).toLowerCase(), i])
    );

    const rows = kycs.map((k) => {
      const inv = byEmail[String(k.investorEmail).toLowerCase()];
      return {
        ...k,
        investorId: inv?._id?.toString() || null,
        investorName: k.investorName || inv?.fullName || '',
      };
    });

    return res.json({ success: true, kycs: rows });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/admin/investors/:id/approve-trading
 * Body: { tradingApproved: boolean }
 * :id = Investor Mongo _id OR investor email
 */
router.post('/investors/:id/approve-trading', authenticateToken, async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const tradingApproved = Boolean(req.body?.tradingApproved);

    let investor = null;
    if (mongoose.Types.ObjectId.isValid(rawId) && !rawId.includes('@')) {
      investor = await Investor.findById(rawId);
    }
    if (!investor) {
      investor = await Investor.findOne({ email: rawId.toLowerCase() });
    }
    if (!investor) {
      // Fall back: treat :id as KYC email directly
      const email = rawId.toLowerCase();
      const kyc = await InvestorKYC.findOneAndUpdate(
        { investorEmail: email },
        { $set: { tradingApproved } },
        { new: true }
      );
      if (!kyc) {
        return res.status(404).json({ success: false, error: 'Investor / KYC not found' });
      }
      return res.json({
        success: true,
        tradingApproved: kyc.tradingApproved,
        investorEmail: kyc.investorEmail,
      });
    }

    const kyc = await InvestorKYC.findOneAndUpdate(
      { investorEmail: String(investor.email).toLowerCase() },
      {
        $set: {
          tradingApproved,
          investorEmail: String(investor.email).toLowerCase(),
          investorName: investor.fullName,
        },
        $setOnInsert: {
          countryOfResidence: investor.countryOfResidence || 'United States',
          countryCategory: 'diaspora',
          status: 'approved',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      tradingApproved: kyc.tradingApproved,
      investorId: investor._id.toString(),
      investorEmail: kyc.investorEmail,
      diditStatus: kyc.diditStatus,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/admin/cooperatives/:id/activate
// Manual activation when payment was received offline (bank transfer, etc.)
router.post('/cooperatives/:id/activate', authenticateToken, async (req, res) => {
  try {
    const { paymentMethod = 'manual', adminNote = '' } = req.body || {};
    const coop = await CooperativePlatformRegistration.findById(req.params.id);
    if (!coop) return res.status(404).json({ success: false, error: 'Cooperative not found' });

    const tempPw = randomBytes(5).toString('hex') + '!A1';
    const tempHash = await bcrypt.hash(tempPw, 12);

    coop.status = 'active';
    coop.paymentReceived = true;
    coop.paymentDate = new Date();
    coop.paymentMethod = paymentMethod;
    coop.activatedAt = new Date();
    coop.tempPassword = tempHash;
    if (adminNote) coop.adminNote = adminNote;
    await coop.save();

    if (coop.email) {
      const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
      const base = (process.env.FRONTEND_URL || 'https://sahelagriconnect.com').replace(/\/$/, '');
      if (resend) {
        try {
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
            <p>Bonjour <strong>${coop.leaderName || ''}</strong>,</p>
            <p>Le portail de votre coopérative <strong>${coop.cooperativeName || ''}</strong> est maintenant actif.</p>
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
        } catch (mailErr) {
          console.error('[admin activate] email failed:', mailErr.message);
        }
      }
    }

    return res.json({ success: true, cooperative: coop });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
