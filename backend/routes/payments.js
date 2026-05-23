import express from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import PremiumSubscription from '../models/PremiumSubscription.js';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Investment from '../models/Investment.js';
import Opportunity from '../models/Opportunity.js';
import Investor from '../models/Investor.js';
import PendingNotification from '../models/PendingNotification.js';
import {
  confirmAfriYieldInvestmentPayment,
  notifyAdminAfriYieldInvestmentPayment,
} from '../services/emailService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' })
  : null;

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

// ── Stripe: create checkout session ────────────────────────────
// POST /api/payments/stripe/create-session
// Body: { email, tierKey, tierName, amountUsd, successUrl, cancelUrl }
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
    if (!email || !amountUsd) {
      return res.status(400).json({ success: false, error: 'email and amountUsd required' });
    }

    const amountCents = Math.round(Number(amountUsd) * 100);
    const productName = tierName || tierKey || 'Sahel AgriConnect Subscription';
    const isAnnualCoop =
      tierKey === 'cooperative' || billingInterval === 'year';

    const session = await stripe.checkout.sessions.create(
      isAnnualCoop
        ? {
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: email,
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: productName,
                    description:
                      'Annual cooperative membership — Sahel AgriConnect',
                  },
                },
                unit_amount: amountCents,
                quantity: 1,
              },
            ],
            payment_intent_data: {
              statement_descriptor_suffix: 'SAHELAGRICONN',
              description: `Sahel AgriConnect — ${productName}`,
            },
            metadata: { tierKey: tierKey || 'cooperative', email },
            success_url:
              successUrl
              || `${process.env.FRONTEND_URL || ''}/cooperative-registration?payment=success`,
            cancel_url:
              cancelUrl
              || `${process.env.FRONTEND_URL || ''}/cooperative-registration?payment=cancelled`,
          }
        : {
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email,
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  recurring: {
                    interval: billingInterval === 'year' ? 'year' : 'month',
                  },
                  product_data: {
                    name: productName,
                    description: `Sahel AgriConnect Platform — ${productName}`,
                    images: ['https://sahelagriconnect.com/sahel-logo.png'],
                  },
                  unit_amount: amountCents,
                },
                quantity: 1,
              },
            ],
            payment_intent_data: {
              statement_descriptor_suffix: 'SAHELAGRICONN',
              description: `Sahel AgriConnect — ${productName}`,
            },
            metadata: { tierKey: tierKey || '', email },
            success_url:
              successUrl || `${process.env.FRONTEND_URL || ''}/pricing?success=true`,
            cancel_url:
              cancelUrl || `${process.env.FRONTEND_URL || ''}/pricing?cancelled=true`,
          }
    );
    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (e) {
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
        const amountDeployed =
          Number(amountUSD) || (session.amount_total || 0) / 100;
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
        ].join('; ');

        let investment = await Investment.findOne({
          adminNotes: { $regex: session.id },
        });
        let investmentCreated = false;

        if (!investment && investorEmailLower && amountDeployed > 0 && oppId) {
          investment = await Investment.create({
            investorId: investor?._id,
            investorName: investorName || investor?.fullName || '',
            investorEmail: investorEmailLower,
            opportunityId: opp._id,
            opportunityName: opportunityName || opp?.centerName || '',
            track,
            commodity: opp?.commodity || '',
            amountDeployed,
            currency: 'USD',
            deploymentDate,
            expectedROIPercent,
            payoutSchedule: buildPayoutSchedule({
              amountDeployed,
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
            amount: amountDeployed,
            sessionId: session.id,
          });
        } else if (investment) {
          console.log('AfriYield investment already recorded:', session.id);
        }

        if (investmentCreated && investment && opp) {
          const updatedOpp = await Opportunity.findByIdAndUpdate(
            opp._id,
            {
              $inc: { amountRaised: amountDeployed },
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
            recipientEmail: process.env.ADMIN_EMAIL || 'contact@djiguicorporation.org',
            message:
              `✅ AfriYield investment paid (Stripe): ${investment.investorName || investorEmailLower} `
              + `(${investorEmailLower}) — $${amountDeployed.toLocaleString()} USD in `
              + `${investment.opportunityName || opportunityName || oppId}. `
              + `Session: ${session.id}`,
            source: 'afriyield_stripe_investment',
            channel: 'email',
            status: 'pending',
          });

          confirmAfriYieldInvestmentPayment({
            investorEmail: investorEmailLower,
            investorName: investment.investorName,
            opportunityName: investment.opportunityName,
            amountUSD: amountDeployed,
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
              `${process.env.BACKEND_URL || 'http://localhost:3001'}`
                + '/api/kyc/mark-payment-verified',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  investorEmail: investorEmailLower,
                  stripeSessionId: session.id,
                }),
              }
            );
          }
        }
      }

      // ── Cooperative annual membership ───────────────────────
      if (session.metadata?.tierKey === 'cooperative' && email) {
        await CooperativePlatformRegistration.findOneAndUpdate(
          { email: String(email).toLowerCase().trim() },
          {
            paymentReceived: true,
            paymentDate: new Date(),
            paymentMethod: 'stripe',
            status: 'active',
            activatedAt: new Date(),
          },
          { sort: { createdAt: -1 } }
        );
        console.log('✅ Cooperative membership payment:', email);
      }

      // ── Subscription payment (existing logic) ─────────────────
      else if (email) {
        await PremiumSubscription.findOneAndUpdate(
          { investorEmail: email },
          {
            investorEmail: email,
            plan: 'monthly',
            priceUSD: (session.amount_total || 0) / 100,
            status: 'active',
            paymentMethod: 'stripe',
            paymentReference: session.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          { upsert: true, new: true }
        );
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
        process.env.STRIPE_INVESTMENT_SUCCESS_URL ||
        `${process.env.FRONTEND_URL}/invest/success?session_id={CHECKOUT_SESSION_ID}&opp=${opportunityId}`,
      cancel_url:
        process.env.STRIPE_INVESTMENT_CANCEL_URL ||
        `${process.env.FRONTEND_URL}/invest/${opportunityId}?cancelled=true`,
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
