import express from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { Resend } from 'resend';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import MobileMoneyPayment from '../models/MobileMoneyPayment.js';
import PremiumSubscription from '../models/PremiumSubscription.js';
import Investment from '../models/Investment.js';
import Investor from '../models/Investor.js';
import InvestorKYC from '../models/InvestorKYC.js';
import KYCAuditLog from '../models/KYCAuditLog.js';
import InvestorNotification from '../models/InvestorNotification.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  extractDiditFields,
  extractDocumentType,
  isAcceptableDocumentType,
  maskDocumentNumber,
} from '../utils/diditPayload.js';
import {
  investorNotificationCopy,
  resolveInvestorLang,
} from '../utils/investorNotificationCopy.js';
import {
  sendKYCApproved,
  sendKYCRejected,
} from '../services/kycEmailService.js';
import { applyCooperativeCertification } from '../services/certificationService.js';
import {
  getVerifiedMemberCount,
  sendCoopFlaggedEmail,
} from '../services/coopMemberUpgrade.js';
import {
  revokeTradingAccess,
  restoreTradingAccess,
} from '../services/investorApprovalService.js';

const router = express.Router();

function investorTypeFromCategory(cat) {
  if (cat === 'african') return 'African';
  if (cat === 'diaspora') return 'Diaspora';
  return 'Institutional';
}

async function resolveInvestorByParam(rawId) {
  const id = String(rawId || '').trim();
  let investor = null;
  if (mongoose.Types.ObjectId.isValid(id) && !id.includes('@')) {
    investor = await Investor.findById(id);
  }
  if (!investor) {
    investor = await Investor.findOne({ email: id.toLowerCase() });
  }
  return investor;
}

async function resolveKycByParam(rawId) {
  const investor = await resolveInvestorByParam(rawId);
  if (investor) {
    const kyc = await InvestorKYC.findOne({
      investorEmail: String(investor.email).toLowerCase(),
    });
    return { investor, kyc };
  }
  const email = String(rawId || '').toLowerCase().trim();
  const kyc = await InvestorKYC.findOne({ investorEmail: email });
  return { investor: null, kyc };
}

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
          'diditStatus diditSessionId diditVerifiedAt tradingApproved tradingApprovedAt ' +
          'paymentVerified submittedAt createdAt updatedAt diditRawPayload ' +
          'kycReviewNotes kycRejectionReason kycReviewedAt'
      )
      .lean();

    const emails = kycs.map((k) => k.investorEmail);
    const investors = await Investor.find({ email: { $in: emails } })
      .select('_id email fullName preferredLanguage countryOfResidence countryCategory')
      .lean();
    const byEmail = Object.fromEntries(
      investors.map((i) => [String(i.email).toLowerCase(), i])
    );

    const rows = kycs.map((k) => {
      const inv = byEmail[String(k.investorEmail).toLowerCase()];
      const documentType = extractDocumentType(k.diditRawPayload);
      const { diditRawPayload, ...rest } = k;
      return {
        ...rest,
        investorId: inv?._id?.toString() || null,
        investorName: k.investorName || inv?.fullName || '',
        preferredLanguage: inv?.preferredLanguage || 'fr',
        investorType: investorTypeFromCategory(
          k.countryCategory || inv?.countryCategory
        ),
        documentType: documentType || null,
        documentTypeAcceptable: documentType
          ? isAcceptableDocumentType(documentType)
          : null,
        submissionDate:
          k.diditVerifiedAt || k.submittedAt || k.updatedAt || k.createdAt || null,
      };
    });

    return res.json({ success: true, kycs: rows });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/admin/investors/kyc-audit-log
 * Last 20 KYC review actions.
 */
router.get('/investors/kyc-audit-log', authenticateToken, async (req, res) => {
  try {
    const logs = await KYCAuditLog.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();
    return res.json({ success: true, logs });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/admin/investors/:id/kyc-detail
 */
router.get('/investors/:id/kyc-detail', authenticateToken, async (req, res) => {
  try {
    const { investor, kyc } = await resolveKycByParam(req.params.id);
    if (!kyc && !investor) {
      return res.status(404).json({ success: false, error: 'Investor / KYC not found' });
    }

    const email = String(
      investor?.email || kyc?.investorEmail || ''
    ).toLowerCase();
    const extracted = extractDiditFields(kyc?.diditRawPayload);
    const documentType = extracted.documentType || extractDocumentType(kyc?.diditRawPayload);

    return res.json({
      success: true,
      profile: {
        investorId: investor?._id?.toString() || null,
        name: investor?.fullName || kyc?.investorName || '',
        email,
        country: investor?.countryOfResidence || kyc?.countryOfResidence || '',
        investorType: investorTypeFromCategory(
          kyc?.countryCategory || investor?.countryCategory
        ),
        countryCategory: kyc?.countryCategory || investor?.countryCategory || null,
        preferredLanguage: investor?.preferredLanguage || 'fr',
      },
      kyc: kyc
        ? {
            diditStatus: kyc.diditStatus,
            diditVerifiedAt: kyc.diditVerifiedAt,
            diditSessionId: kyc.diditSessionId,
            tradingApproved: kyc.tradingApproved,
            tradingApprovedAt: kyc.tradingApprovedAt,
            tradingApprovedBy: kyc.tradingApprovedBy,
            kycReviewNotes: kyc.kycReviewNotes,
            kycRejectionReason: kyc.kycRejectionReason,
            kycReviewedAt: kyc.kycReviewedAt,
            countryOfResidence: kyc.countryOfResidence,
            countryCategory: kyc.countryCategory,
            status: kyc.status,
            paymentVerified: kyc.paymentVerified,
            submittedAt: kyc.submittedAt,
            createdAt: kyc.createdAt,
            updatedAt: kyc.updatedAt,
          }
        : null,
      diditRawPayload: kyc?.diditRawPayload || null,
      extracted: {
        ...extracted,
        documentNumberMasked: maskDocumentNumber(extracted.documentNumber),
        documentTypeAcceptable: documentType
          ? isAcceptableDocumentType(documentType)
          : null,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/admin/investors/:id/kyc-review
 * Body: { action: 'approve' | 'reject', notes?: string, rejectionReason?: string }
 */
router.post('/investors/:id/kyc-review', authenticateToken, async (req, res) => {
  try {
    const action = String(req.body?.action || '').toLowerCase();
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "action must be 'approve' or 'reject'",
      });
    }

    const notes = String(req.body?.notes || '').trim();
    const rejectionReason = String(req.body?.rejectionReason || '').trim();
    const adminEmail = String(req.admin?.email || 'admin').toLowerCase();

    const { investor, kyc } = await resolveKycByParam(req.params.id);
    if (!kyc) {
      return res.status(404).json({ success: false, error: 'KYC record not found' });
    }

    const now = new Date();
    const documentType = extractDocumentType(kyc.diditRawPayload);
    const diditStatusAtReview = kyc.diditStatus;

    if (action === 'approve') {
      kyc.tradingApproved = true;
      kyc.tradingApprovedAt = now;
      kyc.tradingApprovedBy = adminEmail;
      kyc.diditStatus = 'approved';
      if (!kyc.diditVerifiedAt) kyc.diditVerifiedAt = now;
      kyc.kycRejectionReason = '';
      kyc.status = 'approved';
    } else {
      kyc.tradingApproved = false;
      kyc.diditStatus = 'declined';
      kyc.kycRejectionReason = rejectionReason || notes || 'Rejected by compliance';
      kyc.status = 'rejected';
    }

    kyc.kycReviewNotes = notes;
    kyc.kycReviewedAt = now;
    kyc.reviewedAt = now;
    kyc.reviewedBy = adminEmail;
    await kyc.save();

    if (investor) {
      await Investor.findByIdAndUpdate(investor._id, {
        kycStatus: action === 'approve' ? 'approved' : 'rejected',
        kycReviewedAt: now,
        ...(action === 'approve'
          ? {
              tradingApproved: true,
              tradingApprovedAt: now,
              tradingApprovedBy: adminEmail,
              tradingRevoked: false,
            }
          : {
              tradingApproved: false,
            }),
      });
    }

    const auditAction = action === 'approve' ? 'approved' : 'rejected';
    await KYCAuditLog.create({
      investorId: investor?._id || undefined,
      investorEmail: kyc.investorEmail,
      investorName: kyc.investorName || investor?.fullName || '',
      adminEmail,
      action: auditAction,
      notes: action === 'reject'
        ? [rejectionReason, notes].filter(Boolean).join(' — ')
        : notes,
      timestamp: now,
      diditStatusAtReview,
      documentType: documentType || '',
    });

    const lang = resolveInvestorLang({
      preferredLanguage: investor?.preferredLanguage,
      countryOfResidence: investor?.countryOfResidence || kyc.countryOfResidence,
    });
    const notifType = action === 'approve' ? 'kyc_approved' : 'kyc_rejected';
    const copy = investorNotificationCopy(notifType, lang, {
      args: action === 'reject' ? [kyc.kycRejectionReason] : [],
    });

    InvestorNotification.create({
      investorEmail: kyc.investorEmail,
      type: notifType,
      title: copy.title,
      message: copy.message,
      lang,
      link: '/afri-yield/portal',
    }).catch(console.error);

    try {
      if (action === 'approve') {
        await sendKYCApproved({
          email: kyc.investorEmail,
          name: kyc.investorName || investor?.fullName || '',
          category: kyc.countryCategory,
          lang,
        });
      } else {
        await sendKYCRejected({
          email: kyc.investorEmail,
          name: kyc.investorName || investor?.fullName || '',
          reason: kyc.kycRejectionReason,
          lang,
        });
      }
    } catch (mailErr) {
      console.error('[admin kyc-review] email failed:', mailErr.message);
    }

    return res.json({
      success: true,
      action: auditAction,
      tradingApproved: kyc.tradingApproved,
      diditStatus: kyc.diditStatus,
      kycRejectionReason: kyc.kycRejectionReason,
      kycReviewNotes: kyc.kycReviewNotes,
      kycReviewedAt: kyc.kycReviewedAt,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/admin/investors/:id/approve-trading
 * Body: { tradingApproved: boolean }
 * Legacy toggle — kept for compatibility.
 */
router.post('/investors/:id/approve-trading', authenticateToken, async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const tradingApproved = Boolean(req.body?.tradingApproved);
    const adminEmail = String(req.admin?.email || 'admin').toLowerCase();

    let investor = null;
    if (mongoose.Types.ObjectId.isValid(rawId) && !rawId.includes('@')) {
      investor = await Investor.findById(rawId);
    }
    if (!investor) {
      investor = await Investor.findOne({ email: rawId.toLowerCase() });
    }
    if (!investor) {
      const email = rawId.toLowerCase();
      const kyc = await InvestorKYC.findOneAndUpdate(
        { investorEmail: email },
        {
          $set: {
            tradingApproved,
            ...(tradingApproved
              ? { tradingApprovedAt: new Date(), tradingApprovedBy: adminEmail }
              : {}),
          },
        },
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

    const now = new Date();
    investor.tradingApproved = tradingApproved;
    if (tradingApproved) {
      investor.tradingApprovedAt = now;
      investor.tradingApprovedBy = adminEmail;
      investor.tradingRevoked = false;
      investor.tradingRevokedAt = undefined;
      investor.tradingRevokedBy = undefined;
    } else {
      investor.tradingRevoked = true;
      investor.tradingRevokedAt = now;
      investor.tradingRevokedBy = adminEmail;
    }
    await investor.save();

    const kyc = await InvestorKYC.findOneAndUpdate(
      { investorEmail: String(investor.email).toLowerCase() },
      {
        $set: {
          tradingApproved,
          investorEmail: String(investor.email).toLowerCase(),
          investorName: investor.fullName,
          ...(tradingApproved
            ? { tradingApprovedAt: now, tradingApprovedBy: adminEmail }
            : {}),
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

/**
 * POST /api/admin/investors/:email/revoke-trading
 * Suspend trading access; blocks auto-approve until restore.
 */
router.post('/investors/:email/revoke-trading', authenticateToken, async (req, res) => {
  try {
    const email = decodeURIComponent(String(req.params.email || ''))
      .toLowerCase()
      .trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'email required' });
    }
    const adminEmail = String(req.admin?.email || 'admin').toLowerCase();
    const investor = await revokeTradingAccess(email, adminEmail);
    if (!investor) {
      return res.status(404).json({ success: false, error: 'Investor not found' });
    }
    return res.json({
      success: true,
      tradingApproved: false,
      tradingRevoked: true,
      investorEmail: investor.email,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/admin/investors/:email/restore-trading
 * Restore or manually approve trading access.
 */
router.post('/investors/:email/restore-trading', authenticateToken, async (req, res) => {
  try {
    const email = decodeURIComponent(String(req.params.email || ''))
      .toLowerCase()
      .trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'email required' });
    }
    const adminEmail = String(req.admin?.email || 'admin').toLowerCase();
    const investor = await restoreTradingAccess(email, adminEmail);
    if (!investor) {
      return res.status(404).json({ success: false, error: 'Investor not found' });
    }
    return res.json({
      success: true,
      tradingApproved: true,
      tradingRevoked: false,
      investorEmail: investor.email,
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

    try {
      await applyCooperativeCertification(coop._id);
    } catch (certErr) {
      console.error('[admin activate] certification check failed:', certErr.message);
    }

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

// GET /api/admin/cooperatives/growth — Growth coops with declared vs verified counts
router.get('/cooperatives/growth', authenticateToken, async (req, res) => {
  try {
    const coops = await CooperativePlatformRegistration.find({ tier: 'growth' })
      .sort({ paymentDate: -1, activatedAt: -1, createdAt: -1 })
      .lean();
    const enriched = await Promise.all(
      coops.map(async (c) => {
        const verifiedMemberCount = await getVerifiedMemberCount(c._id);
        return {
          ...c,
          declaredMemberCount: c.memberCount,
          verifiedMemberCount,
          verificationStatus: c.verificationStatus || 'unverified',
        };
      })
    );
    res.json({ success: true, cooperatives: enriched });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/admin/cooperatives/:id/verify — mark membership as verified
router.post('/cooperatives/:id/verify', authenticateToken, async (req, res) => {
  try {
    const coop = await CooperativePlatformRegistration.findById(req.params.id);
    if (!coop) return res.status(404).json({ success: false, error: 'Cooperative not found' });
    coop.verificationStatus = 'verified';
    coop.verifiedAt = new Date();
    coop.verifiedBy = req.user?.email || req.body?.adminEmail || 'admin';
    if (req.body?.notes) coop.verificationNotes = String(req.body.notes);
    await coop.save();
    res.json({ success: true, cooperative: coop });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/admin/cooperatives/:id/flag — flag for review + email leader
router.post('/cooperatives/:id/flag', authenticateToken, async (req, res) => {
  try {
    const coop = await CooperativePlatformRegistration.findById(req.params.id);
    if (!coop) return res.status(404).json({ success: false, error: 'Cooperative not found' });
    coop.verificationStatus = 'flagged';
    coop.verifiedBy = req.user?.email || req.body?.adminEmail || 'admin';
    if (req.body?.notes) coop.verificationNotes = String(req.body.notes);
    await coop.save();
    sendCoopFlaggedEmail(coop).catch(console.error);
    res.json({ success: true, cooperative: coop });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/admin/payments/ledger
 * Real payment ledger for admin overview + Paiements tab.
 * Revenue only from confirmed MobileMoney + Stripe webhook-backed records.
 * Excludes free_starter and manual admin activations without Stripe/mobile confirmation.
 */
router.get('/payments/ledger', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [mobileAll, stripeSubs, stripeCoops, coopCounts, facilitationFeeAgg] =
      await Promise.all([
      MobileMoneyPayment.find({}).sort({ createdAt: -1 }).limit(500).lean(),
      PremiumSubscription.find({
        $or: [
          { paymentMethod: 'stripe' },
          { stripePriceId: { $exists: true, $nin: [null, ''] } },
          { stripeSubscriptionId: { $exists: true, $nin: [null, ''] } },
          { paymentReference: { $regex: /^cs_/i } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
      CooperativePlatformRegistration.find({
        paymentReceived: true,
        paymentMethod: 'stripe',
      })
        .sort({ paymentDate: -1, activatedAt: -1 })
        .limit(200)
        .lean(),
      Promise.all([
        CooperativePlatformRegistration.countDocuments({
          status: 'active',
          paymentReceived: true,
        }),
        CooperativePlatformRegistration.countDocuments({ status: 'pending_payment' }),
      ]),
      // Confirmed investments: active or completed (no "confirmed" status on Investment)
      Investment.aggregate([
        {
          $match: {
            status: { $in: ['active', 'completed'] },
            facilitationFee: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            facilitationFees: { $sum: '$facilitationFee' },
            netToCooperatives: { $sum: { $ifNull: ['$netAmount', 0] } },
            grossInvested: { $sum: { $ifNull: ['$grossAmount', '$amountDeployed'] } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const [activePaidCoops, pendingPaymentCoops] = coopCounts;

    const mobilePayments = mobileAll.map((p) => ({
      id: String(p._id),
      source: 'mobile',
      entityName: p.entityName || '—',
      entityType: p.entityType,
      entityEmail: p.entityEmail || '',
      amount: Number(p.amount) || 0,
      currency: p.currency || 'USD',
      method: p.paymentMethod,
      status: p.status,
      reference: p.referenceCode,
      date: p.confirmedAt || p.createdAt,
      createdAt: p.createdAt,
      subscriptionType: p.subscriptionType,
    }));

    const stripeFromSubs = stripeSubs.map((s) => ({
      id: `sub-${s._id}`,
      source: 'stripe',
      entityName: s.tierKey || s.plan || 'Subscription',
      entityType: s.tierKey || 'subscription',
      entityEmail: s.investorEmail || '',
      amount: Number(s.priceUSD) || 0,
      currency: 'USD',
      method: 'stripe',
      status: s.status === 'active' ? 'confirmed' : s.status || 'confirmed',
      reference: s.paymentReference || s.stripeSubscriptionId || s.stripePriceId || '',
      date: s.startDate || s.createdAt,
      createdAt: s.createdAt,
      subscriptionType: s.tierKey || s.plan,
    }));

    // Stripe coops not already represented via PremiumSubscription (Growth activates coop only)
    const subEmails = new Set(
      stripeFromSubs.map((s) => String(s.entityEmail || '').toLowerCase()).filter(Boolean)
    );
    const stripeFromCoops = stripeCoops
      .filter((c) => !subEmails.has(String(c.email || '').toLowerCase()))
      .map((c) => ({
        id: `coop-stripe-${c._id}`,
        source: 'stripe',
        entityName: c.cooperativeName || '—',
        entityType: 'cooperative',
        entityEmail: c.email || '',
        amount: 199,
        currency: 'USD',
        method: 'stripe',
        status: 'confirmed',
        reference: c.paymentMethod || 'stripe',
        date: c.paymentDate || c.activatedAt || c.createdAt,
        createdAt: c.createdAt,
        subscriptionType: 'cooperative_growth',
      }));

    const stripePayments = [...stripeFromSubs, ...stripeFromCoops].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );

    const confirmedAmounts = [];
    for (const p of mobileAll) {
      if (p.status !== 'confirmed') continue;
      confirmedAmounts.push({
        amount: Number(p.amount) || 0,
        date: p.confirmedAt || p.updatedAt || p.createdAt,
      });
    }
    for (const p of stripePayments) {
      if (p.status !== 'confirmed' && p.status !== 'active') continue;
      confirmedAmounts.push({ amount: Number(p.amount) || 0, date: p.date });
    }

    const inRange = (d, start) => {
      const t = new Date(d).getTime();
      return Number.isFinite(t) && t >= start.getTime();
    };

    const confirmedThisMonth = confirmedAmounts
      .filter((x) => inRange(x.date, monthStart))
      .reduce((s, x) => s + x.amount, 0);
    const confirmedThisYear = confirmedAmounts
      .filter((x) => inRange(x.date, yearStart))
      .reduce((s, x) => s + x.amount, 0);
    const totalConfirmed = confirmedAmounts.reduce((s, x) => s + x.amount, 0);

    // Cooperative annual revenue: only real confirmed coop-related payments this year
    const coopAnnualRevenue = [
      ...mobileAll
        .filter(
          (p) =>
            p.status === 'confirmed' &&
            (p.subscriptionType === 'cooperative_growth' || p.entityType === 'cooperative') &&
            inRange(p.confirmedAt || p.updatedAt || p.createdAt, yearStart)
        )
        .map((p) => Number(p.amount) || 0),
      ...stripePayments
        .filter(
          (p) =>
            (p.entityType === 'cooperative' ||
              p.subscriptionType === 'cooperative' ||
              p.subscriptionType === 'cooperative_growth') &&
            inRange(p.date, yearStart)
        )
        .map((p) => Number(p.amount) || 0),
    ].reduce((s, n) => s + n, 0);

    const feeRow = facilitationFeeAgg?.[0] || {};
    const facilitationFees = Number(feeRow.facilitationFees) || 0;

    return res.json({
      success: true,
      mobilePayments,
      stripePayments,
      summary: {
        confirmedThisMonth,
        confirmedThisYear,
        totalConfirmed,
        coopAnnualRevenue,
        facilitationFees,
        facilitationFeeInvestmentCount: Number(feeRow.count) || 0,
        investmentGrossTotal: Number(feeRow.grossInvested) || 0,
        investmentNetToCooperatives: Number(feeRow.netToCooperatives) || 0,
        activePaidCoops,
        pendingPaymentCoops,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
