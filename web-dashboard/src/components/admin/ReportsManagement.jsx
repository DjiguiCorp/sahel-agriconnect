import { useEffect, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { mergeCooperativeSources } from './CentralAdminTabs';

const STORAGE_KEY = 'sahel_admin_cooperative_reports';

/**
 * Reports tab: cooperative challenge entry, performance metrics, history.
 * Submissions persist locally (localStorage); history also lists optimization runs from GET /api/optimize/regional.
 */
export default function ReportsTab({ token, isFr }) {
  const [cooperatives, setCooperatives] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeSection, setActiveSection] = useState('challenges');
  const [form, setForm] = useState({
    cooperativeId: '',
    cooperativeName: '',
    period: '',
    season: 'rainy',
    challenges: {
      production: 0,
      sale: 0,
      losses: 0,
      irrigation: 0,
      storage: 0,
      energy: 0,
      conservation: 0,
    },
    challengeNotes: '',
    totalFarmers: '',
    activeMembers: '',
    totalProductionKg: '',
    totalSalesRevenue: '',
    avgRevenuePerFarmer: '',
    recommendations: '',
    submitted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    let cancelled = false;
    setLoadingReports(true);

    const loadLocal = () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch {
        return [];
      }
    };

    Promise.all([
      fetch(`${API_BASE_URL}/api/cooperatives/admin`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations`, { headers }).then((r) => r.json()),
      fetch(API_ENDPOINTS.OPTIMIZE.REGIONAL, { headers }).then((r) => r.json()),
    ])
      .then(([adminJson, platJson, optJson]) => {
        if (cancelled) return;
        const admin = adminJson.cooperatives || [];
        const plat = platJson.registrations || [];
        setCooperatives(mergeCooperativeSources(admin, plat));

        const localReports = loadLocal();
        const optimizations = optJson?.optimizations || [];
        const optRows = optimizations.map((o) => ({
          _id: `opt-${o._id}`,
          cooperativeName: o.region || '—',
          period:
            o.createdAt != null
              ? String(o.createdAt).slice(0, 7)
              : '',
          season: 'rainy',
          totalProductionKg: o.aiRecommendations?.forecast?.yieldEstimate ?? '',
          totalSalesRevenue: '',
          challengeNotes: o.crop ? `${o.crop} · ${o.superficie ?? '—'} ha` : '',
          source: 'optimization',
          submittedAt: o.createdAt || o.updatedAt,
        }));

        const merged = [...localReports, ...optRows].sort((a, b) => {
          const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
          return tb - ta;
        });
        setReports(merged);
      })
      .catch(() => {
        if (!cancelled) {
          setCooperatives([]);
          setReports(loadLocal());
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReports(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const challengeKeys = ['production', 'sale', 'losses', 'irrigation', 'storage', 'energy', 'conservation'];
  const challengeLabels = {
    production: { en: 'Production', fr: 'Production', icon: '🌾' },
    sale: { en: 'Sales', fr: 'Ventes', icon: '💰' },
    losses: { en: 'Post-harvest Losses', fr: 'Pertes post-récolte', icon: '📉' },
    irrigation: { en: 'Irrigation', fr: 'Irrigation', icon: '💧' },
    storage: { en: 'Storage', fr: 'Stockage', icon: '🏠' },
    energy: { en: 'Energy', fr: 'Énergie', icon: '⚡' },
    conservation: { en: 'Conservation', fr: 'Conservation', icon: '🌿' },
  };

  const setChallenge = (key, value) => {
    setForm((f) => ({ ...f, challenges: { ...f.challenges, [key]: Number(value) } }));
  };

  const onCoopChange = (e) => {
    const coop = cooperatives.find((c) => c._id === e.target.value);
    setForm((f) => ({
      ...f,
      cooperativeId: e.target.value,
      cooperativeName: coop ? coop.cooperativeName || coop.nomCooperative || '' : '',
      totalFarmers: coop ? String(coop.memberCount ?? coop.nombreMembres ?? '') : '',
    }));
  };

  const persistReport = (entry) => {
    const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const next = [entry, ...prev];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setReports((r) => {
      const optOnly = r.filter((x) => String(x._id || '').startsWith('opt-'));
      return [...next, ...optOnly].sort((a, b) => {
        const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
        return tb - ta;
      });
    });
  };

  const submitReport = async () => {
    if (!form.cooperativeId || !form.period) return;
    setSubmitting(true);
    try {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `r-${Date.now()}`;
      const base = {
        _id: id,
        cooperativeId: form.cooperativeId,
        cooperativeName: form.cooperativeName,
        period: form.period,
        season: form.season,
        submittedAt: new Date().toISOString(),
      };

      if (activeSection === 'performance') {
        persistReport({
          ...base,
          reportType: 'performance',
          totalFarmers: form.totalFarmers,
          activeMembers: form.activeMembers,
          totalProductionKg: form.totalProductionKg,
          totalSalesRevenue: form.totalSalesRevenue,
          recommendations: form.recommendations,
        });
      } else {
        persistReport({
          ...base,
          reportType: 'cooperative_challenges',
          challenges: { ...form.challenges },
          challengeNotes: form.challengeNotes,
        });
      }

      setSubmitSuccess(true);
      setForm((f) => ({
        ...f,
        cooperativeId: '',
        period: '',
        challengeNotes: '',
        totalProductionKg: '',
        totalSalesRevenue: '',
        recommendations: '',
        challenges: {
          production: 0,
          sale: 0,
          losses: 0,
          irrigation: 0,
          storage: 0,
          energy: 0,
          conservation: 0,
        },
      }));
      setTimeout(() => setSubmitSuccess(false), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const totalChallenges = Object.values(form.challenges).reduce((a, b) => a + b, 0);
  const topChallenge = challengeKeys.reduce((a, b) =>
    form.challenges[a] >= form.challenges[b] ? a : b
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? 'Rapports & Analyses' : 'Reports & Analytics'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? "Données réelles saisies par les coopératives et l'équipe admin"
              : 'Real data entered by cooperatives and admin team'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        {[
          { key: 'challenges', label: isFr ? '📊 Défis agriculteurs' : '📊 Farmer Challenges' },
          { key: 'performance', label: isFr ? '📈 Performance' : '📈 Performance' },
          { key: 'history', label: isFr ? '📋 Historique' : '📋 History' },
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeSection === s.key
                ? 'border-brand-forest text-brand-forest'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'challenges' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-brand-forest text-lg mb-1">
              📝 {isFr ? 'Nouveau rapport — Défis rencontrés' : 'New Report — Challenges Encountered'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {isFr
                ? "Saisissez le nombre d'agriculteurs affectés par chaque défi pour cette période."
                : 'Enter the number of farmers affected by each challenge for this period.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Coopérative' : 'Cooperative'} *
                </label>
                <select
                  value={form.cooperativeId}
                  onChange={onCoopChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  {cooperatives.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.cooperativeName || c.nomCooperative}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Période (mois/an)' : 'Period (month/year)'} *
                </label>
                <input
                  type="month"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Saison' : 'Season'}
                </label>
                <select
                  value={form.season}
                  onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="rainy">{isFr ? 'Saison des pluies' : 'Rainy Season'}</option>
                  <option value="dry">{isFr ? 'Saison sèche' : 'Dry Season'}</option>
                </select>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">
              {isFr ? "Nombre d'agriculteurs affectés par défi :" : 'Number of farmers affected per challenge:'}
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              {challengeKeys.map((key) => (
                <div key={key} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <span>{challengeLabels[key].icon}</span>
                      {isFr ? challengeLabels[key].fr : challengeLabels[key].en}
                    </label>
                    <span
                      className={`text-lg font-bold font-mono ${form.challenges[key] > 0 ? 'text-red-600' : 'text-gray-300'}`}
                    >
                      {form.challenges[key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.challenges[key]}
                    onChange={(e) => setChallenge(key, e.target.value)}
                    className="w-full accent-brand-forest"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>{isFr ? 'agriculteurs' : 'farmers'}</span>
                    <span>100+</span>
                  </div>
                </div>
              ))}
            </div>

            {totalChallenges > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: '#FFF9E6', border: '1px solid #B5850A' }}>
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  📊 {isFr ? 'Résumé automatique' : 'Auto Summary'}
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-amber-700 font-mono">{totalChallenges}</p>
                    <p className="text-xs text-amber-600">{isFr ? 'Total signalements' : 'Total reports'}</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600 font-mono">{form.challenges[topChallenge]}</p>
                    <p className="text-xs text-red-500">
                      {isFr
                        ? `Défi principal: ${challengeLabels[topChallenge].fr}`
                        : `Top challenge: ${challengeLabels[topChallenge].en}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-brand-forest font-mono">{form.totalFarmers || '—'}</p>
                    <p className="text-xs text-gray-500">{isFr ? 'Membres total' : 'Total members'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFr ? 'Notes et contexte des défis' : 'Challenge notes and context'}
              </label>
              <textarea
                value={form.challengeNotes}
                onChange={(e) => setForm((f) => ({ ...f, challengeNotes: e.target.value }))}
                rows={3}
                placeholder={
                  isFr
                    ? 'Décrivez les causes, le contexte, les actions déjà prises...'
                    : 'Describe causes, context, actions already taken...'
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
              />
            </div>

            {submitSuccess && activeSection === 'challenges' && (
              <div className="rounded-xl p-3 mb-3 bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                ✓ {isFr ? 'Rapport enregistré avec succès.' : 'Report saved successfully.'}
              </div>
            )}

            <button
              type="button"
              onClick={submitReport}
              disabled={submitting || !form.cooperativeId || !form.period}
              className="w-full bg-brand-forest text-white rounded-xl py-3 font-bold text-sm disabled:opacity-40 hover:bg-brand-forest/90 transition"
            >
              {submitting
                ? isFr
                  ? 'Enregistrement...'
                  : 'Saving...'
                : isFr
                  ? '💾 Enregistrer le rapport'
                  : '💾 Save Report'}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'performance' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-brand-forest text-lg mb-1">
              📈 {isFr ? 'Rapport de performance' : 'Performance Report'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {isFr
                ? 'Données de production et revenus réels par coopérative.'
                : 'Real production and revenue data by cooperative.'}
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Coopérative' : 'Cooperative'}
                </label>
                <select
                  value={form.cooperativeId}
                  onChange={onCoopChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  {cooperatives.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.cooperativeName || c.nomCooperative}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Période' : 'Period'}
                </label>
                <input
                  type="month"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {[
                {
                  key: 'totalFarmers',
                  label: isFr ? "Nombre total d'agriculteurs" : 'Total farmers',
                  icon: '👩‍🌾',
                  type: 'number',
                },
                {
                  key: 'activeMembers',
                  label: isFr ? 'Membres actifs ce mois' : 'Active members this month',
                  icon: '✅',
                  type: 'number',
                },
                {
                  key: 'totalProductionKg',
                  label: isFr ? 'Production totale (kg)' : 'Total production (kg)',
                  icon: '🌾',
                  type: 'number',
                },
                {
                  key: 'totalSalesRevenue',
                  label: isFr ? 'Revenus des ventes (USD)' : 'Sales revenue (USD)',
                  icon: '💰',
                  type: 'number',
                },
              ].map(({ key, label, icon, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {icon} {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFr ? 'Recommandations pour la prochaine période' : 'Recommendations for next period'}
              </label>
              <textarea
                value={form.recommendations}
                onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))}
                rows={3}
                placeholder={
                  isFr
                    ? 'Actions recommandées, besoins en équipement, formation nécessaire...'
                    : 'Recommended actions, equipment needs, training required...'
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
              />
            </div>
            {form.totalSalesRevenue && form.totalFarmers && Number(form.totalFarmers) > 0 && (
              <div className="rounded-xl p-3 mb-4 bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">
                  💡 {isFr ? 'Revenu moyen par agriculteur: ' : 'Avg revenue per farmer: '}
                  <strong>
                    ${(Number(form.totalSalesRevenue) / Number(form.totalFarmers)).toFixed(2)}
                  </strong>
                </p>
              </div>
            )}
            {submitSuccess && activeSection === 'performance' && (
              <div className="rounded-xl p-3 mb-3 bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                ✓ {isFr ? 'Rapport de performance enregistré.' : 'Performance report saved.'}
              </div>
            )}
            <button
              type="button"
              onClick={submitReport}
              disabled={submitting || !form.cooperativeId || !form.period}
              className="w-full bg-brand-forest text-white rounded-xl py-3 font-bold text-sm disabled:opacity-40 hover:bg-brand-forest/90 transition"
            >
              {submitting ? '...' : isFr ? '💾 Enregistrer le rapport' : '💾 Save Report'}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-brand-forest">
              {isFr ? 'Historique des rapports' : 'Report History'}
            </h3>
            <span className="text-xs text-gray-400">
              {reports.length} {isFr ? 'rapports' : 'reports'}
            </span>
          </div>
          {loadingReports ? (
            <div className="text-center py-8 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 font-medium">
                {isFr ? 'Aucun rapport enregistré.' : 'No reports saved yet.'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {isFr ? 'Les rapports soumis apparaîtront ici.' : 'Submitted reports will appear here.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveSection('challenges')}
                className="mt-3 text-brand-forest text-sm font-semibold hover:underline"
              >
                + {isFr ? 'Créer le premier rapport' : 'Create first report'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report, i) => (
                <div key={report._id || i} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-brand-forest">{report.cooperativeName || '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {report.period || '—'} ·{' '}
                        {report.season === 'rainy'
                          ? isFr
                            ? 'Saison des pluies'
                            : 'Rainy Season'
                          : isFr
                            ? 'Saison sèche'
                            : 'Dry Season'}
                        {report.source === 'optimization' ? (
                          <span className="ml-2 text-[10px] uppercase text-gray-400">optimization</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {report.totalProductionKg !== '' && report.totalProductionKg != null && (
                        <p className="text-sm font-mono font-bold text-brand-forest">
                          {Number(report.totalProductionKg).toLocaleString()} kg
                        </p>
                      )}
                      {report.totalSalesRevenue !== '' && report.totalSalesRevenue != null && (
                        <p className="text-xs text-green-600">
                          ${Number(report.totalSalesRevenue).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {report.challengeNotes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{report.challengeNotes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
