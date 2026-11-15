import { createRequire } from 'module';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';

const require = createRequire(import.meta.url);

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  const { Resend } = require('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND = (process.env.FRONTEND_URL || 'https://sahelagriconnect.com').replace(/\/$/, '');

/**
 * After memberCount is incremented, if the coop just hit 51 while still on starter,
 * auto-upgrade to growth + pending_payment and email the leader.
 * Returns the updated coop document (or null if no upgrade).
 */
export async function maybeUpgradeCoopAt51(coopId) {
  if (!coopId) return null;

  const updatedCoop = await CooperativePlatformRegistration.findById(coopId);
  if (!updatedCoop) return null;

  if (updatedCoop.memberCount === 51 && updatedCoop.tier === 'starter') {
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

  return null;
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
            <strong>51 membres</strong>. Votre plan passe au niveau
            <strong>Croissance (Growth)</strong>.
          </p>
          <p style="color:#555;font-size:14px;">
            Congratulations — your cooperative has reached <strong>51 members</strong>.
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
