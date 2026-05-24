import { createRequire } from 'module';
import { adminPanelLoginUrl } from '../utils/adminPanelUrl.js';

const require = createRequire(import.meta.url);

let resendSingleton = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set — email notifications disabled');
    return null;
  }
  if (!resendSingleton) {
    const { Resend } = require('resend');
    resendSingleton = new Resend(process.env.RESEND_API_KEY);
  }
  return resendSingleton;
}

const FROM_ADDRESS = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@djiguicorporation.org';

// ── INTERNAL ADMIN NOTIFICATIONS ──────────────────────────────────────

export async function notifyAdminNewProducer(producer) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `🌾 Nouveau producteur inscrit — ${producer.fullName} (${producer.country})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">Nouveau Producteur Diaspora</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Nom</td><td style="padding:8px 0;color:#555;">${producer.fullName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Coopérative</td><td style="padding:8px 0;color:#555;">${producer.cooperativeName || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Pays</td><td style="padding:8px 0;color:#555;">${producer.country}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Produits</td><td style="padding:8px 0;color:#555;">${(producer.products || []).join(', ')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Volume/mois</td><td style="padding:8px 0;color:#555;">${producer.monthlyVolumeKg ? producer.monthlyVolumeKg + ' kg' : 'Non précisé'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Certification</td><td style="padding:8px 0;color:#555;">${producer.certification}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Email</td><td style="padding:8px 0;color:#555;">${producer.email || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Téléphone</td><td style="padding:8px 0;color:#555;">${producer.phone}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="${adminPanelLoginUrl()}" style="background:#1a3c2e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Voir dans le Dashboard Admin</a>
          </div>
        </div>
      </div>
    `
  });
}

export async function notifyAdminNewBuyer(buyer) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `🌍 Nouvel acheteur diaspora — ${buyer.fullName} | ${buyer.businessName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#B5850A;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">Nouvel Acheteur Diaspora</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Nom</td><td style="padding:8px 0;color:#555;">${buyer.fullName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Entreprise</td><td style="padding:8px 0;color:#555;">${buyer.businessName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Type</td><td style="padding:8px 0;color:#555;">${buyer.businessType || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Localisation</td><td style="padding:8px 0;color:#555;">${buyer.cityState || buyer.country}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Produits recherchés</td><td style="padding:8px 0;color:#555;">${(buyer.productsSought || []).join(', ')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Volume souhaité</td><td style="padding:8px 0;color:#555;">${buyer.monthlyVolumeNeededKg ? buyer.monthlyVolumeNeededKg + ' kg/mois' : 'Non précisé'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Email</td><td style="padding:8px 0;color:#555;">${buyer.email}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Téléphone</td><td style="padding:8px 0;color:#555;">${buyer.phone || '—'}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="${adminPanelLoginUrl()}" style="background:#B5850A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Voir dans le Dashboard Admin</a>
          </div>
        </div>
      </div>
    `
  });
}

export async function notifyAdminNewInvestor(investor) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `💰 Nouvel investisseur AfriYield — ${investor.fullName} | ${investor.investmentRange} | ${investor.investmentTrack}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:20px;">💰 Nouveau Investisseur AfriYield Exchange</h1>
          <p style="color:white;margin:8px 0 0;font-size:14px;">ACTION REQUISE — Contacter dans les 24 heures</p>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Nom</td><td style="padding:8px 0;color:#555;">${investor.fullName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Email</td><td style="padding:8px 0;color:#555;">${investor.email}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Téléphone</td><td style="padding:8px 0;color:#555;">${investor.phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Pays</td><td style="padding:8px 0;color:#555;">${investor.countryOfResidence}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Track d'investissement</td><td style="padding:8px 0;color:#B5850A;font-weight:bold;">${investor.investmentTrack}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Produit d'intérêt</td><td style="padding:8px 0;color:#555;">${investor.commodityInterest}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Fourchette d'investissement</td><td style="padding:8px 0;color:#1a3c2e;font-weight:bold;font-size:16px;">${investor.investmentRange}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Source</td><td style="padding:8px 0;color:#555;">${investor.heardFrom || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Message</td><td style="padding:8px 0;color:#555;">${investor.message || '—'}</td></tr>
          </table>
          <div style="background:#fff3cd;border:1px solid #B5850A;border-radius:6px;padding:16px;margin-top:20px;">
            <p style="margin:0;color:#333;font-weight:bold;">📋 Prochaines étapes recommandées:</p>
            <ol style="margin:8px 0 0;padding-left:20px;color:#555;line-height:1.8;">
              <li>Envoyer un email de bienvenue personnalisé dans les 24h</li>
              <li>Proposer un appel de 15 minutes pour discuter des opportunités</li>
              <li>Préparer 2-3 fiches d'opportunités correspondant à leur track</li>
              <li>Envoyer un one-pager AfriYield Exchange après l'appel</li>
            </ol>
          </div>
          <div style="margin-top:20px;">
            <a href="mailto:${investor.email}" style="display:inline-block;margin:0 8px 8px 0;background:#1a3c2e;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;">Répondre à l'investisseur</a>
            <a href="${adminPanelLoginUrl({ tab: 'afriyield', sub: 'investors' })}" style="display:inline-block;margin:0 0 8px 0;background:#B5850A;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;">Voir le Dashboard</a>
          </div>
        </div>
      </div>
    `
  });
}

export async function notifyAdminNewCooperative(cooperative) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `🤝 Nouvelle coopérative inscrite — ${cooperative.cooperativeName} (${cooperative.country})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">Nouvelle Coopérative</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Nom</td><td style="padding:8px 0;color:#555;">${cooperative.cooperativeName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Responsable</td><td style="padding:8px 0;color:#555;">${cooperative.leaderName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Pays</td><td style="padding:8px 0;color:#555;">${cooperative.country}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Membres</td><td style="padding:8px 0;color:#555;">${cooperative.memberCount}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Produits</td><td style="padding:8px 0;color:#555;">${(cooperative.primaryCrops || []).join(', ')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Intérêts</td><td style="padding:8px 0;color:#555;">${(cooperative.interests || []).join(', ')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Email</td><td style="padding:8px 0;color:#555;">${cooperative.email}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Téléphone</td><td style="padding:8px 0;color:#555;">${cooperative.phone}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="${adminPanelLoginUrl()}" style="background:#1a3c2e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Activer cette coopérative</a>
          </div>
        </div>
      </div>
    `
  });
}

export async function notifyCooperativeExpertRequest(request) {
  const resend = getResend();
  if (!resend) return;

  const CooperativePlatformRegistration = (
    await import('../models/CooperativePlatformRegistration.js')
  ).default;

  const name = request.cooperativeName || '';
  const filter = request.cooperativeId
    ? { _id: request.cooperativeId }
    : {
        $or: [
          { cooperativeName: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        ],
      };

  const coop = await CooperativePlatformRegistration.findOne(filter).lean();
  if (!coop?.email) return;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: coop.email,
    subject: `👨‍🌾 Demande expert membre — ${request.farmerName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:18px;">Nouvelle demande d'un membre</h1>
        </div>
        <div style="padding:20px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <p style="color:#333;"><strong>${request.farmerName}</strong> a demandé l'aide d'un expert via Think Tank.</p>
          <p style="color:#555;">${request.problemDescription}</p>
          <p style="color:#555;">Urgence: ${request.urgency} · Culture: ${request.cropType || '—'}</p>
          <p style="color:#555;">Contact: ${request.farmerEmail} ${request.farmerPhone ? '| ' + request.farmerPhone : ''}</p>
        </div>
      </div>
    `,
  });
}

export async function notifyAdminExpertRequest(request) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `🔬 Demande expert — ${request.farmerName} | ${request.urgency === 'immediate' ? '🚨 URGENT' : request.cropType}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:${request.urgency === 'immediate' ? '#dc2626' : '#1a3c2e'};padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">${request.urgency === 'immediate' ? '🚨 DEMANDE URGENTE' : '🔬 Demande Expert Agricole'}</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Agriculteur</td><td style="padding:8px 0;color:#555;">${request.farmerName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Contact</td><td style="padding:8px 0;color:#555;">${request.farmerEmail} | ${request.farmerPhone || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Culture</td><td style="padding:8px 0;color:#555;">${request.cropType || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Diagnostic IA</td><td style="padding:8px 0;color:#555;">${request.diseaseDetected || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Problème</td><td style="padding:8px 0;color:#555;">${request.problemDescription}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Coopérative</td><td style="padding:8px 0;color:#555;">${request.cooperativeMember ? request.cooperativeName || 'Oui' : 'Non membre'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Urgence</td><td style="padding:8px 0;color:#555;">${request.urgency}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Source</td><td style="padding:8px 0;color:#555;">${request.source}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="${adminPanelLoginUrl()}" style="background:#1a3c2e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Assigner un expert</a>
          </div>
        </div>
      </div>
    `
  });
}

// ── USER CONFIRMATION EMAILS ───────────────────────────────────────────

export async function confirmProducerRegistration(producer) {
  if (!producer.email) return;
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: producer.email,
    subject: 'Sahel AgriConnect — Votre profil producteur a été reçu ✓',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">Sahel AgriConnect</h1>
          <p style="color:#B5850A;margin:4px 0 0;">Votre profil a été reçu</p>
        </div>
        <div style="padding:32px;background:white;border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;">Bonjour <strong>${producer.fullName}</strong>,</p>
          <p style="color:#555;">Merci de vous être inscrit sur Sahel AgriConnect. Votre profil producteur a bien été reçu et est en cours de vérification.</p>
          <div style="background:#f0f9f4;border-left:4px solid #1a3c2e;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-weight:bold;color:#1a3c2e;">Prochaines étapes :</p>
            <ol style="margin:8px 0 0;padding-left:20px;color:#555;line-height:2;">
              <li>Notre équipe examine votre profil <strong>sous 48 heures</strong></li>
              <li>Vous recevrez un appel ou SMS de confirmation</li>
              <li>Votre profil sera activé et visible aux acheteurs diaspora</li>
              <li>Vous recevrez des introductions directes avec des acheteurs compatibles</li>
            </ol>
          </div>
          <p style="color:#555;">Des questions ? Répondez directement à cet email ou visitez <a href="${process.env.FRONTEND_URL}/contact" style="color:#1a3c2e;">notre page contact</a>.</p>
          <p style="color:#333;margin-top:32px;">Cordialement,<br><strong>L'équipe Sahel AgriConnect</strong></p>
        </div>
      </div>
    `
  });
}

export async function confirmBuyerRegistration(buyer) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: buyer.email,
    subject: 'AfriYield Exchange — Votre demande acheteur a été reçue ✓',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#B5850A;margin:0;font-size:22px;">AfriYield Exchange</h1>
          <p style="color:white;margin:4px 0 0;">Powered by Sahel AgriConnect</p>
        </div>
        <div style="padding:32px;background:white;border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;">Bonjour <strong>${buyer.fullName}</strong>,</p>
          <p style="color:#555;">Merci d'avoir soumis votre profil acheteur sur AfriYield Exchange. Nous avons bien reçu votre demande pour <strong>${buyer.businessName}</strong>.</p>
          <div style="background:#fff9e6;border-left:4px solid #B5850A;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-weight:bold;color:#B5850A;">Ce qui se passe maintenant :</p>
            <ol style="margin:8px 0 0;padding-left:20px;color:#555;line-height:2;">
              <li>Confirmation reçue — <strong>vous y êtes !</strong></li>
              <li>Notre équipe identifie les producteurs compatibles <strong>sous 72 heures</strong></li>
              <li>Vous recevez une introduction directe avec 2 à 3 producteurs vérifiés</li>
              <li>Vous négociez directement les prix, volumes et conditions</li>
            </ol>
          </div>
          <p style="color:#555;">En attendant, vous pouvez parcourir les producteurs disponibles sur notre plateforme.</p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL}/diaspora" style="background:#1a3c2e;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Voir les producteurs disponibles</a>
          </div>
          <p style="color:#333;margin-top:32px;">Cordialement,<br><strong>L'équipe AfriYield Exchange</strong></p>
        </div>
      </div>
    `
  });
}

export async function confirmInvestorRegistration(investor) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: investor.email,
    subject: 'AfriYield Exchange — Bienvenue dans notre réseau d\'investisseurs 🌍',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px 16px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#B5850A;margin:0;font-size:22px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">AfriYield Exchange</h1>
          <p style="color:#ffffff;margin:10px 0 0;font-size:15px;line-height:1.4;">Bienvenue dans notre réseau</p>
        </div>
        <div style="padding:32px;background:white;border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;">Bonjour <strong>${investor.fullName}</strong>,</p>
          <p style="color:#555;line-height:1.7;">Nous avons bien reçu votre inscription en tant qu'investisseur AfriYield Exchange. Votre intérêt pour <strong>${investor.investmentTrack}</strong> dans le secteur <strong>${investor.commodityInterest}</strong> correspond parfaitement aux opportunités disponibles sur notre plateforme.</p>
          <div style="background:#f0f9f4;border:1px solid #1a3c2e;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 16px;font-weight:bold;color:#1a3c2e;font-size:16px;">📋 Vos prochaines étapes :</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td width="36" valign="top" style="padding:0 12px 14px 0;">
                  <div style="background:#1a3c2e;color:#ffffff;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:bold;">1</div>
                </td>
                <td valign="top" style="padding:0 0 14px 0;color:#555;font-size:14px;line-height:1.5;">
                  <strong>Dans les 24 heures</strong> — Un membre de notre équipe vous contactera personnellement pour discuter de vos objectifs
                </td>
              </tr>
              <tr>
                <td width="36" valign="top" style="padding:0 12px 14px 0;">
                  <div style="background:#1a3c2e;color:#ffffff;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:bold;">2</div>
                </td>
                <td valign="top" style="padding:0 0 14px 0;color:#555;font-size:14px;line-height:1.5;">
                  <strong>Appel de découverte</strong> — 15 minutes pour comprendre vos préférences et vous présenter les opportunités correspondantes
                </td>
              </tr>
              <tr>
                <td width="36" valign="top" style="padding:0 12px 14px 0;">
                  <div style="background:#1a3c2e;color:#ffffff;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:bold;">3</div>
                </td>
                <td valign="top" style="padding:0 0 14px 0;color:#555;font-size:14px;line-height:1.5;">
                  <strong>Opportunités personnalisées</strong> — Vous recevrez 2 à 3 fiches d'opportunités adaptées à votre track et budget
                </td>
              </tr>
              <tr>
                <td width="36" valign="top" style="padding:0 12px 0 0;">
                  <div style="background:#B5850A;color:#ffffff;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:bold;">4</div>
                </td>
                <td valign="top" style="padding:0;color:#555;font-size:14px;line-height:1.5;">
                  <strong>Premier investissement</strong> — Déployez votre capital avec notre accompagnement complet
                </td>
              </tr>
            </table>
          </div>
          <p style="color:#555;">En attendant notre contact, vous pouvez parcourir les opportunités disponibles dès maintenant.</p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL}/afri-yield/opportunities" style="background:#B5850A;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Voir les opportunités →</a>
          </div>
          <p style="color:#333;margin-top:32px;">Avec enthousiasme,<br><strong>L'équipe AfriYield Exchange</strong><br><span style="color:#555;font-size:14px;">Powered by Sahel AgriConnect</span></p>
        </div>
      </div>
    `
  });
}

export async function confirmAfriYieldInvestmentPayment({
  investorEmail,
  investorName,
  opportunityName,
  amountUSD,
}) {
  const resend = getResend();
  if (!resend || !investorEmail) return;
  const amt = Number(amountUSD) || 0;
  const portal =
    process.env.FRONTEND_URL || 'https://afriyieldexchange.com';
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: investorEmail,
    subject: `AfriYield Exchange — Investment confirmed ($${amt.toLocaleString()} USD)`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:20px;">Investment confirmed</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <p style="color:#333;">Hello <strong>${investorName || 'Investor'}</strong>,</p>
          <p style="color:#555;">Your payment via Stripe has been received and your investment is now recorded on AfriYield Exchange.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Opportunity</td><td style="padding:8px 0;color:#555;">${opportunityName || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Amount</td><td style="padding:8px 0;color:#1a3c2e;font-weight:bold;">$${amt.toLocaleString()} USD</td></tr>
          </table>
          <p style="color:#555;font-size:14px;">Projected returns are not guaranteed. You can track your investment in your investor dashboard.</p>
          <div style="margin-top:20px;text-align:center;">
            <a href="${portal}/investor/dashboard?email=${encodeURIComponent(investorEmail)}" style="background:#B5850A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View dashboard →</a>
          </div>
        </div>
      </div>
    `,
  });
}

export async function notifyAdminAfriYieldInvestmentPayment({
  investorEmail,
  investorName,
  opportunityName,
  opportunityId,
  amountUSD,
  stripeSessionId,
}) {
  const resend = getResend();
  if (!resend) return;
  const amt = Number(amountUSD) || 0;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `💰 AfriYield investment paid — $${amt.toLocaleString()} | ${opportunityName || opportunityId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#B5850A;margin:0;font-size:20px;">AfriYield Stripe investment</h1>
          <p style="color:white;margin:8px 0 0;font-size:14px;">Payment recorded in MongoDB</p>
        </div>
        <div style="padding:24px;background:#f9f9f9;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;width:40%;">Investor</td><td style="padding:8px 0;color:#555;">${investorName || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Email</td><td style="padding:8px 0;color:#555;">${investorEmail}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Opportunity</td><td style="padding:8px 0;color:#555;">${opportunityName || '—'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Amount</td><td style="padding:8px 0;color:#1a3c2e;font-weight:bold;font-size:16px;">$${amt.toLocaleString()} USD</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;color:#333;">Stripe session</td><td style="padding:8px 0;color:#555;font-size:12px;">${stripeSessionId || '—'}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="${adminPanelLoginUrl({ tab: 'afriyield', sub: 'kyc-reviews' })}" style="background:#B5850A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Open admin dashboard</a>
          </div>
        </div>
      </div>
    `,
  });
}

export async function confirmCooperativeRegistration(cooperative) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: cooperative.email,
    subject: 'Sahel AgriConnect — Inscription coopérative reçue ✓',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">Sahel AgriConnect</h1>
          <p style="color:#B5850A;margin:4px 0 0;">Inscription Coopérative</p>
        </div>
        <div style="padding:32px;background:white;border:1px solid #e0e0e0;">
          <p style="color:#333;font-size:16px;">Bonjour <strong>${cooperative.leaderName}</strong>,</p>
          <p style="color:#555;">L'inscription de votre coopérative <strong>${cooperative.cooperativeName}</strong> a bien été reçue.</p>
          <div style="background:#f0f9f4;border-left:4px solid #1a3c2e;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-weight:bold;color:#1a3c2e;">Ce qui se passe maintenant :</p>
            <ol style="margin:8px 0 0;padding-left:20px;color:#555;line-height:2;">
              <li>Examen de votre dossier <strong>sous 48 heures</strong></li>
              <li>Activation de votre compte coopérative sur la plateforme</li>
              <li>Accès au tableau de bord coopérative — gestion des membres, équipements, certifications</li>
              <li>Connexion aux investisseurs diaspora via AfriYield Exchange</li>
            </ol>
          </div>
          <p style="color:#333;margin-top:32px;">Cordialement,<br><strong>L'équipe Sahel AgriConnect</strong></p>
        </div>
      </div>
    `
  });
}

