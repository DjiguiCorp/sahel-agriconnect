import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  const { Resend } = require('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN = process.env.ADMIN_EMAIL || 'admin@sahelagriconnect.com';
const FRONTEND = process.env.FRONTEND_URL || 'https://afriyieldexchange.com';

// ── Investor: KYC submission confirmation ────────────────────
export async function sendKYCSubmissionConfirmation({
  email, name, country, category, reviewHours, status,
}) {
  const resend = getResend();
  if (!resend) return;

  const isAfrican = category === 'african';
  const isDiaspora = category === 'diaspora';

  const subject = isAfrican
    ? `✅ KYC Received — AfriYield Exchange (${country})`
    : `📋 KYC Under Review — AfriYield Exchange (${reviewHours}h)`;

  const bodyHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0A1628;padding:28px;border-radius:8px 8px 0 0;">
        <h1 style="color:#B5850A;margin:0;font-size:22px;">
          AfriYield Exchange
        </h1>
        <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">
          KYC Verification — ${country}
        </p>
      </div>
      <div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;">
        <p style="color:#333;font-size:16px;">Hello ${name},</p>

        ${isAfrican ? `
        <div style="background:#f0fdf4;border:1px solid #22c55e;
          border-radius:8px;padding:16px;margin:16px 0;">
          <p style="color:#15803d;font-weight:bold;margin:0 0 8px;">
            ✅ Your access is fully active
          </p>
          <p style="color:#166534;margin:0;font-size:14px;">
            As a verified African investor, your payment grants you
            immediate full access to all AfriYield opportunities.
            Your KYC is being reviewed in the background — this will
            not interrupt your investment activity.
          </p>
        </div>
        <p style="color:#555;font-size:14px;">
          <strong>What happens next:</strong><br/>
          • Our compliance team will review your KYC within
            ${reviewHours} hours<br/>
          • You will receive a notification confirming approval<br/>
          • If additional documents are needed, we will contact you
        </p>
        ` : `
        <div style="background:#fffbeb;border:1px solid #B5850A;
          border-radius:8px;padding:16px;margin:16px 0;">
          <p style="color:#92400e;font-weight:bold;margin:0 0 8px;">
            ⏳ KYC under review — ${reviewHours} hours
          </p>
          <p style="color:#92400e;margin:0;font-size:14px;">
            Your KYC verification is being processed. You will be
            notified by email once approved. After approval, you
            can proceed to invest via secure Stripe payment.
          </p>
        </div>
        <p style="color:#555;font-size:14px;">
          <strong>Review checklist:</strong><br/>
          • Identity verification: submitted ✓<br/>
          • Address verification: submitted ✓<br/>
          • ${isDiaspora ? 'Regulatory declaration: submitted ✓<br/>' : ''}
          • Photo ID: ${isDiaspora
            ? 'Will be requested by email if needed' : 'Required'}
        </p>
        `}

        <p style="color:#555;font-size:14px;margin-top:20px;">
          Questions? Reply to this email or contact us at
          <a href="mailto:compliance@sahelagriconnect.com"
            style="color:#B5850A;">
            compliance@sahelagriconnect.com
          </a>
        </p>

        <div style="margin-top:24px;">
          <a href="${FRONTEND}/afri-yield/portal"
            style="background:#B5850A;color:white;padding:12px 24px;
              border-radius:6px;text-decoration:none;
              font-weight:bold;font-size:14px;">
            ${isAfrican
              ? 'Go to My Investor Portal'
              : 'Check My KYC Status'}
          </a>
        </div>
      </div>
      <div style="padding:16px;text-align:center;
        background:#f0f0f0;border-radius:0 0 8px 8px;">
        <p style="color:#999;font-size:11px;margin:0;">
          Sahel AgriConnect · AfriYield Exchange ·
          <a href="${FRONTEND}/privacy" style="color:#B5850A;">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: FROM, to: email, subject, html: bodyHtml,
  });
}

// ── Investor: KYC Approved ───────────────────────────────────
export async function sendKYCApproved({ email, name, category }) {
  const resend = getResend();
  if (!resend) return;

  const isAfrican = category === 'african';

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '🎉 KYC Approved — You can now invest on AfriYield',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;
        margin:0 auto;">
        <div style="background:#0A1628;padding:28px;
          border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:22px;">
            AfriYield Exchange
          </h1>
        </div>
        <div style="padding:28px;background:#f9f9f9;
          border:1px solid #e0e0e0;">
          <div style="background:#f0fdf4;border:1px solid #22c55e;
            border-radius:8px;padding:20px;margin-bottom:20px;
            text-align:center;">
            <p style="font-size:36px;margin:0;">🎉</p>
            <h2 style="color:#15803d;margin:8px 0;">
              KYC Approved!
            </h2>
            <p style="color:#166534;margin:0;">
              ${name}, your identity has been verified.
            </p>
          </div>
          <p style="color:#555;font-size:14px;">
            ${isAfrican
              ? 'Your background verification is complete. Your investment account remains fully active.'
              : 'Your KYC is complete. You can now browse investment opportunities and invest via secure Stripe payment.'}
          </p>
          <div style="margin-top:24px;">
            <a href="${FRONTEND}/afri-yield/opportunities"
              style="background:#B5850A;color:white;
                padding:12px 24px;border-radius:6px;
                text-decoration:none;font-weight:bold;">
              Browse Investment Opportunities
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

// ── Investor: KYC Rejected ───────────────────────────────────
export async function sendKYCRejected({ email, name, reason }) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '⚠️ KYC Verification — Action Required',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;
        margin:0 auto;">
        <div style="background:#0A1628;padding:28px;
          border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:22px;">
            AfriYield Exchange
          </h1>
        </div>
        <div style="padding:28px;background:#f9f9f9;
          border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;">Hello ${name},</p>
          <div style="background:#fef2f2;border:1px solid #ef4444;
            border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#dc2626;font-weight:bold;margin:0 0 8px;">
              ⚠️ KYC verification could not be completed
            </p>
            <p style="color:#991b1b;margin:0;font-size:14px;">
              <strong>Reason:</strong> ${reason || 'Additional review required'}
            </p>
          </div>
          <p style="color:#555;font-size:14px;">
            Please contact our compliance team to resolve this:
            <a href="mailto:compliance@sahelagriconnect.com"
              style="color:#B5850A;">
              compliance@sahelagriconnect.com
            </a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Investor: Additional Documents Requested ─────────────────
export async function sendKYCAdditionalDocs({
  email, name, docsRequired,
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '📎 Documents Required — AfriYield KYC',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;
        margin:0 auto;">
        <div style="background:#0A1628;padding:28px;
          border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:22px;">
            AfriYield Exchange
          </h1>
        </div>
        <div style="padding:28px;background:#f9f9f9;
          border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;">Hello ${name},</p>
          <div style="background:#fffbeb;border:1px solid #B5850A;
            border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#92400e;font-weight:bold;margin:0 0 8px;">
              📎 Additional documents required
            </p>
            <p style="color:#92400e;margin:0;font-size:14px;">
              ${docsRequired}
            </p>
          </div>
          <p style="color:#555;font-size:14px;">
            Please reply to this email with the requested documents
            or send them to
            <a href="mailto:compliance@sahelagriconnect.com"
              style="color:#B5850A;">
              compliance@sahelagriconnect.com
            </a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Admin: New KYC Submission ────────────────────────────────
export async function notifyAdminKYCSubmission({
  email, name, country, category, status,
  isPEP, hasCriminalRecord, accreditedBasisUS,
}) {
  const resend = getResend();
  if (!resend) return;

  const urgency = isPEP || hasCriminalRecord
    ? '🚨 HIGH PRIORITY' : category === 'african'
      ? '📋 BACKGROUND REVIEW' : '⏳ STANDARD REVIEW';

  const flags = [];
  if (isPEP) flags.push('⚠️ PEP Declared');
  if (hasCriminalRecord) flags.push('⚠️ Criminal Record Declared');
  if (accreditedBasisUS === 'not_accredited') {
    flags.push('⚠️ Non-accredited US investor');
  }

  await resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `${urgency} — KYC Submitted: ${name} (${country})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;
        margin:0 auto;">
        <div style="background:#0A1628;padding:24px;
          border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:18px;">
            New KYC Submission — Review Required
          </h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;
          border:1px solid #e0e0e0;">
          ${flags.length ? `
          <div style="background:#fef2f2;border:1px solid #ef4444;
            border-radius:8px;padding:12px;margin-bottom:16px;">
            <p style="color:#dc2626;font-weight:bold;margin:0 0 6px;">
              🚨 FLAGS REQUIRING ATTENTION:
            </p>
            ${flags.map(f =>
              `<p style="color:#991b1b;margin:2px 0;
                font-size:13px;">${f}</p>`
            ).join('')}
          </div>
          ` : ''}
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;font-weight:bold;
              color:#333;width:40%;">Name</td>
              <td style="padding:6px 0;color:#555;">${name}</td></tr>
            <tr><td style="padding:6px 0;font-weight:bold;
              color:#333;">Email</td>
              <td style="padding:6px 0;color:#555;">${email}</td></tr>
            <tr><td style="padding:6px 0;font-weight:bold;
              color:#333;">Country</td>
              <td style="padding:6px 0;color:#555;">${country}</td></tr>
            <tr><td style="padding:6px 0;font-weight:bold;
              color:#333;">Category</td>
              <td style="padding:6px 0;
                color:${category === 'african' ? '#15803d'
                  : category === 'diaspora' ? '#1d4ed8'
                  : '#92400e'};
                font-weight:bold;text-transform:uppercase;">
                ${category}</td></tr>
            <tr><td style="padding:6px 0;font-weight:bold;
              color:#333;">Status</td>
              <td style="padding:6px 0;color:#555;">${status}</td></tr>
            <tr><td style="padding:6px 0;font-weight:bold;
              color:#333;">Review time</td>
              <td style="padding:6px 0;color:#B5850A;
                font-weight:bold;">
                ${category === 'diaspora' ? '24 hours' : '48-72 hours'}
              </td></tr>
          </table>
          <div style="margin-top:20px;display:flex;gap:12px;">
            <a href="${FRONTEND}/admin/central"
              style="background:#1a3c2e;color:white;
                padding:10px 20px;border-radius:6px;
                text-decoration:none;font-weight:bold;
                font-size:13px;">
              Review in Admin Dashboard
            </a>
            <a href="mailto:${email}"
              style="background:#B5850A;color:white;
                padding:10px 20px;border-radius:6px;
                text-decoration:none;font-weight:bold;
                font-size:13px;">
              Contact Investor
            </a>
          </div>
        </div>
      </div>
    `,
  });
}
