import { createRequire } from 'module';
import Investor from '../models/Investor.js';
import InvestorKYC from '../models/InvestorKYC.js';
import PremiumSubscription from '../models/PremiumSubscription.js';

const require = createRequire(import.meta.url);

let resendSingleton = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set — trading approval emails disabled');
    return null;
  }
  if (!resendSingleton) {
    const { Resend } = require('resend');
    resendSingleton = new Resend(process.env.RESEND_API_KEY);
  }
  return resendSingleton;
}

const AFRIYIELD_FROM =
  process.env.AFRIYIELD_FROM_EMAIL ||
  'AfriYield Exchange <noreply@sahelagriconnect.com>';

const FRONTEND = (process.env.FRONTEND_URL || 'https://sahelagriconnect.com').replace(
  /\/$/,
  ''
);

/** Statuses that mean KYC was submitted (or already approved) for review */
const KYC_SUBMITTED_STATUSES = new Set([
  'submitted',
  'approved',
  'pending_review',
  'pending_kyc',
  'african_pending_review',
]);

const FR_COUNTRY_HINTS = [
  'france',
  'senegal',
  'côte d\'ivoire',
  'cote d\'ivoire',
  'cote divoire',
  'mali',
  'burkina',
  'niger',
  'togo',
  'benin',
  'bénin',
  'guinea',
  'guinée',
  'cameroon',
  'cameroun',
  'chad',
  'tchad',
  'congo',
  'gabon',
  'madagascar',
  'haiti',
  'haïti',
  'belgium',
  'belgique',
  'luxembourg',
  'switzerland',
  'suisse',
  'rwanda',
  'djibouti',
  'comoros',
  'comores',
];

function firstNameFromInvestor(investor) {
  const name = String(investor?.fullName || '').trim();
  if (!name) return 'Investor';
  return name.split(/\s+/)[0];
}

/**
 * EN by default; FR when preferredLanguage is fr or country looks francophone.
 */
export function resolveTradingEmailLang(investor) {
  const pref = String(investor?.preferredLanguage || '')
    .trim()
    .toLowerCase();
  if (pref.startsWith('fr')) return 'fr';
  if (pref.startsWith('en')) return 'en';
  const c = String(investor?.countryOfResidence || '').toLowerCase();
  if (FR_COUNTRY_HINTS.some((h) => c.includes(h))) return 'fr';
  return 'en';
}

async function isSubscriptionActive(email) {
  const emailNorm = String(email || '')
    .toLowerCase()
    .trim();
  if (!emailNorm) return false;
  const sub = await PremiumSubscription.findOne({
    investorEmail: emailNorm,
    status: 'active',
  })
    .sort({ endDate: -1 })
    .lean();
  if (!sub) return false;
  if (sub.endDate && new Date(sub.endDate) < new Date()) return false;
  return true;
}

function isKycSubmitted(kyc) {
  if (!kyc) return false;
  if (KYC_SUBMITTED_STATUSES.has(String(kyc.status || ''))) return true;
  if (kyc.submittedAt) return true;
  if (String(kyc.diditStatus || '') === 'approved') return true;
  return false;
}

/**
 * Dual-write Investor + InvestorKYC so portal gates (KYC.tradingApproved) stay in sync.
 */
async function applyTradingApproved(investor, approvedBy = 'system') {
  const now = new Date();
  investor.tradingApproved = true;
  investor.tradingApprovedAt = now;
  investor.tradingApprovedBy = approvedBy;
  await investor.save();

  const emailNorm = String(investor.email || '')
    .toLowerCase()
    .trim();
  await InvestorKYC.findOneAndUpdate(
    { investorEmail: emailNorm },
    {
      $set: {
        tradingApproved: true,
        tradingApprovedAt: now,
        tradingApprovedBy: approvedBy,
      },
    },
    { upsert: false }
  );
}

export async function sendTradingApprovedEmail(investor) {
  const resend = getResend();
  if (!resend || !investor?.email) return;

  const lang = resolveTradingEmailLang(investor);
  const firstName = firstNameFromInvestor(investor);
  const investUrl = `${FRONTEND}/invest`;

  const subject =
    lang === 'fr'
      ? 'Votre accès trading AfriYield est maintenant actif'
      : 'Your AfriYield trading access is now active';

  const body =
    lang === 'fr'
      ? `Félicitations ${firstName}, votre vérification KYC et votre abonnement sont confirmés. Vous avez maintenant accès complet pour investir dans les opportunités AfriYield sur sahelagriconnect.com/invest`
      : `Congratulations ${firstName}, your KYC verification and subscription are confirmed. You now have full access to invest in AfriYield opportunities at sahelagriconnect.com/invest`;

  await resend.emails.send({
    from: AFRIYIELD_FROM,
    to: investor.email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#B5850A;margin:0;font-size:20px;">AfriYield Exchange</h1>
        </div>
        <div style="padding:32px;background:white;border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;line-height:1.7;">${body}</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${investUrl}" style="display:inline-block;background:#B5850A;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;">
              ${lang === 'fr' ? 'Voir les opportunités' : 'Browse opportunities'}
            </a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendTradingSuspendedEmail(investor) {
  const resend = getResend();
  if (!resend || !investor?.email) return;

  const lang = resolveTradingEmailLang(investor);
  const subject =
    lang === 'fr'
      ? 'Accès trading AfriYield suspendu'
      : 'AfriYield trading access suspended';
  const body =
    lang === 'fr'
      ? 'Votre accès trading AfriYield a été suspendu en attente d’un examen complémentaire. Veuillez contacter support@sahelagriconnect.com'
      : 'Your AfriYield trading access has been suspended pending additional review. Please contact support@sahelagriconnect.com';

  await resend.emails.send({
    from: AFRIYIELD_FROM,
    to: investor.email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#B5850A;margin:0;font-size:20px;">AfriYield Exchange</h1>
        </div>
        <div style="padding:32px;background:white;border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;line-height:1.7;">${body}</p>
        </div>
      </div>
    `,
  });
}

/**
 * Auto-approve trading when KYC is submitted/approved and $99 subscription is active.
 * Respects admin revoke (tradingRevoked). Dual-writes Investor + InvestorKYC.
 */
export async function checkAndApproveTradingAccess(investorEmail) {
  const emailNorm = String(investorEmail || '')
    .toLowerCase()
    .trim();
  if (!emailNorm) return;

  const [investor, kyc] = await Promise.all([
    Investor.findOne({ email: emailNorm }),
    InvestorKYC.findOne({ investorEmail: emailNorm }),
  ]);

  if (!investor || !kyc) return;

  // Do not override if admin has manually revoked
  if (investor.tradingRevoked === true) return;

  const kycSubmitted = isKycSubmitted(kyc);
  const subscriptionActive = await isSubscriptionActive(emailNorm);

  if (kycSubmitted && subscriptionActive && !investor.tradingApproved) {
    await applyTradingApproved(investor, 'system');
    try {
      await sendTradingApprovedEmail(investor);
    } catch (e) {
      console.error('[investorApproval] approval email failed:', e.message);
    }
  }
}

/**
 * Admin revoke — blocks auto-approve until restore.
 */
export async function revokeTradingAccess(investorEmail, adminEmail) {
  const emailNorm = String(investorEmail || '')
    .toLowerCase()
    .trim();
  const investor = await Investor.findOne({ email: emailNorm });
  if (!investor) return null;

  const now = new Date();
  investor.tradingRevoked = true;
  investor.tradingApproved = false;
  investor.tradingRevokedAt = now;
  investor.tradingRevokedBy = String(adminEmail || 'admin').toLowerCase();
  await investor.save();

  await InvestorKYC.findOneAndUpdate(
    { investorEmail: emailNorm },
    { $set: { tradingApproved: false } },
    { upsert: false }
  );

  try {
    await sendTradingSuspendedEmail(investor);
  } catch (e) {
    console.error('[investorApproval] suspension email failed:', e.message);
  }

  return investor;
}

/**
 * Admin restore / manual approve — clears revoke and grants access.
 */
export async function restoreTradingAccess(investorEmail, adminEmail) {
  const emailNorm = String(investorEmail || '')
    .toLowerCase()
    .trim();
  const investor = await Investor.findOne({ email: emailNorm });
  if (!investor) return null;

  investor.tradingRevoked = false;
  investor.tradingRevokedAt = undefined;
  investor.tradingRevokedBy = undefined;
  investor.tradingApproved = true;
  investor.tradingApprovedAt = new Date();
  investor.tradingApprovedBy = String(adminEmail || 'admin').toLowerCase();
  await investor.save();

  await InvestorKYC.findOneAndUpdate(
    { investorEmail: emailNorm },
    {
      $set: {
        tradingApproved: true,
        tradingApprovedAt: investor.tradingApprovedAt,
        tradingApprovedBy: investor.tradingApprovedBy,
      },
    },
    { upsert: false }
  );

  try {
    await sendTradingApprovedEmail(investor);
  } catch (e) {
    console.error('[investorApproval] restore email failed:', e.message);
  }

  return investor;
}

/**
 * One-time / startup backfill for investors who already qualify.
 */
export async function backfillTradingApproval() {
  const investors = await Investor.find({
    tradingApproved: false,
    tradingRevoked: { $ne: true },
  });
  for (const investor of investors) {
    await checkAndApproveTradingAccess(investor.email);
  }
  console.log(
    `[investorApproval] backfill complete: scanned=${investors.length}`
  );
  return { scanned: investors.length };
}
