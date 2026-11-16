import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const CATEGORY_META = {
  memberRecords: {
    fr: 'Dossiers membres',
    en: 'Member records',
  },
  harvestLogs: {
    fr: 'Journaux de récolte',
    en: 'Harvest logs',
  },
  inputTracking: {
    fr: 'Suivi des intrants',
    en: 'Input tracking',
  },
  plotDocumentation: {
    fr: 'Documentation des parcelles',
    en: 'Plot documentation',
  },
  coopVerification: {
    fr: 'Vérification coopérative',
    en: 'Coop verification',
  },
  subscriptionActive: {
    fr: 'Abonnement actif',
    en: 'Active subscription',
  },
};

const READINESS = {
  not_ready: {
    fr: 'Non prêt',
    en: 'Not Ready',
    color: '#dc2626',
    bg: 'bg-red-100 text-red-700',
  },
  developing: {
    fr: 'En développement',
    en: 'Developing',
    color: '#ea580c',
    bg: 'bg-orange-100 text-orange-700',
  },
  nearly_ready: {
    fr: 'Presque prêt',
    en: 'Nearly Ready',
    color: '#ca8a04',
    bg: 'bg-yellow-100 text-yellow-800',
  },
  audit_ready: {
    fr: 'Prêt pour l’audit',
    en: 'Audit Ready',
    color: '#16a34a',
    bg: 'bg-green-100 text-green-700',
  },
};

const ICS_I18N = {
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

function parseNoteToken(raw) {
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

function fillTemplate(template, params = {}) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    params[name] != null ? String(params[name]) : `{${name}}`
  );
}

function tIcs(lang, key, params = {}) {
  const map = ICS_I18N[lang] || ICS_I18N.en;
  const fallback = ICS_I18N.en;
  const template = map[key] || fallback[key] || key;
  return fillTemplate(template, params);
}

function translatePlan(lang, plan) {
  const p = String(plan || 'free').toLowerCase();
  if (p === 'growth') return tIcs(lang, 'plan_growth');
  if (p === 'starter') return tIcs(lang, 'plan_starter');
  return tIcs(lang, 'plan_free');
}

function translateNote(lang, raw) {
  // Legacy English notes (pre-key scores) — keep readable until recompute
  if (!raw) return '';
  if (!raw.includes('|') && !raw.startsWith('note_') && !ICS_I18N.en[raw]) {
    return raw;
  }

  const { key, params } = parseNoteToken(raw);

  if (key === 'note_coop_verification') {
    const parts = [];
    if (params.email === '1') parts.push(tIcs(lang, 'note_coop_email'));
    if (params.document === '1') parts.push(tIcs(lang, 'note_coop_document'));
    if (Number(params.declared) > 0) {
      parts.push(tIcs(lang, 'note_coop_declared', { count: params.declared }));
    }
    if (params.plan && params.plan !== 'free') {
      parts.push(tIcs(lang, 'note_coop_plan', { plan: translatePlan(lang, params.plan) }));
    }
    return parts.length ? parts.join(lang === 'fr' ? ' ; ' : '; ') : tIcs(lang, 'note_coop_none');
  }

  if (key === 'verify_more_members' || key === 'record_more_harvest_logs') {
    return tIcs(lang, key, { count: params.count ?? 'X' });
  }

  return tIcs(lang, key, params);
}

function translateListItem(lang, raw) {
  const { key, params } = parseNoteToken(raw);
  if (key === 'verify_more_members' || key === 'record_more_harvest_logs') {
    return tIcs(lang, key, { count: params.count ?? 'X' });
  }
  const translated = tIcs(lang, key, params);
  // If unknown legacy English string, show as-is
  return translated === key && raw.includes(' ') ? raw : translated;
}

function gaugeColor(total) {
  if (total >= 75) return '#16a34a';
  if (total >= 50) return '#ca8a04';
  if (total >= 25) return '#ea580c';
  return '#dc2626';
}

function CircularGauge({ value }) {
  const total = Math.max(0, Math.min(100, Number(value) || 0));
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (total / 100) * c;
  const color = gaugeColor(total);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>
          {total}
        </span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

export default function ICSScorePanel({ API, headers, isFr }) {
  const lang = isFr ? 'fr' : 'en';
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!API || !headers?.Authorization) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/ics-scores/my`, { headers });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || (isFr ? 'Échec du chargement du score ICS' : 'Failed to load ICS score'));
      setScore(d.score || null);
    } catch (e) {
      setError(e.message || (isFr ? 'Erreur' : 'Error'));
      setScore(null);
    } finally {
      setLoading(false);
    }
  }, [API, headers, isFr]);

  useEffect(() => {
    load();
  }, [load]);

  const recompute = async () => {
    setRecomputing(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/ics-scores/recompute`, {
        method: 'POST',
        headers,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || (isFr ? 'Échec du recalcul' : 'Failed to recompute'));
      setScore(d.score || null);
    } catch (e) {
      setError(e.message || (isFr ? 'Erreur' : 'Error'));
    } finally {
      setRecomputing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-forest" />
      </div>
    );
  }

  const total = score?.scoreTotal ?? 0;
  const level = score?.readinessLevel || 'not_ready';
  const readiness = READINESS[level] || READINESS.not_ready;
  const breakdown = score?.breakdown || {};

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#1a3c2e] text-lg">
            {isFr ? '📊 Score ICS' : '📊 ICS Score'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-lg">
            {isFr
              ? 'Indice de préparation à la certification biologique (système de contrôle interne).'
              : 'Internal Control System readiness for organic certification.'}
          </p>
        </div>
        <button
          type="button"
          onClick={recompute}
          disabled={recomputing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a3c2e] text-white text-sm font-bold hover:bg-[#244d3c] disabled:opacity-50"
        >
          {recomputing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isFr ? 'Recalculer' : 'Recalculate'}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
      ) : null}

      <div className="flex flex-col items-center gap-3 py-2">
        <CircularGauge value={total} />
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${readiness.bg}`}>
          {isFr ? readiness.fr : readiness.en}
        </span>
        {score?.lastComputedAt ? (
          <p className="text-[11px] text-gray-400">
            {isFr ? 'Dernier calcul :' : 'Last computed:'}{' '}
            {new Date(score.lastComputedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US')}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase text-gray-400 border-b border-gray-100">
              <th className="pb-2 pr-3 font-semibold">{isFr ? 'Catégorie' : 'Category'}</th>
              <th className="pb-2 pr-3 font-semibold">{isFr ? 'Score' : 'Score'}</th>
              <th className="pb-2 font-semibold min-w-[140px]">{isFr ? 'Progression' : 'Progress'}</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(CATEGORY_META).map((key) => {
              const cat = breakdown[key] || { score: 0, maxScore: CATEGORY_META[key] ? undefined : 0 };
              const max = Number(cat.maxScore) || 1;
              const val = Number(cat.score) || 0;
              const pct = Math.round((val / max) * 100);
              const meta = CATEGORY_META[key];
              const noteText = cat.notes ? translateNote(lang, cat.notes) : '';
              return (
                <tr key={key} className="border-b border-gray-50">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-gray-800">{isFr ? meta.fr : meta.en}</p>
                    {noteText ? <p className="text-xs text-gray-400 mt-0.5">{noteText}</p> : null}
                  </td>
                  <td className="py-3 pr-3 font-mono text-brand-forest whitespace-nowrap">
                    {val}/{max}
                  </td>
                  <td className="py-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#1a3c2e] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {Array.isArray(score?.missingItems) && score.missingItems.length > 0 ? (
        <div>
          <h4 className="font-bold text-sm text-[#1a3c2e] mb-2">
            {isFr ? 'Éléments manquants' : 'Missing Items'}
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {score.missingItems.map((item) => (
              <li key={item}>{translateListItem(lang, item)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {Array.isArray(score?.recommendations) && score.recommendations.length > 0 ? (
        <div>
          <h4 className="font-bold text-sm text-[#1a3c2e] mb-2">
            {isFr ? 'Recommandations' : 'Recommendations'}
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {score.recommendations.map((item) => (
              <li key={item}>{translateListItem(lang, item)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { gaugeColor, READINESS };
