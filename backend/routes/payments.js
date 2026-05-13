import express from 'express';
import Stripe from 'stripe';
import PremiumSubscription from '../models/PremiumSubscription.js';

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
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

const ORANGE_BASE = process.env.ORANGE_BASE_URL || 'https://api.orange.com';
const MTN_BASE = process.env.MTN_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const MTN_ENV = process.env.MTN_ENVIRONMENT || 'sandbox';

// ── Stripe: create checkout session ────────────────────────────
// POST /api/payments/stripe/create-session
// Body: { email, tierKey, tierName, amountUsd, successUrl, cancelUrl }
router.post('/stripe/create-session', async (req, res) => {
  try {
    if (!ensureStripeConfigured(res)) return;
    const { email, tierKey, tierName, amountUsd, successUrl, cancelUrl } = req.body || {};
    if (!email || !amountUsd) {
      return res.status(400).json({ success: false, error: 'email and amountUsd required' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: { interval: 'month' },
            product_data: {
              name: `Sahel AgriConnect — ${tierName || tierKey || 'Subscription'}`,
              description: `Monthly subscription to ${tierName || tierKey || 'plan'}`,
            },
            unit_amount: Math.round(Number(amountUsd) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { tierKey: tierKey || '', email },
      success_url:
        successUrl || `${process.env.FRONTEND_URL || ''}/pricing?success=true`,
      cancel_url:
        cancelUrl || `${process.env.FRONTEND_URL || ''}/pricing?cancelled=true`,
    });
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
      if (email) {
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
