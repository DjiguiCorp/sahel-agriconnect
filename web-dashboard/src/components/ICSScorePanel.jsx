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
      if (!r.ok) throw new Error(d.error || 'Failed to load ICS score');
      setScore(d.score || null);
    } catch (e) {
      setError(e.message || 'Error');
      setScore(null);
    } finally {
      setLoading(false);
    }
  }, [API, headers]);

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
      if (!r.ok) throw new Error(d.error || 'Failed to recompute');
      setScore(d.score || null);
    } catch (e) {
      setError(e.message || 'Error');
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
            {new Date(score.lastComputedAt).toLocaleString()}
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
              return (
                <tr key={key} className="border-b border-gray-50">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-gray-800">{isFr ? meta.fr : meta.en}</p>
                    {cat.notes ? <p className="text-xs text-gray-400 mt-0.5">{cat.notes}</p> : null}
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
              <li key={item}>{item}</li>
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
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { gaugeColor, READINESS };
