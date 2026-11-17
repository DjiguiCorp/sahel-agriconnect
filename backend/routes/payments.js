import express from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import PremiumSubscription from '../models/PremiumSubscription.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Investment from '../models/Investment.js';
import Opportunity from '../models/Opportunity.js';
import Investor from '../models/Investor.js';
import InvestorKYC from '../models/InvestorKYC.js';
import GovernmentAdmin from '../models/GovernmentAdmin.js';
import PendingNotification from '../models/PendingNotification.js';
import {
  confirmAfriYieldInvestmentPayment,
  notifyAdminAfriYieldInvestmentPayment,
} from '../services/emailService.js';
import InvestorNotification from '../models/InvestorNotification.js';
import {
  resolveInvestorLang,
  investorNotificationCopy,
} from '../utils/investorNotificationCopy.js';
import rateLimit from 'express-rate-limit';
import { assertCoopGrowthCheckoutAllowed } from '../services/coopMemberUpgrade.js';

const router = express.Router();

function assertStripeSecretKeyFormat(raw) {
  const key = String(raw || '').trim();
  if (!key) return null;
  // Stripe secret keys are sk_live_… / sk_test_… (restricted: rk_…).
  // Dashboard row IDs like mk_… are NOT API keys — using them causes auth failures.
  if (/^mk_/i.test(key)) {
    console.error(
      '[stripe] STRIPE_SECRET_KEY looks like a dashboard object id (mk_…), not an API key. ' +
        'Use the secret key token that starts with sk_live_ or sk_test_ from Developers → API keys.'
    );
    return null;
  }
  if (!/^sk_(live|test)_/.test(key) && !/^rk_(live|test)_/.test(key)) {
    console.error(
      '[stripe] STRIPE_SECRET_KEY has unexpected format (expected sk_live_/sk_test_/rk_…). prefix=',
      key.slice(0, 12)
    );
    return null;
  }
  return key;
}

const stripeSecretKey = assertStripeSecretKeyFormat(process.env.STRIPE_SECRET_KEY);
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' })
  : null;

/**
 * Map checkout tierKey → Stripe Price ID (Render env vars).
 * AfriYield / cooperative / transform / producer / ngo / government.
 */
function resolveStripePriceId(tierKey) {
  const key = String(tierKey || '').trim().toLowerCase();
  const map = {
    investor: process.env.STRIPE_PRICE_AFRIYIELD,
    afriyield: process.env.STRIPE_PRICE_AFRIYIELD,
    afriyield_access: process.env.STRIPE_PRICE_AFRIYIELD,
    cooperative: process.env.STRIPE_PRICE_COOPERATIVE,
    cooperative_growth: process.env.STRIPE_PRICE_COOPERATIVE,
    transformation: process.env.STRIPE_PRICE_TRANSFORMATION,
    transformation_center: process.env.STRIPE_PRICE_TRANSFORMATION,
    producer_pro: process.env.STRIPE_PRICE_PRODUCER_PRO,
    ngo: process.env.STRIPE_PRICE_NGO,
    government: process.env.STRIPE_PRICE_GOVERNMENT,
  };
  const priceId = map[key];
  return priceId ? String(priceId).trim() : null;
}

function defaultReturnUrls(tierKey, baseFront) {
  const key = String(tierKey || '').trim().toLowerCase();
  const defaults = {
    investor: {
      success: `${baseFront}/afri-yield/portal?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel: `${baseFront}/afri-yield/portal?payment=cancelled`,
    },
    afriyield: {
      success: `${baseFront}/afri-yield/portal?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel: `${baseFront}/afri-yield/portal?payment=cancelled`,
    },
    afriyield_access: {
      success: `${baseFront}/afri-yield/portal?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel: `${baseFront}/afri-yield/portal?payment=cancelled`,
    },
    cooperative: {
      success: `${baseFront}/cooperative-registration?payment=success`,
      cancel: `${baseFront}/pricing?cancelled=cooperative`,
    },
    cooperative_growth: {
      success: `${baseFront}/cooperative-portal?upgrade=success`,
      cancel: `${baseFront}/cooperative-upgrade?cancelled=1`,
    },
    transformation: {
      success: `${baseFront}/transformation-registration?payment=success`,
      cancel: `${baseFront}/pricing?cancelled=transformation`,
    },
    transformation_center: {
      success: `${baseFront}/transformation-registration?payment=success`,
      cancel: `${baseFront}/pricing?cancelled=transformation`,
    },
    producer_pro: {
      success: `${baseFront}/my-dashboard?upgrade=success`,
      cancel: `${baseFront}/pricing?cancelled=producer_pro`,
    },
    ngo: {
      success: `${baseFront}/ngo-portal?payment=success`,
      cancel: `${baseFront}/pricing?cancelled=ngo`,
    },
    government: {
      success: `${baseFront}/government-portal?payment=success`,
      cancel: `${baseFront}/pricing?cancelled=government`,
    },
  };
  return (
    defaults[key] || {
      success: `${baseFront}/pricing?success=true`,
      cancel: `${baseFront}/pricing?cancelled=true`,
    }
  );
}

function ensureStripeConfigured(res) {
  if (!stripe) {
    res.status(503).json({
      success: false,
      error: 'Stripe is not configured (missing STRIPE_SECRET_KEY)',
    });
    return false;
  }
  return true;
}

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many checkout requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

const ORANGE_BASE = process.env.ORANGE_BASE_URL || 'https://api.orange.com';
const MTN_BASE = process.env.MTN_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const MTN_ENV = process.env.MTN_ENVIRONMENT || 'sandbox';

function isAllowedReturnUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(String(url));
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    const allowed = new Set(['sahelagriconnect.com', 'www.sahelagriconnect.com', 'afriyieldexchange.com', 'www.afriyieldexchange.com']);
    return allowed.has(host);
  } catch {
    return false;
  }
}

function safeReturnUrl(maybeUrl, fallbackUrl) {
  if (isAllowedReturnUrl(maybeUrl)) return maybeUrl;
  return fallbackUrl;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function round2(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

function buildPayoutSchedule({ amountDeployed, expectedROIPercent, deploymentDate }) {
  const principal = Number(amountDeployed) || 0;
  const roi = Number(expectedROIPercent) || 0;
  const perHalf = (principal * (roi / 100)) / 2;
  const base = deploymentDate ? new Date(deploymentDate) : new Date();
  return [
    { payoutDate: addMonths(base, 6), amount: round2(perHalf), status: 'scheduled', notes: '' },
    { payoutDate: addMonths(base, 12), amount: round2(perHalf), status: 'scheduled', notes: '' },
  ];
}

function defaultAmountUsdForTier(tierKey) {
  const key = String(tierKey || '').trim().toLowerCase();
  const defaults = {
    investor: 99,
    afriyield: 99,
    afriyield_access: 99,
    cooperative: 199,
    cooperative_growth: 199,
    transformation: 109,
    transformation_center: 109,
    producer_pro: 29.99,
    ngo: 499,
    government: 999,
  };
  return defaults[key] ?? null;
}

/** Annual platform tiers (everything else with a known price is monthly). */
function isAnnualTierKey(tierKey) {
  return ['investor', 'afriyield', 'afriyield_access', 'cooperative', 'cooperative_growth'].includes(
    String(tierKey || '').trim().toLowerCase()
  );
}

function resolveBillingInterval(tierKey, billingInterval) {
  if (billingInterval === 'month' || billingInterval === 'year') return billingInterval;
  return isAnnualTierKey(tierKey) ? 'year' : 'month';
}

function subscriptionIsAnnual({ tierKey, billingInterval, amountTotal }) {
  if (billingInterval === 'month') return false;
  if (billingInterval === 'year') return true;
  if (isAnnualTierKey(tierKey)) return true;
  if (Number(amountTotal) === 9900 || Number(amountTotal) === 19900) return true;
  return false;
}

function isMissingStripePriceError(err) {
  const msg = String(err?.message || err || '');
  const code = String(err?.code || err?.raw?.code || '');
  return (
    code === 'resource_missing' ||
    /No such price/i.test(msg) ||
    /No such product/i.test(msg)
  );
}

async function createSubscriptionCheckoutSession({
  emailNorm,
  lineItems,
  metadata,
  successUrl,
  cancelUrl,
}) {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    ...(emailNorm ? { customer_email: emailNorm } : {}),
    line_items: lineItems,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

// ── Stripe: create checkout session ────────────────────────────
// POST /api/payments/stripe/create-session
// Body: { email, tierKey, tierName, amountUsd?, successUrl, cancelUrl, billingInterval? }
//
// Prefer Stripe Dashboard Price IDs (Render env):
//   STRIPE_PRICE_AFRIYIELD | COOPERATIVE | TRANSFORMAT | PRODUCER_PRO | NGO | GOVERNMENT
// If the Price ID is missing on the account tied to STRIPE_SECRET_KEY
// (wrong Stripe account / live vs test), fall back to inline price_data.
router.post('/stripe/create-session', checkoutLimiter, async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;
    const {
      email,
      tierKey,
      tierName,
      amountUsd,
      successUrl,
      cancelUrl,
      billingInterval,
    } = req.body || {};

    const tier = String(tierKey || req.body?.type || '').trim();
    const priceId = resolveStripePriceId(tier);
    const fallbackAmount =
      amountUsd != null && amountUsd !== ''
        ? Number(amountUsd)
        : defaultAmountUsdForTier(tier);

    if (!priceId && (fallbackAmount == null || !Number.isFinite(fallbackAmount))) {
      return res.status(400).json({
        success: false,
        error:
          'Stripe Price ID not configured for this tier (set STRIPE_PRICE_* env) and amountUsd missing',
      });
    }

    // email is optional — Stripe will collect it on the checkout page if not provided
    const emailNorm = email ? String(email).toLowerCase().trim() : '';
    const extraMeta = req.body?.metadata && typeof req.body.metadata === 'object'
      ? Object.fromEntries(
          Object.entries(req.body.metadata).map(([k, v]) => [k, String(v ?? '')])
        )
      : {};
    if (req.body?.memberCount != null) extraMeta.memberCount = String(req.body.memberCount);
    if (req.body?.cooperativeName) extraMeta.cooperativeName = String(req.body.cooperativeName);
    if (req.body?.type) extraMeta.type = String(req.body.type);
    if (
      !extraMeta.type &&
      ['investor', 'afriyield', 'afriyield_access'].includes(tier.toLowerCase())
    ) {
      extraMeta.type = 'afriyield_access';
    }

    // Growth upgrade ($199/year) — require 51 verified members before Stripe
    const tierLower = tier.toLowerCase();
    if (tierLower === 'cooperative_growth') {
      const gate = await assertCoopGrowthCheckoutAllowed({
        email: emailNorm,
        cooperativeId:
          req.body?.cooperativeId ||
          req.body?.metadata?.cooperativeId ||
          extraMeta.cooperativeId,
      });
      if (!gate.ok) {
        return res.status(gate.status || 403).json({
          success: false,
          error: gate.error,
          errorCode: gate.errorCode || gate.error,
          verifiedMemberCount: gate.verifiedMemberCount ?? 0,
          verifiedCount: gate.verifiedCount ?? gate.verifiedMemberCount ?? 0,
          declaredCount: gate.declaredCount ?? 0,
          requiredVerified: gate.requiredVerified ?? 51,
          requiredDeclaredForPathB: gate.requiredDeclaredForPathB ?? 51,
          requiredVerifiedForPathB: gate.requiredVerifiedForPathB ?? 10,
          required: 51,
        });
      }
      extraMeta.verifiedMemberCount = String(gate.verifiedMemberCount);
      extraMeta.cooperativeId = gate.cooperativeId;
      if (gate.pendingFullVerification) {
        extraMeta.pendingFullVerification = 'true';
      }
    }

    const baseFront = process.env.FRONTEND_URL || 'https://sahelagriconnect.com';
    const urls = defaultReturnUrls(tier, baseFront);
    const interval = resolveBillingInterval(tier, billingInterval);
    const success = safeReturnUrl(successUrl, urls.success);
    const cancel = safeReturnUrl(cancelUrl, urls.cancel);

    const metadata = {
      tierKey: tier || '',
      email: emailNorm,
      billingInterval: interval,
      stripePriceId: priceId || '',
      ...extraMeta,
    };

    if (priceId) {
      try {
        const session = await createSubscriptionCheckoutSession({
          emailNorm,
          lineItems: [{ price: priceId, quantity: 1 }],
          metadata,
          successUrl: success,
          cancelUrl: cancel,
        });
        return res.json({
          success: true,
          url: session.url,
          sessionId: session.id,
          mode: 'price_id',
        });
      } catch (priceErr) {
        if (!isMissingStripePriceError(priceErr) || fallbackAmount == null) {
          throw priceErr;
        }
        console.warn(
          '[stripe] Price ' + priceId + ' not found for current STRIPE_SECRET_KEY account; ' +
            'falling back to price_data ($' + fallbackAmount + '/' + interval + '). ' +
            'Use a Price ID from the same Stripe account as STRIPE_SECRET_KEY.'
        );
      }
    }

    const amountCents = Math.round(Number(fallbackAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ success: false, error: 'amountUsd required' });
    }
    const productName = tierName || tier || 'Sahel AgriConnect Subscription';
    const session = await createSubscriptionCheckoutSession({
      emailNorm,
      lineItems: [
        {
          price_data: {
            currency: 'usd',
            recurring: { interval },
            product_data: {
              name: productName,
              description: 'Sahel AgriConnect Platform — ' + productName,
              images: ['https://sahelagriconnect.com/sahel-logo.png'],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        ...metadata,
        stripePriceId: '',
        priceDataFallback: '1',
        amountUsd: String(fallbackAmount),
      },
      successUrl: success,
      cancelUrl: cancel,
    });
    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      mode: 'price_data',
    });
  } catch (e) {
    console.error('[stripe] create-session error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * Activate AfriYield / platform PremiumSubscription from a paid Checkout Session.
 * Used by webhook and by portal return (confirm-access-session) so payment works
 * even if the webhook endpoint is on a mismatched Stripe account.
 */
async function activateSubscriptionFromCheckoutSession(session) {
  const email =
    session.customer_email ||
    session.metadata?.email ||
    session.customer_details?.email ||
    '';
  const emailNorm = String(email || '').toLowerCase().trim();
  if (!emailNorm) return { ok: false, reason: 'missing_email' };

  const tierKey = String(session.metadata?.tierKey || '').trim().toLowerCase();
  const metaType = String(session.metadata?.type || '').toLowerCase();
  const isAnnual = subscriptionIsAnnual({
    tierKey,
    billingInterval: session.metadata?.billingInterval,
    amountTotal: session.amount_total,
  });
  const days = isAnnual ? 365 : 30;

  await PremiumSubscription.findOneAndUpdate(
    { investorEmail: emailNorm },
    {
      investorEmail: emailNorm,
      ...(tierKey ? { tierKey } : {}),
      ...(session.metadata?.stripePriceId
        ? { stripePriceId: session.metadata.stripePriceId }
        : {}),
      ...(session.subscription
        ? {
            stripeSubscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id,
          }
        : {}),
      plan: isAnnual ? 'annual' : 'monthly',
      priceUSD: (session.amount_total || 0) / 100,
      status: 'active',
      paymentMethod: 'stripe',
      paymentReference: session.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    },
    { upsert: true, new: true }
  );

  if (
    ['investor', 'afriyield', 'afriyield_access'].includes(tierKey) ||
    metaType === 'afriyield_access'
  ) {
    await InvestorKYC.findOneAndUpdate(
      { investorEmail: emailNorm },
      {
        paymentVerified: true,
        paymentVerifiedAt: new Date(),
        stripeSessionId: session.id,
      },
      { upsert: false }
    );
  }

  return { ok: true, email: emailNorm, tierKey };
}

// POST /api/payments/stripe/confirm-access-session
// Body: { sessionId } — called when investor returns from Stripe Checkout
router.post('/stripe/confirm-access-session', checkoutLimiter, async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;
    const sessionId = String(req.body?.sessionId || req.body?.session_id || '').trim();
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId required' });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(402).json({
        success: false,
        error: 'Payment not completed',
        payment_status: session.payment_status,
        status: session.status,
      });
    }
    const result = await activateSubscriptionFromCheckoutSession(session);
    if (!result.ok) {
      return res.status(400).json({ success: false, error: result.reason || 'Activation failed' });
    }
    return res.json({
      success: true,
      email: result.email,
      tierKey: result.tierKey,
      subscriptionActive: true,
    });
  } catch (e) {
    console.error('[stripe] confirm-access-session error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── Stripe: webhook ─────────────────────────────────────────────
// POST /api/payments/stripe/webhook
// NOTE: server.js mounts express.raw() for this exact path before
// express.json(), so req.body here is a Buffer.
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook not configured' });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    return res.status(400).json({ error: `Webhook error: ${e.message}` });
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email || session.metadata?.email;
      const type = session.metadata?.type;

      // ── AfriYield investment payment ──────────────────────────
      if (type === 'afriyield_investment') {
        const {
          investorEmail,
          opportunityId,
          opportunityName,
          amountUSD,
          investorName,
        } = session.metadata || {};

        const investorEmailLower = String(investorEmail || email || '')
          .trim()
          .toLowerCase();
        const grossAmount = parseFloat(
          (
            (Number(session.amount_total) > 0
              ? session.amount_total / 100
              : Number(amountUSD) || 0) || 0
          ).toFixed(2)
        );
        const facilitationFee = parseFloat((grossAmount * 0.05).toFixed(2));
        const netAmount = parseFloat((grossAmount - facilitationFee).toFixed(2));
        const amountDeployed = grossAmount;
        const oppId =
          opportunityId && mongoose.Types.ObjectId.isValid(opportunityId)
            ? opportunityId
            : null;
        const opp = oppId ? await Opportunity.findById(oppId).lean() : null;
        const investor = investorEmailLower
          ? await Investor.findOne({ email: investorEmailLower }).lean()
          : null;
        const track = ['Track A', 'Track B'].includes(opp?.track)
          ? opp.track
          : 'Track B';
        const expectedROIPercent =
          Number(session.metadata?.expectedROI) ||
          Number(opp?.expectedROIMin) ||
          8;
        const deploymentDate = new Date();
        const adminNotes = [
          `stripeSessionId=${session.id}`,
          `stripePaymentIntent=${session.payment_intent || ''}`,
          'paymentMethod=stripe',
          `facilitationFee=${facilitationFee}`,
          `netAmount=${netAmount}`,
        ].join('; ');

        let investment = await Investment.findOne({
          adminNotes: { $regex: session.id },
        });
        let investmentCreated = false;

        if (
          !investment &&
          investorEmailLower &&
          grossAmount > 0 &&
          oppId &&
          opp
        ) {
          investment = await Investment.create({
            investorId: investor?._id,
            investorName: investorName || investor?.fullName || '',
            investorEmail: investorEmailLower,
            opportunityId: opp._id,
            opportunityName: opportunityName || opp?.centerName || '',
            track,
            commodity: opp?.commodity || '',
            amountDeployed,
            grossAmount,
            facilitationFee,
            netAmount,
            currency: 'USD',
            deploymentDate,
            expectedROIPercent,
            payoutSchedule: buildPayoutSchedule({
              amountDeployed: grossAmount,
              expectedROIPercent,
              deploymentDate,
            }),
            status: 'active',
            adminNotes,
          });
          investmentCreated = true;
          console.log('✅ AfriYield investment saved:', {
            id: investment._id,
            email: investorEmailLower,
            opportunityId: oppId,
            grossAmount,
            facilitationFee,
            netAmount,
            sessionId: session.id,
          });
        } else if (investment) {
          console.log('AfriYield investment already recorded:', session.id);
        }

        if (investmentCreated && investment && opp) {
          const updatedOpp = await Opportunity.findByIdAndUpdate(
            opp._id,
            {
              $inc: { amountRaised: netAmount },
              $set: { updatedAt: new Date() },
            },
            { new: true }
          );
          if (
            updatedOpp &&
            updatedOpp.amountSought > 0 &&
            updatedOpp.amountRaised >= updatedOpp.amountSought
          ) {
            await Opportunity.findByIdAndUpdate(opp._id, { status: 'funded' });
          }
        }

        if (investmentCreated && investment) {
          await PendingNotification.create({
            recipientName: 'Admin',
            recipientEmail: process.env.ADMIN_EMAIL || 'support@woneapp.com',
            message:
              `✅ AfriYield investment paid (Stripe): ${investment.investorName || investorEmailLower} `
              + `(${investorEmailLower}) — $${amountDeployed.toLocaleString()} USD in `
              + `${investment.opportunityName || opportunityName || oppId}. `
              + `Session: ${session.id}`,
            source: 'afriyield_stripe_investment',
            channel: 'email',
            status: 'pending',
          });

          const invLang = resolveInvestorLang({
            preferredLanguage: investor?.preferredLanguage,
            countryOfResidence: investor?.countryOfResidence,
          });
          const invCopy = investorNotificationCopy('investment_confirmed', invLang, {
            args: [investment.opportunityName, amountDeployed],
          });
          InvestorNotification.create({
            investorEmail: investorEmailLower,
            type: 'investment_confirmed',
            title: invCopy.title,
            message: invCopy.message,
            lang: invLang,
            link: '/afri-yield/portal',
          }).catch(console.error);

          confirmAfriYieldInvestmentPayment({
            investorEmail: investorEmailLower,
            investorName: investment.investorName,
            opportunityName: investment.opportunityName,
            amountUSD: amountDeployed,
            lang: invLang,
          }).catch(console.error);

          notifyAdminAfriYieldInvestmentPayment({
            investorEmail: investorEmailLower,
            investorName: investment.investorName,
            opportunityName: investment.opportunityName,
            opportunityId: String(oppId || opportunityId || ''),
            amountUSD: amountDeployed,
            stripeSessionId: session.id,
          }).catch(console.error);
        }

        // Notify KYC service that African investor has paid
        const { getCountryCategory } = await import(
          '../models/InvestorKYC.js');
        if (investorEmailLower) {
          const cat = getCountryCategory(
            session.metadata?.country || '');
          if (cat === 'african') {
            // Mark payment verified for African investor
            await fetch(
              `${String(process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '')}`
                + '/api/kyc/mark-payment-verified',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(process.env.INTERNAL_API_TOKEN
                    ? { 'x-internal-token': process.env.INTERNAL_API_TOKEN }
                    : {}),
                },
                body: JSON.stringify({
                  investorEmail: investorEmailLower,
                  stripeSessionId: session.id,
                }),
              }
            );
          }
        }
      }

      const tierKey = String(session.metadata?.tierKey || '').trim().toLowerCase();
      const emailNorm = email ? String(email).toLowerCase().trim() : '';
      // Investment checkouts are not platform subscriptions
      const isInvestmentCheckout = type === 'afriyield_investment';

      // ── Cooperative Growth annual membership ────────────────
      if (
        !isInvestmentCheckout &&
        ['cooperative', 'cooperative_growth'].includes(tierKey) &&
        emailNorm
      ) {
        const memberCountMeta = Number(session.metadata?.memberCount);
        const now = new Date();
        const existingCoop = await CooperativePlatformRegistration.findOne({ email: emailNorm })
          .sort({ createdAt: -1 })
          .lean();
        const provisional =
          Boolean(existingCoop?.pendingFullVerification) ||
          String(session.metadata?.pendingFullVerification || '') === 'true';
        const update = {
          paymentReceived: true,
          paymentDate: now,
          paymentMethod: 'stripe',
          status: 'active',
          activatedAt: now,
          tier: 'growth',
          certificationEligible: true,
          afriyieldEligible: !provisional,
          exportEligible: true,
          pendingFullVerification: provisional,
          ...(provisional
            ? { gracePeriodStartDate: existingCoop?.gracePeriodStartDate || now }
            : { gracePeriodStartDate: null }),
          subscriptionRenewedAt: now,
          subscriptionExpiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        };
        if (Number.isFinite(memberCountMeta) && memberCountMeta > 0) {
          update.memberCount = memberCountMeta;
        }
        const coopUpdated = await CooperativePlatformRegistration.findOneAndUpdate(
          { email: emailNorm },
          update,
          { sort: { createdAt: -1 }, new: true }
        );
        console.log('✅ Cooperative Growth membership payment:', emailNorm);
        if (coopUpdated?._id) {
          try {
            const { applyCooperativeCertification } = await import(
              '../services/certificationService.js'
            );
            await applyCooperativeCertification(coopUpdated._id);
          } catch (certErr) {
            console.error('[payments] coop certification check failed:', certErr.message);
          }

          // Admin verification alert after Growth payment activation
          try {
            const { getVerifiedMemberCount, syncPendingFullVerification } = await import(
              '../services/coopMemberUpgrade.js'
            );
            const { Resend } = await import('resend');
            const verifiedMemberCount = await getVerifiedMemberCount(coopUpdated._id);
            await syncPendingFullVerification(coopUpdated._id, verifiedMemberCount);
            const declaredMemberCount = Number(coopUpdated.memberCount) || 0;
            if (process.env.RESEND_API_KEY) {
              const resend = new Resend(process.env.RESEND_API_KEY);
              await resend.emails.send({
                from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
                to: 'info@djiguicorporation.org',
                subject:
                  'Nouvelle coopérative Growth activée — vérification requise / New Growth cooperative activated — verification required',
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:#1a3c2e;padding:20px;border-radius:8px 8px 0 0;">
                      <h1 style="color:#B5850A;margin:0;font-size:18px;">Growth activation</h1>
                    </div>
                    <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
                      <p><strong>${coopUpdated.cooperativeName || ''}</strong></p>
                      <p>Leader: ${coopUpdated.leaderName || '—'} · ${coopUpdated.email || ''}</p>
                      <p>Country / Region: ${coopUpdated.country || '—'} / ${coopUpdated.regionCity || '—'}</p>
                      <p>Declared members: <strong>${declaredMemberCount}</strong></p>
                      <p>Verified platform members: <strong>${verifiedMemberCount}</strong></p>
                      <p>Payment: Stripe · ${coopUpdated.paymentDate ? new Date(coopUpdated.paymentDate).toISOString() : 'now'}</p>
                      <p style="margin-top:16px;">
                        <a href="https://sahelagriconnect.com/admin/central"
                          style="background:#1a3c2e;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;">
                          Open admin panel
                        </a>
                      </p>
                    </div>
                  </div>
                `,
              });
            }
          } catch (adminMailErr) {
            console.error('[payments] growth admin verify email failed:', adminMailErr.message);
          }
        }
      }

      // ── Platform subscriptions (AfriYield, Producer Pro, Transform, NGO, Gov) ─
      // checkout.session.completed → activate PremiumSubscription in MongoDB
      else if (!isInvestmentCheckout && emailNorm) {
        const isAnnual = subscriptionIsAnnual({
          tierKey,
          billingInterval: session.metadata?.billingInterval,
          amountTotal: session.amount_total,
        });
        const days = isAnnual ? 365 : 30;
        await PremiumSubscription.findOneAndUpdate(
          { investorEmail: emailNorm },
          {
            investorEmail: emailNorm,
            ...(tierKey ? { tierKey } : {}),
            ...(session.metadata?.stripePriceId
              ? { stripePriceId: session.metadata.stripePriceId }
              : {}),
            ...(session.subscription
              ? {
                  stripeSubscriptionId:
                    typeof session.subscription === 'string'
                      ? session.subscription
                      : session.subscription.id,
                }
              : {}),
            plan: isAnnual ? 'annual' : 'monthly',
            priceUSD: (session.amount_total || 0) / 100,
            status: 'active',
            paymentMethod: 'stripe',
            paymentReference: session.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          },
          { upsert: true, new: true }
        );
        console.log('✅ Subscription activated:', { email: emailNorm, tierKey: tierKey || 'unknown' });

        // AfriYield access fee → mark KYC paymentVerified for portal status UI
        const metaType = String(session.metadata?.type || '').toLowerCase();
        if (
          ['investor', 'afriyield', 'afriyield_access'].includes(tierKey) ||
          metaType === 'afriyield_access'
        ) {
          await InvestorKYC.findOneAndUpdate(
            { investorEmail: emailNorm },
            {
              paymentVerified: true,
              paymentVerifiedAt: new Date(),
              stripeSessionId: session.id,
            },
            { upsert: false }
          );
          const invLang = resolveInvestorLang({});
          const payCopy = investorNotificationCopy('payment_verified', invLang);
          InvestorNotification.create({
            investorEmail: emailNorm,
            type: 'payment_verified',
            title: payCopy.title,
            message: payCopy.message,
            lang: invLang,
            link: '/afri-yield/portal',
          }).catch(console.error);
        }

        // NGO / Government portal access
        if (['ngo', 'government'].includes(tierKey)) {
          await GovernmentAdmin.findOneAndUpdate(
            { email: emailNorm },
            {
              status: 'active',
              accessTier: 'standard',
              ...(tierKey === 'ngo' ? { orgType: 'ngo' } : {}),
            }
          );
        }
      }
    }
    return res.json({ received: true });
  } catch (e) {
    console.error('Stripe webhook handler error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── Stripe: AfriYield Investment checkout ───────────────────────
// POST /api/payments/stripe/create-investment-session
// Body: { investorEmail, investorName, opportunityId,
//         opportunityName, amountUSD, expectedROI }
router.post('/stripe/create-investment-session', checkoutLimiter, async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;

    const {
      investorEmail,
      investorName,
      opportunityId,
      opportunityName,
      amountUSD,
      expectedROI,
      country,
    } = req.body || {};

    if (!investorEmail || !amountUSD || !opportunityId) {
      return res.status(400).json({
        success: false,
        error: 'investorEmail, amountUSD, and opportunityId are required',
      });
    }

    const amount = Number(amountUSD);
    if (isNaN(amount) || amount < 500) {
      return res.status(400).json({
        success: false,
        error: 'Minimum investment is $500 USD',
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // one-time, not subscription
      customer_email: investorEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AfriYield Exchange — ${opportunityName || opportunityId}`,
              description: `Agricultural investment · AfriYield Exchange · ${opportunityName || opportunityId} · Projected return ~${expectedROI || '—'}% (not guaranteed)`,
              images: ['https://afriyieldexchange.com/assets/logo-stripe.png'],
            },
            unit_amount: Math.round(amount * 100), // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'afriyield_investment',
        investorEmail,
        investorName: investorName || '',
        opportunityId,
        opportunityName: opportunityName || '',
        amountUSD: String(amount),
        expectedROI: String(expectedROI || ''),
        country: country || '',
      },
      payment_intent_data: {
        statement_descriptor_suffix: 'AFRIYIELD',
        description: `AfriYield Investment — ${opportunityName || opportunityId}`,
        metadata: {
          type: 'afriyield_investment',
          investorEmail,
          opportunityId,
        },
        capture_method: 'automatic',
      },
      success_url:
        safeReturnUrl(
          process.env.STRIPE_INVESTMENT_SUCCESS_URL,
          `${(process.env.FRONTEND_URL || 'https://sahelagriconnect.com')}/invest/success?session_id={CHECKOUT_SESSION_ID}&opp=${opportunityId}`,
        ),
      cancel_url:
        safeReturnUrl(
          process.env.STRIPE_INVESTMENT_CANCEL_URL,
          `${(process.env.FRONTEND_URL || 'https://sahelagriconnect.com')}/invest/${opportunityId}?cancelled=true`,
        ),
    });

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (e) {
    console.error('Stripe investment session error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── GET /api/payments/stripe/investment-sessions-by-email/:email ─
// List AfriYield checkout session IDs for an investor (admin payment status)
router.get('/stripe/investment-sessions-by-email/:email', async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;

    const email = String(req.params.email || '')
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: 'email required' });
    }

    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const matching = (sessions.data || []).filter((s) => {
      if (s.metadata?.type !== 'afriyield_investment') return false;
      const metaEmail = String(s.metadata?.investorEmail || '').toLowerCase();
      const customerEmail = String(s.customer_email || '').toLowerCase();
      return metaEmail === email || customerEmail === email;
    });

    return res.json({
      success: true,
      sessions: matching.map((s) => ({
        sessionId: s.id,
        payment_status: s.payment_status,
      })),
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── GET /api/payments/stripe/investment-session/:sessionId ──────
// Verify a completed investment session
router.get('/stripe/investment-session/:sessionId', async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;

    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
      { expand: ['payment_intent'] }
    );

    return res.json({
      success: true,
      status: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      amountTotal: (session.amount_total || 0) / 100,
      currency: session.currency,
      customerEmail: session.customer_email,
      metadata: session.metadata,
      paymentIntentId: session.payment_intent?.id,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── Phase 2 / not yet live ──────────────────────────────────────
// Orange Money routes below are functional stubs. They require ORANGE_* env vars
// and are not connected to any frontend checkout flow.
// ── Orange Money helpers ────────────────────────────────────────
async function getOrangeAccessToken() {
  if (!process.env.ORANGE_CLIENT_ID || !process.env.ORANGE_CLIENT_SECRET) {
    throw new Error('Orange Money not configured');
  }
  const basic = Buffer.from(
    `${process.env.ORANGE_CLIENT_ID}:${process.env.ORANGE_CLIENT_SECRET}`
  ).toString('base64');
  const tokenRes = await fetch(`${ORANGE_BASE}/oauth/v3/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenData.access_token) {
    const err = new Error(tokenData.error_description || 'Orange Money auth failed');
    err.upstream = tokenData;
    throw err;
  }
  return tokenData.access_token;
}

// POST /api/payments/orange/initiate
// Body: { email, phone, amount, currency, tierName, orderId }
router.post('/orange/initiate', async (req, res) => {
  try {
    const { email, phone, amount, currency = 'XOF', tierName, orderId } = req.body || {};
    if (!email || !amount || !phone) {
      return res
        .status(400)
        .json({ success: false, error: 'email, phone and amount required' });
    }

    const accessToken = await getOrangeAccessToken();
    const ref = orderId || `SAC-${Date.now()}`;
    const payRes = await fetch(
      `${ORANGE_BASE}/orange-money-webpay/dev/v1/webpayment`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_key: process.env.ORANGE_MERCHANT_KEY,
          currency,
          order_id: ref,
          amount: String(amount),
          return_url: `${process.env.FRONTEND_URL || ''}/pricing?success=true&provider=orange`,
          cancel_url: `${process.env.FRONTEND_URL || ''}/pricing?cancelled=true`,
          notif_url: `${process.env.BACKEND_URL || ''}/api/payments/orange/webhook`,
          lang: 'fr',
          reference: `${tierName || 'Subscription'} — Sahel AgriConnect`,
        }),
      }
    );
    const payData = await payRes.json().catch(() => ({}));
    if (payData.payment_url) {
      // Pre-create a pending subscription so the webhook can match by paymentReference
      if (email) {
        await PremiumSubscription.findOneAndUpdate(
          { paymentReference: ref },
          {
            investorEmail: email,
            plan: 'monthly',
            priceUSD: undefined,
            status: 'trial',
            paymentMethod: 'orange_money',
            paymentReference: ref,
            startDate: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      return res.json({ success: true, url: payData.payment_url, ref });
    }
    return res.status(502).json({
      success: false,
      error: payData.message || 'Orange Money initiation failed',
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/payments/orange/webhook — Orange notif_url
router.post('/orange/webhook', express.json(), async (req, res) => {
  try {
    const { status, order_id, txnid } = req.body || {};
    if (status === 'SUCCESS' && order_id) {
      await PremiumSubscription.findOneAndUpdate(
        { paymentReference: order_id },
        {
          status: 'active',
          paymentMethod: 'orange_money',
          paymentReference: txnid || order_id,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        { new: true }
      );
    }
    return res.json({ received: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ── Phase 2 / not yet live ──────────────────────────────────────
// MTN MoMo routes below are functional stubs. They require MTN_* env vars
// and are not connected to any frontend checkout flow.
// ── MTN MoMo helpers ────────────────────────────────────────────
async function getMtnAccessToken() {
  if (!process.env.MTN_API_USER || !process.env.MTN_API_KEY) {
    throw new Error('MTN MoMo not configured');
  }
  const basic = Buffer.from(
    `${process.env.MTN_API_USER}:${process.env.MTN_API_KEY}`
  ).toString('base64');
  const tokenRes = await fetch(`${MTN_BASE}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY || '',
    },
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenData.access_token) {
    const err = new Error(tokenData.error_description || 'MTN MoMo auth failed');
    err.upstream = tokenData;
    throw err;
  }
  return tokenData.access_token;
}

// POST /api/payments/mtn/request-to-pay
// Body: { email, phone, amount, currency, tierName }
router.post('/mtn/request-to-pay', async (req, res) => {
  try {
    const { email, phone, amount, currency = 'EUR', tierName } = req.body || {};
    if (!email || !amount || !phone) {
      return res
        .status(400)
        .json({ success: false, error: 'email, phone and amount required' });
    }
    const accessToken = await getMtnAccessToken();
    const externalId = `SAC-${Date.now()}`;
    const payRes = await fetch(`${MTN_BASE}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Reference-Id': externalId,
        'X-Target-Environment': MTN_ENV,
        'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency,
        externalId,
        payer: { partyIdType: 'MSISDN', partyId: String(phone).replace(/\D/g, '') },
        payerMessage: `${tierName || 'Subscription'} — Sahel AgriConnect`,
        payeeNote: `Subscription: ${tierName || 'Subscription'}`,
      }),
    });
    if (payRes.status === 202) {
      await PremiumSubscription.findOneAndUpdate(
        { paymentReference: externalId },
        {
          investorEmail: email,
          plan: 'monthly',
          status: 'trial',
          paymentMethod: 'mtn_momo',
          paymentReference: externalId,
          startDate: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.json({
        success: true,
        externalId,
        message:
          'Payment request sent to your phone. Approve it in the MTN MoMo app.',
      });
    }
    const errData = await payRes.json().catch(() => ({}));
    return res
      .status(502)
      .json({ success: false, error: errData.message || 'MTN MoMo request failed' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/payments/mtn/status/:externalId
router.get('/mtn/status/:externalId', async (req, res) => {
  try {
    const accessToken = await getMtnAccessToken();
    const statusRes = await fetch(
      `${MTN_BASE}/collection/v1_0/requesttopay/${encodeURIComponent(req.params.externalId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Target-Environment': MTN_ENV,
          'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY || '',
        },
      }
    );
    const data = await statusRes.json().catch(() => ({}));
    if (data.status === 'SUCCESSFUL') {
      await PremiumSubscription.findOneAndUpdate(
        { paymentReference: req.params.externalId },
        {
          status: 'active',
          paymentMethod: 'mtn_momo',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        { new: true }
      );
    }
    return res.json({ success: true, status: data.status, data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
