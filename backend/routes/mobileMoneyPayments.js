import { createRequire } from 'module';
import express from 'express';
import jwt from 'jsonwebtoken';
import MobileMoneyPayment from '../models/MobileMoneyPayment.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Processor from '../models/Processor.js';
import PremiumSubscription from '../models/PremiumSubscription.js';
import { authenticateToken } from '../middleware/auth.js';

const require = createRequire(import.meta.url);
const router = express.Router();

const XOF_RATE = 600;
const ADMIN_EMAIL = 'info@djiguicorporation.org';
const OM_PHONE = '+223 78 45 07 26';

const AMOUNTS = {
  cooperative_growth: 199,
  transformation_monthly: 109,
};

const METHOD_LABELS = {
  orange_money: 'Orange Money',
  wave: 'Wave',
  cash: 'Espèces / Cash',
  stripe: 'Stripe',
};

async function sendResend({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[mobile-money] RESEND_API_KEY missing — email skipped:', subject);
    return;
  }
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    to,
    subject,
    html,
  });
}

function wrapEmail(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1a3c2e;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:#B5850A;margin:0;font-size:18px;">${title}</h1>
      </div>
      <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:14px;line-height:1.6;color:#222;">
        ${bodyHtml}
      </div>
    </div>
  `;
}

/** Coop leader JWT or processor JWT (or soft email for transform pre-reg). */
async function authCoopOrProcessor(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'cooperative_leader' && decoded.coopId) {
        const coop = await CooperativePlatformRegistration.findById(decoded.coopId);
        if (!coop) return res.status(403).json({ success: false, error: 'Cooperative not found' });
        req.paymentActor = {
          role: 'cooperative',
          entityType: 'cooperative',
          entityId: String(coop._id),
          entityName: coop.cooperativeName || '',
          entityEmail: coop.email || decoded.email || '',
          coop,
        };
        return next();
      }
      if (decoded.role === 'processor' && decoded.id) {
        const proc = await Processor.findById(decoded.id).lean();
        req.paymentActor = {
          role: 'processor',
          entityType: 'transformation_center',
          entityId: String(decoded.id),
          entityName: proc?.nom || decoded.name || '',
          entityEmail: proc?.email || decoded.email || '',
          processor: proc,
        };
        return next();
      }
    }

    // Transformation registration pays before account exists — allow email in body
    const subType = String(req.body?.subscriptionType || '');
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (subType === 'transformation_monthly' && email) {
      req.paymentActor = {
        role: 'processor_prereg',
        entityType: 'transformation_center',
        entityId: email,
        entityName: String(req.body?.entityName || req.body?.centerName || email).trim(),
        entityEmail: email,
      };
      return next();
    }

    return res.status(401).json({ success: false, error: 'Not authenticated' });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

async function activateCooperativeGrowth(payment) {
  const now = new Date();
  const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  let existing = null;
  if (payment.entityId && /^[a-fA-F0-9]{24}$/.test(payment.entityId)) {
    existing = await CooperativePlatformRegistration.findById(payment.entityId).lean();
  }
  if (!existing && payment.entityEmail) {
    existing = await CooperativePlatformRegistration.findOne({
      email: String(payment.entityEmail).toLowerCase(),
    })
      .sort({ createdAt: -1 })
      .lean();
  }
  const provisional = Boolean(existing?.pendingFullVerification);
  const update = {
    paymentReceived: true,
    paymentDate: now,
    paymentMethod: payment.paymentMethod,
    status: 'active',
    activatedAt: now,
    tier: 'growth',
    certificationEligible: true,
    afriyieldEligible: !provisional,
    exportEligible: true,
    pendingFullVerification: provisional,
    ...(provisional
      ? { gracePeriodStartDate: existing?.gracePeriodStartDate || now }
      : { gracePeriodStartDate: null }),
    subscriptionRenewedAt: now,
    subscriptionExpiresAt: expires,
  };

  let coop = null;
  if (payment.entityId && /^[a-fA-F0-9]{24}$/.test(payment.entityId)) {
    coop = await CooperativePlatformRegistration.findByIdAndUpdate(payment.entityId, update, {
      new: true,
    });
  }
  if (!coop && payment.entityEmail) {
    coop = await CooperativePlatformRegistration.findOneAndUpdate(
      { email: String(payment.entityEmail).toLowerCase() },
      update,
      { sort: { createdAt: -1 }, new: true }
    );
  }
  if (coop?._id) {
    try {
      const { syncPendingFullVerification } = await import('../services/coopMemberUpgrade.js');
      await syncPendingFullVerification(coop._id);
    } catch {
      /* best-effort */
    }
  }
  if (coop?._id) {
    try {
      const { applyCooperativeCertification } = await import('../services/certificationService.js');
      await applyCooperativeCertification(coop._id);
    } catch (e) {
      console.warn('[mobile-money] certification stamp failed:', e.message);
    }
  }
  return { expires, coop };
}

async function activateTransformation(payment) {
  const now = new Date();
  const isAnnual = Number(payment.amount) >= 1000;
  const days = isAnnual ? 365 : 30;
  const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const email = String(payment.entityEmail || '').toLowerCase().trim();
  if (email) {
    await PremiumSubscription.findOneAndUpdate(
      { investorEmail: email },
      {
        investorEmail: email,
        tierKey: 'transformation',
        plan: isAnnual ? 'annual' : 'monthly',
        priceUSD: payment.amount,
        status: 'active',
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.referenceCode,
        startDate: now,
        endDate: expires,
      },
      { upsert: true, new: true }
    );
  }
  if (payment.entityId && /^[a-fA-F0-9]{24}$/.test(payment.entityId)) {
    await Processor.findByIdAndUpdate(payment.entityId, {
      $set: { statut: 'Opérationnelle' },
    }).catch(() => {});
  }
  return { expires };
}

function instructionsFor(method, amountXOF, referenceCode, isFr = true) {
  if (method === 'cash') {
    return isFr
      ? `Contactez-nous pour organiser le paiement en espèces. Mentionnez la référence ${referenceCode}. Tél: ${OM_PHONE}`
      : `Contact us to arrange cash payment. Quote reference ${referenceCode}. Tel: ${OM_PHONE}`;
  }
  return isFr
    ? `Envoyez ${Number(amountXOF).toLocaleString('fr-FR')} XOF via Orange Money ou Wave au ${OM_PHONE} (Djigui Corporation). Mentionnez la référence ${referenceCode}.`
    : `Send ${Number(amountXOF).toLocaleString('en-US')} XOF via Orange Money or Wave to ${OM_PHONE} (Djigui Corporation). Include reference ${referenceCode}.`;
}

// POST /api/mobile-money/initiate
router.post('/initiate', authCoopOrProcessor, async (req, res) => {
  try {
    const paymentMethod = String(req.body?.paymentMethod || '').trim();
    const subscriptionType = String(req.body?.subscriptionType || '').trim();

    if (!['orange_money', 'wave', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: 'Invalid paymentMethod' });
    }
    if (!['cooperative_growth', 'transformation_monthly'].includes(subscriptionType)) {
      return res.status(400).json({ success: false, error: 'Invalid subscriptionType' });
    }

    const actor = req.paymentActor;
    if (subscriptionType === 'cooperative_growth' && actor.entityType !== 'cooperative') {
      return res.status(403).json({ success: false, error: 'Cooperative auth required' });
    }
    if (
      subscriptionType === 'transformation_monthly' &&
      actor.entityType !== 'transformation_center'
    ) {
      return res.status(403).json({ success: false, error: 'Processor auth required' });
    }

    let amount = AMOUNTS[subscriptionType];
    const requestedAmount = Number(req.body?.amount);
    if (
      subscriptionType === 'transformation_monthly' &&
      Number.isFinite(requestedAmount) &&
      requestedAmount >= 109 &&
      requestedAmount <= 1090
    ) {
      amount = requestedAmount;
    }
    const amountXOF = Math.round(amount * XOF_RATE);
    const entityEmail =
      String(req.body?.email || actor.entityEmail || '')
        .toLowerCase()
        .trim() || actor.entityEmail;
    const entityName =
      String(req.body?.entityName || actor.entityName || '').trim() || actor.entityName;

    if (!entityEmail) {
      return res.status(400).json({ success: false, error: 'email required' });
    }

    const payment = await MobileMoneyPayment.create({
      entityType: actor.entityType,
      entityId: actor.entityId,
      entityName,
      entityEmail,
      amount,
      currency: 'USD',
      amountXOF,
      paymentMethod,
      status: 'pending',
      subscriptionType,
      notes: String(req.body?.notes || '').trim(),
    });

    const methodLabel = METHOD_LABELS[paymentMethod] || paymentMethod;
    const nowStr = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Bamako' });

    try {
      await sendResend({
        to: ADMIN_EMAIL,
        subject: `🔔 Nouveau paiement en attente — ${payment.referenceCode}`,
        html: wrapEmail(
          'Paiement en attente',
          `
          <p>Une ${actor.entityType === 'cooperative' ? 'coopérative' : 'centre de transformation'} attend confirmation de paiement.</p>
          <p><strong>Référence:</strong> ${payment.referenceCode}<br/>
          <strong>Nom:</strong> ${entityName}<br/>
          <strong>Email:</strong> ${entityEmail}<br/>
          <strong>Méthode:</strong> ${methodLabel}<br/>
          <strong>Montant:</strong> $${amount} USD (${amountXOF.toLocaleString('fr-FR')} XOF)<br/>
          <strong>Type:</strong> ${subscriptionType}<br/>
          <strong>Date:</strong> ${nowStr}</p>
          <p>Connectez-vous au panneau admin pour confirmer:<br/>
          <a href="https://sahelagriconnect.com/admin/central">https://sahelagriconnect.com/admin/central</a></p>
          <p>Vérifiez votre Orange Money (${OM_PHONE}) avant de confirmer.</p>
          `
        ),
      });
    } catch (mailErr) {
      console.error('[mobile-money] admin notify failed:', mailErr.message);
    }

    return res.status(201).json({
      success: true,
      referenceCode: payment.referenceCode,
      amount,
      amountXOF,
      paymentMethod,
      subscriptionType,
      phone: OM_PHONE,
      instructions: instructionsFor(paymentMethod, amountXOF, payment.referenceCode, true),
    });
  } catch (e) {
    console.error('[mobile-money/initiate]', e);
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// POST /api/mobile-money/confirm/:referenceCode
router.post('/confirm/:referenceCode', authenticateToken, async (req, res) => {
  try {
    const code = String(req.params.referenceCode || '').toUpperCase().trim();
    const payment = await MobileMoneyPayment.findOne({ referenceCode: code });
    if (!payment) return res.status(404).json({ success: false, error: 'Not found' });
    if (payment.status === 'confirmed') {
      return res.json({
        success: true,
        activated: true,
        alreadyConfirmed: true,
        subscriptionExpiresAt: payment.confirmedAt,
      });
    }

    let expires;
    if (payment.subscriptionType === 'cooperative_growth') {
      ({ expires } = await activateCooperativeGrowth(payment));
    } else {
      ({ expires } = await activateTransformation(payment));
    }

    payment.status = 'confirmed';
    payment.confirmedBy = req.admin?.email || req.adminId || 'admin';
    payment.confirmedAt = new Date();
    if (req.body?.notes) payment.notes = String(req.body.notes);
    await payment.save();

    const portalLabel =
      payment.entityType === 'cooperative' ? 'Coopérative' : 'Centre de transformation';

    if (payment.entityEmail) {
      try {
        await sendResend({
          to: payment.entityEmail,
          subject: '✅ Paiement confirmé — Votre portail est activé',
          html: wrapEmail(
            'Paiement confirmé',
            `
            <p>Votre paiement de <strong>$${payment.amount}</strong> a été confirmé.<br/>
            Référence: <strong>${payment.referenceCode}</strong></p>
            <p>Votre portail <strong>${portalLabel}</strong> est maintenant entièrement actif.
            Connectez-vous pour accéder à toutes les fonctionnalités.</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
            <p>Your payment of <strong>$${payment.amount}</strong> has been confirmed.<br/>
            Reference: <strong>${payment.referenceCode}</strong><br/>
            Your portal is now fully active.</p>
            `
          ),
        });
      } catch (mailErr) {
        console.error('[mobile-money] confirm email failed:', mailErr.message);
      }
    }

    return res.json({
      success: true,
      activated: true,
      subscriptionExpiresAt: expires,
      referenceCode: payment.referenceCode,
    });
  } catch (e) {
    console.error('[mobile-money/confirm]', e);
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// POST /api/mobile-money/reject/:referenceCode
router.post('/reject/:referenceCode', authenticateToken, async (req, res) => {
  try {
    const code = String(req.params.referenceCode || '').toUpperCase().trim();
    const reason = String(req.body?.rejectionReason || req.body?.reason || '').trim();
    const payment = await MobileMoneyPayment.findOne({ referenceCode: code });
    if (!payment) return res.status(404).json({ success: false, error: 'Not found' });

    payment.status = 'rejected';
    payment.rejectionReason = reason || 'Non spécifié';
    payment.confirmedBy = req.admin?.email || req.adminId || 'admin';
    payment.confirmedAt = new Date();
    await payment.save();

    if (payment.entityEmail) {
      try {
        await sendResend({
          to: payment.entityEmail,
          subject: `❌ Paiement non confirmé — ${payment.referenceCode}`,
          html: wrapEmail(
            'Paiement rejeté',
            `
            <p>Votre paiement (réf. <strong>${payment.referenceCode}</strong>) n'a pas pu être confirmé.</p>
            <p><strong>Motif:</strong> ${payment.rejectionReason}</p>
            <p>Contactez-nous: ${ADMIN_EMAIL} · ${OM_PHONE}</p>
            `
          ),
        });
      } catch (mailErr) {
        console.error('[mobile-money] reject email failed:', mailErr.message);
      }
    }

    return res.json({ success: true, status: 'rejected' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/mobile-money/pending — admin
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const payments = await MobileMoneyPayment.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, payments, count: payments.length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/mobile-money/all — admin: pending + confirmed + rejected
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const status = String(req.query.status || '').trim();
    const filter = {};
    if (['pending', 'confirmed', 'rejected'].includes(status)) filter.status = status;
    const payments = await MobileMoneyPayment.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    return res.json({ success: true, payments, count: payments.length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

// GET /api/mobile-money/my-status — coop or processor
router.get('/my-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let entityId = '';
    let entityEmail = '';

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'cooperative_leader' && decoded.coopId) {
          entityId = String(decoded.coopId);
          entityEmail = String(decoded.email || '').toLowerCase();
        } else if (decoded.role === 'processor' && decoded.id) {
          entityId = String(decoded.id);
          entityEmail = String(decoded.email || '').toLowerCase();
        }
      } catch {
        /* fall through */
      }
    }

    const qEmail = String(req.query.email || '').toLowerCase().trim();
    if (!entityId && !entityEmail && qEmail) entityEmail = qEmail;

    if (!entityId && !entityEmail) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const filter = entityId
      ? { $or: [{ entityId }, ...(entityEmail ? [{ entityEmail }] : [])] }
      : { entityEmail };

    const payment = await MobileMoneyPayment.findOne(filter).sort({ createdAt: -1 }).lean();
    if (!payment) {
      return res.json({ success: true, payment: null });
    }
    return res.json({
      success: true,
      payment: {
        referenceCode: payment.referenceCode,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        amountXOF: payment.amountXOF,
        subscriptionType: payment.subscriptionType,
        rejectionReason: payment.rejectionReason || '',
        confirmedAt: payment.confirmedAt,
        createdAt: payment.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed' });
  }
});

export default router;
