import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import CooperativePlatformRegistration from '../models/CooperativePlatformRegistration.js';
import Farmer from '../models/Farmer.js';
import ManualCoopMember from '../models/ManualCoopMember.js';
import HarvestLog from '../models/HarvestLog.js';
import ICSScore from '../models/ICSScore.js';
import CooperativeJoinRequest from '../models/CooperativeJoinRequest.js';
import { computeICSScore } from './icsScoreService.js';
import { getVerifiedMemberCount } from './coopMemberUpgrade.js';

const TRACE_BASE = 'https://sahelagriconnect.com/trace';
const MARGIN = 48;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BRAND = '#1a3c2e';
const GOLD = '#B5850A';
const MUTED = '#555555';

const READINESS = {
  not_ready: { fr: 'Non prêt', en: 'Not Ready' },
  developing: { fr: 'En développement', en: 'Developing' },
  nearly_ready: { fr: 'Presque prêt', en: 'Nearly Ready' },
  audit_ready: { fr: 'Prêt pour l’audit', en: 'Audit Ready' },
};

const CATEGORY_LABELS = {
  memberRecords: { fr: 'Dossiers membres', en: 'Member records' },
  harvestLogs: { fr: 'Journaux de récolte', en: 'Harvest logs' },
  inputTracking: { fr: 'Suivi des intrants', en: 'Input tracking' },
  plotDocumentation: { fr: 'Documentation des parcelles', en: 'Plot documentation' },
  coopVerification: { fr: 'Vérification coopérative', en: 'Coop verification' },
  subscriptionActive: { fr: 'Abonnement actif', en: 'Active subscription' },
};

const ICS_TEXT = {
  fr: {
    insufficient_verified_members: 'Registres de membres vérifiés insuffisants',
    insufficient_harvest_logs: 'Journaux de récolte insuffisants',
    incomplete_input_tracking: 'Suivi des intrants incomplet sur les journaux de récolte',
    incomplete_plot_documentation: 'Documentation GPS / superficie des parcelles incomplète',
    email_not_verified: 'Adresse e-mail non vérifiée',
    no_document_uploaded: 'Aucun document justificatif téléchargé',
    declared_member_count_zero: 'Effectif déclaré égal à zéro',
    no_paid_subscription: 'Aucun abonnement payant',
    verify_more_members:
      'Vérifiez plus de membres (actuellement {count} ; objectif 51+ pour les points complets)',
    record_more_harvest_logs:
      'Enregistrez plus de journaux de récolte (actuellement {count} ; objectif 30+)',
    add_inputs_to_logs:
      'Ajoutez des intrants (engrais/pesticides/biologiques) sur chaque journal de récolte',
    record_plot_gps:
      'Enregistrez les coordonnées GPS et la superficie (hectares) sur les journaux de récolte',
    verify_email: 'Vérifiez l’adresse e-mail du responsable de la coopérative',
    upload_document:
      'Téléchargez au moins un document d’enregistrement ou de légitimité de la coopérative',
    upgrade_to_growth: 'Passez à un abonnement Croissance actif pour les points ICS complets',
    keep_roster_up_to_date: 'Maintenez le registre des membres vérifiés à jour',
    continue_logging_harvests: 'Continuez à enregistrer chaque récolte',
    set_declared_member_count: 'Indiquez l’effectif déclaré de la coopérative',
    upgrade_from_free: 'Passez du plan gratuit à Starter ou Croissance',
    note_verified_members: '{count} membre(s) vérifié(s)',
    note_harvest_logs: '{count} journal/journaux de récolte',
    note_inputs_none: '0 % des journaux de récolte ont des intrants',
    note_inputs_pct: '{pct} % des journaux de récolte incluent des intrants ({with}/{total})',
    note_plot_none: '0 % des journaux de récolte ont une documentation de parcelle',
    note_plot_pct: '{pct} % des journaux de récolte ont GPS + superficie ({with}/{total})',
    note_coop_none: 'Aucun critère de vérification rempli',
    note_coop_email: 'e-mail vérifié',
    note_coop_document: 'document téléchargé',
    note_coop_declared: 'membres déclarés : {count}',
    note_coop_plan: 'plan : {plan}',
    note_subscription_growth: 'Plan Croissance actif',
    note_subscription_starter: 'Plan Starter',
    note_subscription_free: 'Plan gratuit / inactif',
    plan_starter: 'starter',
    plan_growth: 'croissance',
    plan_free: 'gratuit',
  },
  en: {
    insufficient_verified_members: 'Insufficient verified member records',
    insufficient_harvest_logs: 'Insufficient harvest logs',
    incomplete_input_tracking: 'Incomplete input tracking on harvest logs',
    incomplete_plot_documentation: 'Incomplete plot GPS / size documentation',
    email_not_verified: 'Email not verified',
    no_document_uploaded: 'No supporting document uploaded',
    declared_member_count_zero: 'Declared member count is zero',
    no_paid_subscription: 'No paid subscription plan',
    verify_more_members: 'Verify more members (currently {count}; target 51+ for full points)',
    record_more_harvest_logs: 'Record more harvest logs (currently {count}; target 30+)',
    add_inputs_to_logs: 'Add fertilizer/pesticide/organic inputs on each harvest log',
    record_plot_gps: 'Record plot GPS coordinates and plot size (hectares) on harvest logs',
    verify_email: 'Verify the cooperative leader email address',
    upload_document: 'Upload at least one cooperative registration or legitimacy document',
    upgrade_to_growth: 'Upgrade to an active Growth subscription for full ICS subscription points',
    keep_roster_up_to_date: 'Keep verified member roster up to date',
    continue_logging_harvests: 'Continue logging every harvest',
    set_declared_member_count: 'Set the declared member count for the cooperative',
    upgrade_from_free: 'Upgrade from free to Starter or Growth',
    note_verified_members: '{count} verified member(s)',
    note_harvest_logs: '{count} harvest log(s)',
    note_inputs_none: '0% of harvest logs have inputs',
    note_inputs_pct: '{pct}% of harvest logs include inputs ({with}/{total})',
    note_plot_none: '0% of harvest logs have plot documentation',
    note_plot_pct: '{pct}% of harvest logs have GPS + plot size ({with}/{total})',
    note_coop_none: 'No verification criteria met',
    note_coop_email: 'email verified',
    note_coop_document: 'document uploaded',
    note_coop_declared: 'declared members: {count}',
    note_coop_plan: 'plan: {plan}',
    note_subscription_growth: 'Growth plan active',
    note_subscription_starter: 'Starter plan',
    note_subscription_free: 'Free / inactive plan',
    plan_starter: 'starter',
    plan_growth: 'growth',
    plan_free: 'free',
  },
};

const LEGACY_EXACT = {
  'Insufficient verified member records': 'insufficient_verified_members',
  'Insufficient harvest logs': 'insufficient_harvest_logs',
  'Incomplete input tracking on harvest logs': 'incomplete_input_tracking',
  'Incomplete plot GPS / size documentation': 'incomplete_plot_documentation',
  'Email not verified': 'email_not_verified',
  'No supporting document uploaded': 'no_document_uploaded',
  'Declared member count is zero': 'declared_member_count_zero',
  'No paid subscription plan': 'no_paid_subscription',
  'Add fertilizer/pesticide/organic inputs on each harvest log': 'add_inputs_to_logs',
  'Record plot GPS coordinates and plot size (hectares) on harvest logs': 'record_plot_gps',
  'Verify the cooperative leader email address': 'verify_email',
  'Upload at least one cooperative registration or legitimacy document': 'upload_document',
  'Upgrade to an active Growth subscription for full ICS subscription points': 'upgrade_to_growth',
  'Keep verified member roster up to date': 'keep_roster_up_to_date',
  'Continue logging every harvest': 'continue_logging_harvests',
  'Set the declared member count for the cooperative': 'set_declared_member_count',
  'Upgrade from free to Starter or Growth': 'upgrade_from_free',
  '0% of harvest logs have inputs': 'note_inputs_none',
  '0% of harvest logs have plot documentation': 'note_plot_none',
  'No verification criteria met': 'note_coop_none',
  'Growth plan active': 'note_subscription_growth',
  'Starter plan': 'note_subscription_starter',
  'Free / inactive plan': 'note_subscription_free',
};

function t(lang, fr, en) {
  return lang === 'en' ? en : fr;
}

function fill(template, params = {}) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
}

function parseToken(raw) {
  if (!raw || typeof raw !== 'string') return { key: '', params: {} };
  const [key, ...rest] = raw.split('|');
  const params = {};
  for (const part of rest) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    params[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return { key, params };
}

function normalizeIcsString(raw) {
  if (!raw || typeof raw !== 'string') return { key: '', params: {} };
  const trimmed = raw.trim();
  if (/^[a-z][a-z0-9_]*(\|[a-z0-9_]+=[^|]*)*$/i.test(trimmed) && !trimmed.includes(' ')) {
    return parseToken(trimmed);
  }
  if (trimmed.includes('|') && /^[a-z][a-z0-9_]*\|/i.test(trimmed)) {
    return parseToken(trimmed);
  }
  if (LEGACY_EXACT[trimmed]) return { key: LEGACY_EXACT[trimmed], params: {} };

  let m = trimmed.match(/^Verify more members \(currently (\d+); target 51\+ for full points\)$/i);
  if (m) return { key: 'verify_more_members', params: { count: m[1] } };
  m = trimmed.match(/^Record more harvest logs \(currently (\d+); target 30\+\)$/i);
  if (m) return { key: 'record_more_harvest_logs', params: { count: m[1] } };
  m = trimmed.match(/^(\d+)\s+verified member\(s\)$/i);
  if (m) return { key: 'note_verified_members', params: { count: m[1] } };
  m = trimmed.match(/^(\d+)\s+harvest log\(s\)$/i);
  if (m) return { key: 'note_harvest_logs', params: { count: m[1] } };
  m = trimmed.match(/^(\d+)% of harvest logs include inputs \((\d+)\/(\d+)\)$/i);
  if (m) return { key: 'note_inputs_pct', params: { pct: m[1], with: m[2], total: m[3] } };
  m = trimmed.match(/^(\d+)% of harvest logs have GPS \+ plot size \((\d+)\/(\d+)\)$/i);
  if (m) return { key: 'note_plot_pct', params: { pct: m[1], with: m[2], total: m[3] } };

  if (/email verified|document uploaded|declared members:|plan:/i.test(trimmed)) {
    const params = {
      email: /email verified/i.test(trimmed) ? '1' : '0',
      document: /document uploaded/i.test(trimmed) ? '1' : '0',
      declared: '0',
      plan: 'free',
    };
    const dm = trimmed.match(/declared members:\s*(\d+)/i);
    if (dm) params.declared = dm[1];
    const pm = trimmed.match(/plan:\s*([a-z_]+)/i);
    if (pm) params.plan = pm[1].toLowerCase();
    return { key: 'note_coop_verification', params };
  }

  return { key: trimmed, params: {} };
}

function translateIcs(lang, raw) {
  const { key, params } = normalizeIcsString(raw);
  if (!key) return '';
  const dict = ICS_TEXT[lang] || ICS_TEXT.fr;
  const en = ICS_TEXT.en;

  if (key === 'note_coop_verification') {
    const parts = [];
    if (params.email === '1') parts.push(dict.note_coop_email || en.note_coop_email);
    if (params.document === '1') parts.push(dict.note_coop_document || en.note_coop_document);
    if (Number(params.declared) > 0) {
      parts.push(fill(dict.note_coop_declared || en.note_coop_declared, { count: params.declared }));
    }
    if (params.plan && params.plan !== 'free') {
      const planLabel =
        params.plan === 'growth'
          ? dict.plan_growth
          : params.plan === 'starter'
            ? dict.plan_starter
            : params.plan;
      parts.push(fill(dict.note_coop_plan || en.note_coop_plan, { plan: planLabel }));
    }
    return parts.length ? parts.join(lang === 'fr' ? ' ; ' : '; ') : dict.note_coop_none;
  }

  const template = dict[key] || en[key];
  if (!template) return raw;
  return fill(template, params);
}

function formatDDMMYYYY(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function planLabel(lang, tier) {
  const p = String(tier || 'free').toLowerCase();
  if (p === 'growth') return lang === 'fr' ? 'Croissance' : 'Growth';
  if (p === 'starter') return 'Starter';
  return lang === 'fr' ? 'Gratuit' : 'Free';
}

function ensureSpace(doc, needed = 80) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
  }
}

function sectionHeading(doc, text) {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(14).text(text, { underline: false });
  doc
    .strokeColor(GOLD)
    .lineWidth(1.5)
    .moveTo(MARGIN, doc.y + 2)
    .lineTo(MARGIN + CONTENT_W, doc.y + 2)
    .stroke();
  doc.moveDown(0.8);
  doc.fillColor('#222').font('Helvetica').fontSize(9);
}

function kv(doc, label, value) {
  ensureSpace(doc, 16);
  doc.font('Helvetica-Bold').fillColor(MUTED).text(`${label}: `, { continued: true });
  doc.font('Helvetica').fillColor('#222').text(String(value ?? '—'));
}

function drawSimpleTable(doc, headers, rows, colWidths) {
  const startX = MARGIN;
  const fontSize = 7.5;
  const pad = 3;

  const drawRow = (cells, bold, fill) => {
    ensureSpace(doc, 18);
    const y = doc.y;
    let maxH = 14;
    const texts = cells.map((c, i) => {
      const w = colWidths[i];
      const h = doc.heightOfString(String(c ?? '—'), { width: w - pad * 2, align: 'left' });
      maxH = Math.max(maxH, h + pad * 2);
      return { text: String(c ?? '—'), w };
    });
    if (fill) {
      doc.save();
      doc.rect(startX, y, CONTENT_W, maxH).fill(fill);
      doc.restore();
    }
    let x = startX;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize).fillColor('#222');
    for (const cell of texts) {
      doc.text(cell.text, x + pad, y + pad, { width: cell.w - pad * 2, lineBreak: true });
      x += cell.w;
    }
    doc.y = y + maxH;
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .moveTo(startX, doc.y)
      .lineTo(startX + CONTENT_W, doc.y)
      .stroke();
  };

  drawRow(headers, true, '#eef2ef');
  for (const row of rows) {
    drawRow(row, false, null);
  }
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9);
}

async function loadVerifiedFarmers(cooperativeId, coopName) {
  const [verifiedFarmers, approvedJoins] = await Promise.all([
    Farmer.find({ cooperativeId, emailVerified: true })
      .select('nom telephone region cultures superficie createdAt localisation emailVerified')
      .lean(),
    CooperativeJoinRequest.find({ cooperativeId, status: 'approved' }).select('farmerId').lean(),
  ]);
  const idSet = new Set(verifiedFarmers.map((f) => String(f._id)));
  for (const j of approvedJoins) {
    if (j?.farmerId) idSet.add(String(j.farmerId));
  }
  const missing = [...idSet].filter((id) => !verifiedFarmers.some((f) => String(f._id) === id));
  let extra = [];
  if (missing.length) {
    extra = await Farmer.find({ _id: { $in: missing } })
      .select('nom telephone region cultures superficie createdAt localisation emailVerified')
      .lean();
  }
  const byId = new Map([...verifiedFarmers, ...extra].map((f) => [String(f._id), f]));
  return [...idSet].map((id) => byId.get(id)).filter(Boolean);
}

function buildInputSummary(logs) {
  const withInputs = logs.filter((l) => Array.isArray(l.inputs) && l.inputs.length > 0);
  const map = new Map();
  let organicOnlyCount = 0;

  for (const log of withInputs) {
    const types = (log.inputs || []).map((i) => i.type || 'none');
    const organicOnly =
      types.length > 0 && types.every((ty) => ty === 'organic' || ty === 'none');
    if (organicOnly && types.some((ty) => ty === 'organic')) organicOnlyCount += 1;

    for (const inp of log.inputs || []) {
      const name = (inp.name || '').trim() || '—';
      const type = inp.type || 'none';
      const unit = inp.unit || '';
      const key = `${name.toLowerCase()}|${type}|${unit}`;
      const prev = map.get(key) || { name, type, unit, qty: 0 };
      prev.qty += Number(inp.quantity) || 0;
      map.set(key, prev);
    }
  }

  const organicPct =
    logs.length > 0 ? Math.round((organicOnlyCount / logs.length) * 100) : 0;

  return {
    withInputsCount: withInputs.length,
    total: logs.length,
    rows: [...map.values()],
    organicPct,
  };
}

/**
 * Build a pdfkit document for the certification dossier (caller must pipe + end).
 * @returns {Promise<{ doc: import('pdfkit'), filename: string, cooperativeName: string }>}
 */
export async function generateDossierPDF(cooperativeId, lang = 'fr') {
  const language = lang === 'en' ? 'en' : 'fr';
  const coop = await CooperativePlatformRegistration.findById(cooperativeId);
  if (!coop) {
    const err = new Error('Cooperative not found');
    err.status = 404;
    throw err;
  }

  const [verifiedCount, platformMembers, manualMembers, harvestLogs, icsScore] = await Promise.all([
    getVerifiedMemberCount(cooperativeId),
    loadVerifiedFarmers(cooperativeId, coop.cooperativeName),
    ManualCoopMember.find({ cooperativeId }).sort({ fullName: 1 }).lean(),
    HarvestLog.find({ cooperativeId }).sort({ harvestDate: -1 }).lean(),
    ICSScore.findOne({ cooperativeId }).then(async (s) => s || computeICSScore(cooperativeId)),
  ]);

  const ics = icsScore?.toObject ? icsScore.toObject() : icsScore;
  const verifiedLogs = harvestLogs.filter((l) => l.verifiedByCoop);
  const qrEntries = [];
  for (const log of verifiedLogs.slice(0, 30)) {
    const url = `${TRACE_BASE}/${encodeURIComponent(log.batchId)}`;
    try {
      const buf = await QRCode.toBuffer(url, {
        type: 'png',
        width: 180,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#1a3c2e', light: '#ffffff' },
      });
      qrEntries.push({ batchId: log.batchId, crop: log.cropType || '—', buffer: buf, url });
    } catch {
      /* skip failed QR */
    }
  }

  const inputSummary = buildInputSummary(harvestLogs);
  const withGps = harvestLogs.filter(
    (l) => l.plotGps != null && l.plotGps.lat != null && Number.isFinite(Number(l.plotGps.lat))
  );
  const withSize = harvestLogs.filter((l) => Number(l.plotSizeHectares) > 0);
  const now = new Date();
  const dateStr = formatDDMMYYYY(now);
  const coopName = coop.cooperativeName || 'Cooperative';
  const safeName = coopName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'cooperative';
  const filename = `dossier-certification-${safeName}-${dateStr.replace(/\//g, '-')}.pdf`;

  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    info: {
      Title: t(language, 'Dossier de Certification ICS', 'ICS Certification Dossier'),
      Author: 'Sahel AgriConnect',
      Subject: coopName,
    },
  });

  // —— SECTION 1 Cover ——
  doc.moveDown(4);
  doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(28).text('SAHEL AGRICONNECT', {
    align: 'center',
  });
  doc.moveDown(1.5);
  doc
    .fillColor(GOLD)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(t(language, 'Dossier de Certification ICS', 'ICS Certification Dossier'), {
      align: 'center',
    });
  doc.moveDown(1.2);
  doc.fillColor('#111').font('Helvetica-Bold').fontSize(16).text(coopName, { align: 'center' });
  doc.moveDown(0.8);
  doc.fillColor(MUTED).font('Helvetica').fontSize(11).text(dateStr, { align: 'center' });
  doc.moveDown(2);
  doc
    .fillColor(MUTED)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(
      t(
        language,
        'Document confidentiel — usage certifié uniquement',
        'Confidential document — certified use only'
      ),
      { align: 'center' }
    );

  // —— SECTION 2 Identity ——
  doc.addPage();
  sectionHeading(doc, t(language, 'Identité de la Coopérative', 'Cooperative Identity'));
  kv(doc, t(language, 'Nom', 'Name'), coopName);
  kv(
    doc,
    t(language, 'Numéro d’enregistrement', 'Registration number'),
    coop.registrationNumber || coop.registrationId || '—'
  );
  kv(doc, t(language, 'Région', 'Region'), coop.regionCity || '—');
  kv(doc, t(language, 'Pays', 'Country'), coop.country || '—');
  kv(doc, t(language, 'Responsable', 'Leader'), coop.leaderName || '—');
  kv(doc, 'Email', coop.email || '—');
  kv(doc, t(language, 'Téléphone', 'Phone'), coop.phone || '—');
  kv(doc, t(language, 'Abonnement', 'Subscription plan'), planLabel(language, coop.tier));
  kv(
    doc,
    t(language, 'Membres', 'Members'),
    t(
      language,
      `${verifiedCount} vérifiés · ${coop.memberCount ?? 0} déclarés`,
      `${verifiedCount} verified · ${coop.memberCount ?? 0} declared`
    )
  );
  kv(
    doc,
    t(language, 'Inscrite le', 'Registered on'),
    formatDDMMYYYY(coop.createdAt || coop.activatedAt)
  );

  // —— SECTION 3 ICS ——
  sectionHeading(doc, t(language, 'Score de Conformité ICS', 'ICS Compliance Score'));
  const total = ics?.scoreTotal ?? 0;
  const level = ics?.readinessLevel || 'not_ready';
  const levelLabel = (READINESS[level] || READINESS.not_ready)[language];
  kv(doc, t(language, 'Score total', 'Total score'), `${total} / 100`);
  kv(doc, t(language, 'Niveau de préparation', 'Readiness level'), levelLabel);
  doc.moveDown(0.4);

  const catRows = Object.keys(CATEGORY_LABELS).map((key) => {
    const cat = ics?.breakdown?.[key] || {};
    return [
      CATEGORY_LABELS[key][language],
      String(cat.score ?? 0),
      String(cat.maxScore ?? '—'),
      translateIcs(language, cat.notes || ''),
    ];
  });
  drawSimpleTable(
    doc,
    [
      t(language, 'Catégorie', 'Category'),
      t(language, 'Score', 'Score'),
      t(language, 'Max', 'Max'),
      t(language, 'Notes', 'Notes'),
    ],
    catRows,
    [120, 40, 35, CONTENT_W - 195]
  );

  const missing = ics?.missingItems || [];
  if (missing.length) {
    ensureSpace(doc, 40);
    doc.font('Helvetica-Bold').fillColor(BRAND).fontSize(10).text(t(language, 'Éléments manquants', 'Missing Items'));
    doc.moveDown(0.3);
    doc.font('Helvetica').fillColor('#222').fontSize(9);
    for (const item of missing) {
      ensureSpace(doc, 14);
      doc.text(`• ${translateIcs(language, item)}`);
    }
    doc.moveDown(0.4);
  }

  const recs = ics?.recommendations || [];
  if (recs.length) {
    ensureSpace(doc, 40);
    doc.font('Helvetica-Bold').fillColor(BRAND).fontSize(10).text(t(language, 'Recommandations', 'Recommendations'));
    doc.moveDown(0.3);
    doc.font('Helvetica').fillColor('#222').fontSize(9);
    for (const item of recs) {
      ensureSpace(doc, 14);
      doc.text(`• ${translateIcs(language, item)}`);
    }
  }

  // —— SECTION 4 Members ——
  doc.addPage();
  sectionHeading(doc, t(language, 'Registre des Membres', 'Member Records'));
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND).text(
    t(language, 'Membres plateforme vérifiés', 'Verified platform members')
  );
  doc.moveDown(0.3);
  drawSimpleTable(
    doc,
    [
      t(language, 'Nom', 'Name'),
      t(language, 'Tél.', 'Phone'),
      t(language, 'Village', 'Village'),
      t(language, 'Région', 'Region'),
      t(language, 'Cultures', 'Crops'),
      t(language, 'Ha', 'Hectares'),
      t(language, 'Adhésion', 'Join Date'),
    ],
    platformMembers.slice(0, 80).map((f) => [
      f.nom || '—',
      f.telephone || '—',
      f.localisation || '—',
      f.region || '—',
      (f.cultures || []).slice(0, 3).join(', ') || '—',
      f.superficie != null ? String(f.superficie) : '—',
      formatDDMMYYYY(f.createdAt),
    ]),
    [85, 65, 70, 60, 80, 40, 55]
  );

  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND).text(
    t(language, 'Membres manuels (hors plateforme)', 'Manual (off-platform) members')
  );
  doc.moveDown(0.3);
  drawSimpleTable(
    doc,
    [
      t(language, 'Nom', 'Name'),
      t(language, 'Tél.', 'Phone'),
      t(language, 'Village', 'Village'),
      t(language, 'Région', 'Region'),
      t(language, 'Cultures', 'Crops'),
      t(language, 'Ha', 'Hectares'),
    ],
    manualMembers.slice(0, 80).map((m) => [
      m.fullName || '—',
      m.phone || '—',
      m.village || '—',
      m.region || '—',
      (m.cropTypes || []).slice(0, 3).join(', ') || '—',
      m.hectares != null ? String(m.hectares) : '—',
    ]),
    [100, 70, 75, 70, 100, 40]
  );

  doc
    .font('Helvetica-Bold')
    .fillColor('#222')
    .fontSize(9)
    .text(
      t(
        language,
        `Total : ${platformMembers.length} vérifiés plateforme · ${manualMembers.length} manuels · ${verifiedCount} membres vérifiés (score)`,
        `Total: ${platformMembers.length} verified platform · ${manualMembers.length} manual · ${verifiedCount} verified members (score)`
      )
    );

  // —— SECTION 5 Harvest logs ——
  doc.addPage();
  sectionHeading(doc, t(language, 'Journaux de Récolte', 'Harvest Logs'));
  const shownLogs = harvestLogs.slice(0, 20);
  drawSimpleTable(
    doc,
    [
      t(language, 'Lot', 'Batch ID'),
      t(language, 'Culture', 'Crop'),
      t(language, 'Date', 'Date'),
      t(language, 'Qté (kg)', 'Quantity (kg)'),
      t(language, 'Qualité', 'Quality Grade'),
      t(language, 'Vérifié', 'Verified'),
    ],
    shownLogs.map((l) => [
      l.batchId || '—',
      l.cropType || '—',
      formatDDMMYYYY(l.harvestDate),
      l.quantityKg != null ? String(l.quantityKg) : '—',
      l.qualityGrade || '—',
      l.verifiedByCoop ? t(language, 'Oui', 'Yes') : t(language, 'Non', 'No'),
    ]),
    [95, 80, 60, 60, 70, 50]
  );

  for (const l of shownLogs.filter((x) => x.verifiedByCoop)) {
    ensureSpace(doc, 12);
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(`${l.batchId}: ${TRACE_BASE}/${encodeURIComponent(l.batchId)}`);
  }

  if (harvestLogs.length > 20) {
    doc.moveDown(0.4);
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        t(
          language,
          `${harvestLogs.length - 20} journaux supplémentaires disponibles sur la plateforme`,
          `${harvestLogs.length - 20} additional logs available on the platform`
        )
      );
  }

  // —— SECTION 6 Inputs ——
  doc.addPage();
  sectionHeading(doc, t(language, 'Suivi des Intrants', 'Input Tracking Summary'));
  kv(
    doc,
    t(language, 'Journaux avec intrants', 'Logs with inputs'),
    `${inputSummary.withInputsCount} / ${inputSummary.total}`
  );
  kv(
    doc,
    t(language, 'Part de journaux bio uniquement', 'Organic-only input logs'),
    `${inputSummary.organicPct}%`
  );
  doc.moveDown(0.3);
  drawSimpleTable(
    doc,
    [
      t(language, 'Intrant', 'Input name'),
      t(language, 'Type', 'Type'),
      t(language, 'Quantité totale', 'Total quantity used'),
      t(language, 'Unité', 'Unit'),
    ],
    inputSummary.rows.slice(0, 60).map((r) => [r.name, r.type, String(r.qty), r.unit || '—']),
    [160, 80, 120, 80]
  );

  // —— SECTION 7 Plots ——
  sectionHeading(doc, t(language, 'Documentation des Parcelles', 'Plot Documentation'));
  kv(
    doc,
    t(language, 'Journaux avec GPS', 'Logs with GPS'),
    `${withGps.length} / ${harvestLogs.length}`
  );
  kv(
    doc,
    t(language, 'Journaux avec superficie', 'Logs with plot size'),
    `${withSize.length} / ${harvestLogs.length}`
  );
  doc.moveDown(0.3);
  const plotRows = harvestLogs
    .filter(
      (l) =>
        (l.plotGps?.lat != null && Number.isFinite(Number(l.plotGps.lat))) ||
        Number(l.plotSizeHectares) > 0
    )
    .slice(0, 40)
    .map((l) => [
      l.batchId || '—',
      l.cropType || '—',
      l.plotGps?.lat != null ? String(l.plotGps.lat) : '—',
      l.plotGps?.lng != null ? String(l.plotGps.lng) : '—',
      l.plotSizeHectares != null ? String(l.plotSizeHectares) : '—',
    ]);
  drawSimpleTable(
    doc,
    [
      t(language, 'Lot', 'Batch ID'),
      t(language, 'Culture', 'Crop'),
      'GPS Lat',
      'GPS Lng',
      t(language, 'Superficie (ha)', 'Plot Size (ha)'),
    ],
    plotRows,
    [100, 90, 80, 80, 100]
  );

  // —— SECTION 8 QR ——
  doc.addPage();
  sectionHeading(doc, t(language, 'Codes QR de Traçabilité', 'Traceability QR Codes'));
  if (!qrEntries.length) {
    doc
      .font('Helvetica')
      .fillColor(MUTED)
      .text(t(language, 'Aucun journal vérifié disponible', 'No verified logs available'));
  } else {
    const cellW = CONTENT_W / 3;
    const qrSize = 90;
    let col = 0;
    let rowY = doc.y;

    for (const entry of qrEntries) {
      ensureSpace(doc, qrSize + 36);
      if (col === 0) rowY = doc.y;
      const x = MARGIN + col * cellW;
      try {
        doc.image(entry.buffer, x + (cellW - qrSize) / 2, rowY, { width: qrSize, height: qrSize });
      } catch {
        /* skip */
      }
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#222')
        .text(entry.batchId, x + 4, rowY + qrSize + 4, { width: cellW - 8, align: 'center' });
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(MUTED)
        .text(entry.crop, x + 4, rowY + qrSize + 14, { width: cellW - 8, align: 'center' });

      col += 1;
      if (col >= 3) {
        col = 0;
        doc.y = rowY + qrSize + 32;
      }
    }
    if (col !== 0) doc.y = rowY + qrSize + 32;
  }

  // —— SECTION 9 Declaration ——
  doc.addPage();
  sectionHeading(doc, t(language, 'Déclaration', 'Declaration'));
  doc.font('Helvetica').fontSize(10).fillColor('#222').text(
    t(
      language,
      `Je soussigné(e), responsable de la coopérative ${coopName}, certifie que les informations contenues dans ce dossier sont exactes et complètes à la date du ${dateStr}.`,
      `I, the undersigned, leader of cooperative ${coopName}, certify that the information contained in this dossier is accurate and complete as of ${dateStr}.`
    ),
    { align: 'justify', lineGap: 3 }
  );
  doc.moveDown(2.5);
  doc.font('Helvetica').fontSize(10).fillColor(MUTED);
  const sigLabel = t(language, 'Signature / Date / Cachet', 'Signature / Date / Stamp');
  doc.text(sigLabel);
  doc.moveDown(0.5);
  doc
    .strokeColor('#999')
    .lineWidth(0.8)
    .moveTo(MARGIN, doc.y + 40)
    .lineTo(MARGIN + 220, doc.y + 40)
    .stroke();
  doc
    .moveTo(MARGIN + 260, doc.y + 40)
    .lineTo(MARGIN + 360, doc.y + 40)
    .stroke();
  doc
    .moveTo(MARGIN + 400, doc.y + 40)
    .lineTo(MARGIN + CONTENT_W, doc.y + 40)
    .stroke();

  doc.moveDown(5);
  doc
    .fontSize(8)
    .fillColor('#888')
    .text('Sahel AgriConnect · sahelagriconnect.com', MARGIN, doc.page.height - 50, {
      width: CONTENT_W,
      align: 'center',
    });

  return { doc, filename, cooperativeName: coopName };
}

export default { generateDossierPDF };
