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

export const GROWTH_MIN_VERIFIED_MEMBERS = 51;

export const GROWTH_GATE_ERROR_FR =
  'Vous devez avoir 51 membres vérifiés pour accéder au plan Croissance.';

/**
 * Resolve coop + verified count; used to gate Growth Stripe checkout.
 */
export async function assertCoopGrowthCheckoutAllowed({ email, cooperativeId }) {
  let coop = null;
  if (cooperativeId) {
    coop = await CooperativePlatformRegistration.findById(cooperativeId).lean();
  }
  if (!coop && email) {
    const emailNorm = String(email).toLowerCase().trim();
    coop = await CooperativePlatformRegistration.findOne({ email: emailNorm })
      .sort({ createdAt: -1 })
      .lean();
  }
  if (!coop) {
    return {
      ok: false,
      status: 404,
      error: 'Cooperative not found for Growth checkout.',
      verifiedMemberCount: 0,
    };
  }
  const verifiedMemberCount = await getVerifiedMemberCount(coop._id);
  if (verifiedMemberCount < GROWTH_MIN_VERIFIED_MEMBERS) {
    return {
      ok: false,
      status: 403,
      error: GROWTH_GATE_ERROR_FR,
      verifiedMemberCount,
      cooperativeId: String(coop._id),
    };
  }
  return {
    ok: true,
    verifiedMemberCount,
    cooperativeId: String(coop._id),
    coop,
  };
}

/**
 * After membership changes, if verified count hits 51 while still on starter,
 * auto-upgrade to growth + pending_payment and email the leader.
 */
export async function maybeUpgradeCoopAt51(coopId) {
  if (!coopId) return null;

  const updatedCoop = await CooperativePlatformRegistration.findById(coopId);
  if (!updatedCoop) return null;
  if (updatedCoop.tier !== 'starter') return null;

  const verifiedCount = await getVerifiedMemberCount(coopId);
  if (verifiedCount < 51) return null;

  await CooperativePlatformRegistration.findByIdAndUpdate(coopId, {
    tier: 'growth',
    status: 'pending_payment',
    certificationEligible: true,
    afriyieldEligible: true,
    exportEligible: true,
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

  await resend.emails.send({
    from: FROM,
    to: coop.email,
    subject:
      'Votre coopérative a atteint 51 membres / Your cooperative has reached 51 members',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#B5850A;margin:0;">Sahel AgriConnect</h1>
          <p style="color:white;margin:8px 0 0;">51 membres atteints 🎉</p>
        </div>
        <div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>
            Félicitations — <strong>${coop.cooperativeName || ''}</strong> a atteint
            <strong>51 membres vérifiés</strong> sur la plateforme. Votre plan passe au niveau
            <strong>Croissance (Growth)</strong>.
          </p>
          <p style="color:#555;font-size:14px;">
            Congratulations — your cooperative has reached <strong>51 verified members</strong>.
            Your plan is now eligible for the <strong>Growth</strong> tier.
          </p>
          <div style="background:#fffbeb;border:1px solid #B5850A;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 8px;font-weight:bold;color:#92400e;">Débloquez / Unlock:</p>
            <ul style="margin:0;padding-left:18px;color:#78350f;font-size:14px;">
              <li>Formations / Training</li>
              <li>AfriYield Exchange</li>
              <li>Certification</li>
              <li>Export readiness</li>
            </ul>
          </div>
          <p style="color:#555;font-size:14px;">
            Activez l'abonnement Growth ($199/an) pour conserver l'accès au portail et débloquer ces fonctionnalités.
            <br/>Activate Growth ($199/year) to keep portal access and unlock these features.
          </p>
          <div style="margin-top:24px;text-align:center;">
            <a href="${upgradeUrl}"
              style="background:#B5850A;color:white;padding:12px 24px;border-radius:6px;
                text-decoration:none;font-weight:bold;display:inline-block;">
              Mettre à niveau / Upgrade →
            </a>
          </div>
          <p style="color:#999;font-size:12px;margin-top:16px;text-align:center;">
            ${upgradeUrl}
          </p>
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
