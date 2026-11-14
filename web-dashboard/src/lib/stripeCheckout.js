import { API_BASE_URL } from '../config/api';

/**
 * Stripe is available for ALL countries.
 * West African users pay via card just like diaspora users.
 * Orange Money and MTN MoMo are Phase 2 and not live yet.
 */
export function isStripeCheckoutAvailable(_country) {
  return true;
}

const TIER_DEFAULTS = {
  producer_pro: {
    tierName: 'Producer Pro',
    monthly: 29.99,
    annual: 299,
    successPath: '/my-dashboard?upgrade=success',
    cancelPath: '/my-dashboard?upgrade=cancelled',
  },
  cooperative: {
    tierName: 'Cooperative',
    monthly: null,
    annual: 199,
    successPath: '/cooperative-registration?payment=success',
    cancelPath: '/pricing?cancelled=cooperative',
  },
  cooperative_growth: {
    tierName: 'Growth Cooperative',
    monthly: null,
    annual: 199,
    successPath: '/cooperative-portal?upgrade=success',
    cancelPath: '/cooperative-upgrade?cancelled=1',
  },
  transformation: {
    tierName: 'Transformation Center',
    monthly: 109,
    annual: 1090,
    successPath: '/transformation-registration?payment=success',
    cancelPath: '/pricing?cancelled=transformation',
  },
  investor: {
    // AfriYield Exchange — annual access only ($99/year).
    // No fixed Stripe Price ID in code (dynamic price_data). If you create a
    // dashboard Price for AfriYield $99/year, replace price_data with that price ID
    // in backend/routes/payments.js create-session for tierKey === 'investor'.
    // FLAG: update Stripe Dashboard product/price to $99/year (interval: year).
    tierName: 'AfriYield Exchange',
    monthly: null,
    annual: 99,
    successPath: '/afri-yield/register?payment=success',
    cancelPath: '/pricing?cancelled=investor',
  },
};

/**
 * Create a Stripe Checkout session and redirect to Stripe.
 * @param {string} tierKey e.g. 'producer_pro'
 * @param {{ email?: string, billingInterval?: 'month'|'year', amountUsd?: number, tierName?: string, successUrl?: string, cancelUrl?: string }} [options]
 * @returns {Promise<{ url?: string, error?: string }>}
 */
export async function createCheckoutSession(tierKey, options = {}) {
  const defaults = TIER_DEFAULTS[tierKey] || {};
  // AfriYield investor is annual-only ($99/year) — never send a monthly interval.
  const billingInterval =
    options.billingInterval ||
    (defaults.monthly == null && defaults.annual != null ? 'year' : 'month');
  const amountUsd =
    options.amountUsd ??
    (billingInterval === 'year' ? defaults.annual : defaults.monthly) ??
    defaults.annual;

  if (!amountUsd) {
    return { error: 'Invalid amount' };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const body = {
    email: options.email || '',
    tierKey,
    tierName: options.tierName || defaults.tierName || tierKey,
    amountUsd,
    billingInterval,
    successUrl:
      options.successUrl ||
      `${origin}${defaults.successPath || '/pricing?payment=success'}`,
    cancelUrl:
      options.cancelUrl ||
      `${origin}${defaults.cancelPath || '/pricing?cancelled=1'}`,
    ...(options.memberCount != null ? { memberCount: options.memberCount } : {}),
    ...(options.cooperativeName ? { cooperativeName: options.cooperativeName } : {}),
    ...(options.metadata ? { metadata: options.metadata } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/api/payments/stripe/create-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (data?.url) {
    window.location.href = data.url;
    return { url: data.url };
  }
  return { error: data?.error || 'Payment session failed' };
}
