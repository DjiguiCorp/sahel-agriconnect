import { createRequire } from 'module';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Farmer from '../models/Farmer.js';
import CooperativeJoinRequest from '../models/CooperativeJoinRequest.js';

const require = createRequire(import.meta.url);

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  const { Resend } = require('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND = (process.env.FRONTEND_URL || 'https://sahelagriconnect.com').replace(/\/$/, '');

/**
 * Platform-verified members for Growth unlock:
 * - Farmers linked to the coop with emailVerified: true
 * - Approved CooperativeJoinRequests
 * Deduplicated by farmerId (a farmer may appear in both).
 */
export async function getVerifiedMemberCount(cooperativeId) {
  if (!cooperativeId) return 0;
  const [verifiedFarmers, approvedJoins] = await Promise.all([
    Farmer.find({ cooperativeId, emailVerified: true }).select('_id').lean(),
    CooperativeJoinRequest.find({ cooperativeId, status: 'approved' })
      .select('farmerId')
      .lean(),
  ]);
  const ids = new Set();
  for (const f of verifiedFarmers) {
    if (f?._id) ids.add(String(f._id));
  }
  for (const j of approvedJoins) {
    if (j?.farmerId) ids.add(String(j.farmerId));
  }
  return ids.size;
}

/** Path A — full unlock */
export const GROWTH_MIN_VERIFIED_MEMBERS = 51;
/** Path B — grace unlock thresholds */
export const GROWTH_PATH_B_DECLARED = 51;
export const GROWTH_PATH_B_VERIFIED = 10;
/** AfriYield unlock while on Path B grace */
export const AFRIYIELD_UNLOCK_VERIFIED = 25;

export const GROWTH_GATE_ERROR_FR =
  'Vous devez avoir 51 membres vérifiés, ou 51 déclarés avec au moins 10 vérifiés, pour accéder au plan Croissance.';

export function evaluateGrowthPaths({ verifiedCount = 0, declaredCount = 0 }) {
  const verified = Number(verifiedCount) || 0;
  const declared = Number(declaredCount) || 0;
  const pathA = verified >= GROWTH_MIN_VERIFIED_MEMBERS;
  const pathB = declared >= GROWTH_PATH_B_DECLARED && verified >= GROWTH_PATH_B_VERIFIED;
  return {
    pathA,
    pathB,
    eligible: pathA || pathB,
    verifiedCount: verified,
    declaredCount: declared,
  };
}

/** AfriYield unlocked only on Growth without provisional Path B lock */
export function isAfriYieldUnlocked(coop) {
  if (!coop) return false;
  const tier = coop.tier || coop.subscriptionPlan;
  if (tier !== 'growth') return false;
  return !Boolean(coop.pendingFullVerification);
}

/**
 * Clear Path B provisional lock once verified members reach 25.
 * Also syncs afriyieldEligible accordingly.
 */
export async function syncPendingFullVerification(cooperativeId, verifiedCountOpt) {
  if (!cooperativeId) return null;
  const coop = await CooperativePlatformRegistration.findById(cooperativeId);
  if (!coop) return null;

  const verifiedCount =
    verifiedCountOpt != null
      ? Number(verifiedCountOpt)
      : await getVerifiedMemberCount(cooperativeId);

  let changed = false;
  if (coop.pendingFullVerification && verifiedCount >= AFRIYIELD_UNLOCK_VERIFIED) {
    coop.pendingFullVerification = false;
    coop.gracePeriodStartDate = undefined;
    coop.afriyieldEligible = true;
    changed = true;
  } else if (coop.tier === 'growth' && !coop.pendingFullVerification && !coop.afriyieldEligible) {
    coop.afriyieldEligible = true;
    changed = true;
  } else if (coop.pendingFullVerification && coop.afriyieldEligible) {
    coop.afriyieldEligible = false;
    changed = true;
  }

  if (changed) await coop.save();
  return {
    coop,
    verifiedCount,
    pendingFullVerification: Boolean(coop.pendingFullVerification),
    afriyieldUnlocked: isAfriYieldUnlocked(coop),
  };
}

/**
 * Resolve coop + hybrid Path A/B eligibility; used to gate Growth Stripe checkout.
 */
export async function assertCoopGrowthCheckoutAllowed({ email, cooperativeId }) {
  let coop = null;
  if (cooperativeId) {
    coop = await CooperativePlatformRegistration.findById(cooperativeId);
  }
  if (!coop && email) {
    const emailNorm = String(email).toLowerCase().trim();
    coop = await CooperativePlatformRegistration.findOne({ email: emailNorm }).sort({
      createdAt: -1,
    });
  }
  if (!coop) {
    return {
      ok: false,
      status: 404,
      error: 'Cooperative not found for Growth checkout.',
      errorCode: 'NOT_FOUND',
      verifiedMemberCount: 0,
      verifiedCount: 0,
      declaredCount: 0,
    };
  }

  const verifiedCount = await getVerifiedMemberCount(coop._id);
  const declaredCount = Number(coop.memberCount) || 0;
  const { pathA, pathB, eligible } = evaluateGrowthPaths({ verifiedCount, declaredCount });

  if (!eligible) {
    return {
      ok: false,
      status: 403,
      error: 'NOT_ELIGIBLE',
      errorCode: 'NOT_ELIGIBLE',
      errorFr: GROWTH_GATE_ERROR_FR,
      verifiedMemberCount: verifiedCount,
      verifiedCount,
      declaredCount,
      requiredVerified: GROWTH_MIN_VERIFIED_MEMBERS,
      requiredDeclaredForPathB: GROWTH_PATH_B_DECLARED,
      requiredVerifiedForPathB: GROWTH_PATH_B_VERIFIED,
      cooperativeId: String(coop._id),
    };
  }

  if (!pathA && pathB) {
    coop.pendingFullVerification = true;
    coop.gracePeriodStartDate = new Date();
    coop.afriyieldEligible = false;
    await coop.save();
  } else if (pathA) {
    coop.pendingFullVerification = false;
    coop.gracePeriodStartDate = undefined;
    coop.afriyieldEligible = true;
    await coop.save();
  }

  return {
    ok: true,
    verifiedMemberCount: verifiedCount,
    verifiedCount,
    declaredCount,
    pathA,
    pathB,
    pendingFullVerification: Boolean(coop.pendingFullVerification),
    cooperativeId: String(coop._id),
    coop: coop.toObject(),
  };
}

/**
 * After membership changes, if Path A or Path B is met while still on starter,
 * auto-upgrade to growth + pending_payment and email the leader.
 */
export async function maybeUpgradeCoopAt51(coopId) {
  if (!coopId) return null;

  const updatedCoop = await CooperativePlatformRegistration.findById(coopId);
  if (!updatedCoop) return null;
  if (updatedCoop.tier !== 'starter') {
    await syncPendingFullVerification(coopId);
    return null;
  }

  const verifiedCount = await getVerifiedMemberCount(coopId);
  const declaredCount = Number(updatedCoop.memberCount) || 0;
  const { pathA, pathB, eligible } = evaluateGrowthPaths({ verifiedCount, declaredCount });
  if (!eligible) return null;

  const isGrace = !pathA && pathB;
  await CooperativePlatformRegistration.findByIdAndUpdate(coopId, {
    tier: 'growth',
    status: 'pending_payment',
    certificationEligible: true,
    exportEligible: true,
    afriyieldEligible: !isGrace,
    pendingFullVerification: isGrace,
    ...(isGrace ? { gracePeriodStartDate: new Date() } : { gracePeriodStartDate: null }),
  });

  const fresh = await CooperativePlatformRegistration.findById(coopId);
  await sendGrowthUpgradePromptEmail(fresh).catch((err) =>
    console.error('[coopMemberUpgrade] email failed:', err.message)
  );
  return fresh;
}

export async function sendGrowthUpgradePromptEmail(coop) {
  const resend = getResend();
  if (!resend || !coop?.email) return;

  const name = coop.leaderName || coop.cooperativeName || '';
  const upgradeUrl = `${FRONTEND}/cooperative-upgrade`;
  const provisional = Boolean(coop.pendingFullVerification);

  await resend.emails.send({
    from: FROM,
    to: coop.email,
    subject: provisional
      ? 'Accès provisoire Croissance / Provisional Growth access'
      : 'Votre coopérative a atteint 51 membres / Your cooperative has reached 51 members',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#B5850A;margin:0;">Sahel AgriConnect</h1>
          <p style="color:white;margin:8px 0 0;">${
            provisional ? 'Accès provisoire Croissance' : '51 membres atteints 🎉'
          }</p>
        </div>
        <div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>
            Félicitations — <strong>${coop.cooperativeName || ''}</strong> est éligible au plan
            <strong>Croissance (Growth)</strong>.
          </p>
          ${
            provisional
              ? `<p style="color:#92400e;background:#fffbeb;border:1px solid #fbbf24;padding:12px;border-radius:8px;">
                   Accès provisoire : AfriYield se débloque à <strong>25 membres vérifiés</strong>.
                 </p>`
              : ''
          }
          <div style="margin-top:24px;text-align:center;">
            <a href="${upgradeUrl}"
              style="background:#B5850A;color:white;padding:12px 24px;border-radius:6px;
                text-decoration:none;font-weight:bold;display:inline-block;">
              Mettre à niveau / Upgrade →
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendJoinRequestToLeaderEmail({
  leaderEmail,
  leaderName,
  cooperativeName,
  farmerName,
  farmerRegion,
  farmerCrops,
  message,
}) {
  const resend = getResend();
  if (!resend || !leaderEmail) return;

  const crops = Array.isArray(farmerCrops) ? farmerCrops.join(', ') : farmerCrops || '—';

  await resend.emails.send({
    from: FROM,
    to: leaderEmail,
    subject: "Nouvelle demande d'adhésion / New join request",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:18px;">Sahel AgriConnect</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <p>Bonjour ${leaderName || ''},</p>
          <p>
            <strong>${farmerName || 'Un agriculteur'}</strong> souhaite rejoindre
            <strong>${cooperativeName || 'votre coopérative'}</strong>.
          </p>
          <p style="color:#555;font-size:14px;">
            <strong>${farmerName || 'A farmer'}</strong> wants to join
            <strong>${cooperativeName || 'your cooperative'}</strong>.
          </p>
          <table style="width:100%;margin:16px 0;font-size:14px;">
            <tr><td style="padding:6px 0;color:#666;">Région / Region</td><td>${farmerRegion || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Cultures / Crops</td><td>${crops}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Message</td><td>${message || '—'}</td></tr>
          </table>
          <p style="font-size:14px;color:#555;">
            Connectez-vous au portail coopérative pour approuver ou refuser.
            / Sign in to the cooperative portal to approve or decline.
          </p>
          <a href="${FRONTEND}/cooperative-portal"
            style="display:inline-block;margin-top:12px;background:#1a3c2e;color:white;
              padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Ouvrir le portail / Open portal
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendJoinRequestOutcomeEmail({
  farmerEmail,
  farmerName,
  cooperativeName,
  approved,
}) {
  const resend = getResend();
  if (!resend || !farmerEmail) return;

  const subject = approved
    ? `Demande acceptée — ${cooperativeName} / Join request approved`
    : `Demande refusée — ${cooperativeName} / Join request declined`;

  await resend.emails.send({
    from: FROM,
    to: farmerEmail,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:18px;">Sahel AgriConnect</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <p>Bonjour ${farmerName || ''},</p>
          ${
            approved
              ? `<p>Votre demande d'adhésion à <strong>${cooperativeName}</strong> a été <strong>acceptée</strong>.</p>
                 <p style="color:#555;">Your join request to <strong>${cooperativeName}</strong> was <strong>approved</strong>.</p>`
              : `<p>Votre demande d'adhésion à <strong>${cooperativeName}</strong> a été <strong>refusée</strong>.</p>
                 <p style="color:#555;">Your join request to <strong>${cooperativeName}</strong> was <strong>declined</strong>.</p>`
          }
        </div>
      </div>
    `,
  });
}

/** Notify coop leader that admin flagged their account for review */
export async function sendCoopFlaggedEmail(coop) {
  const resend = getResend();
  if (!resend || !coop?.email) return;
  await resend.emails.send({
    from: FROM,
    to: coop.email,
    subject: 'Compte coopérative en révision / Cooperative account under review',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#7f1d1d;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:18px;">Sahel AgriConnect</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <p>Bonjour ${coop.leaderName || ''},</p>
          <p>Le compte de <strong>${coop.cooperativeName || ''}</strong> est <strong>en cours de révision</strong>.</p>
          <p style="color:#555;">Your cooperative account is <strong>under review</strong>.</p>
          <p style="color:#555;font-size:14px;">
            Contactez <a href="mailto:support@sahelagriconnect.com">support@sahelagriconnect.com</a>
            pour plus d'informations.
          </p>
        </div>
      </div>
    `,
  });
}
