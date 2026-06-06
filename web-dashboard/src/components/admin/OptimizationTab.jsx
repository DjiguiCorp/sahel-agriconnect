import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { mergeCooperativeSources } from './CentralAdminTabs';

function headersWith(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function coopLabel(c) {
  return c.cooperativeName || c.nomCooperative || c.nom || '';
}

/** Pick a farmer ID for optimization POST (schema requires farmerId). */
function pickFarmerId(farmers, coop) {
  if (!farmers.length) return null;
  if (!coop) return farmers[0]._id || farmers[0].id;
  const name = coopLabel(coop).trim();
  const match = farmers.find((f) =>
    String(f.nomCooperative || '')
      .toLowerCase()
      .includes(name.slice(0, Math.min(14, name.length)).toLowerCase())
  );
  return (match || farmers[0])._id || (match || farmers[0]).id;
}

export default function OptimizationTab({ token, isFr }) {
  const [cooperatives, setCooperatives] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [selectedCoop, setSelectedCoop] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [season, setSeason] = useState('rainy');
  const [commodity, setCommodity] = useState('Shea Butter');
  const [generating, setGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [optimizations, setOptimizations] = useState([]);

  const headers = headersWith(token);

  const load = useCallback(async () => {
    const h = headersWith(token);
    try {
      const [adminJ, platJ, farmJ, optJ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/cooperatives/admin`, { headers: h }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations`, { headers: h }).then((r) =>
          r.json()
        ),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=800`, { headers: h }).then((r) => r.json()),
        fetch(API_ENDPOINTS.OPTIMIZE.REGIONAL, { headers: h }).then((r) => r.json()),
      ]);
      const admin = adminJ.cooperatives || [];
      const plat = platJ.registrations || [];
      setCooperatives(mergeCooperativeSources(admin, plat));
      const fl = Array.isArray(farmJ) ? farmJ : farmJ.farmers || [];
      setFarmers(fl);
      setOptimizations(optJ.optimizations || []);
    } catch {
      setCooperatives([]);
      setFarmers([]);
      setOptimizations([]);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedCoopData = useMemo(
    () => cooperatives.find((c) => c._id === selectedCoop),
    [cooperatives, selectedCoop]
  );

  const coopFarmers = useMemo(() => {
    if (!selectedCoop || !selectedCoopData) return [];
    const name = coopLabel(selectedCoopData);
    return farmers.filter((f) =>
      String(f.nomCooperative || '')
        .toLowerCase()
        .includes(name.slice(0, 12).toLowerCase())
    );
  }, [farmers, selectedCoop, selectedCoopData]);

  const generateRecommendation = async () => {
    const farmerId = pickFarmerId(farmers, selectedCoopData);
    if (!farmerId) {
      alert(isFr ? 'Aucun agriculteur trouvé dans les données.' : 'No farmer found in data.');
      return;
    }

    const regionRaw =
      selectedRegion ||
      selectedCoopData?.regionCity ||
      selectedCoopData?.country ||
      selectedCoopData?.pays ||
      farmers.find((f) => String(f._id) === String(farmerId))?.region ||
      'Sahel';
    const region = String(regionRaw).split(',')[0].trim();
    const saison = season === 'rainy' ? 'Pluvieuse' : 'Sèche';
    const superficie = Math.max(
      1,
      Number(selectedCoopData?.memberCount || coopFarmers.length || 2)
    );

    const context = {
      cooperativeName: selectedCoopData ? coopLabel(selectedCoopData) : 'General',
      country: selectedCoopData?.country || selectedCoopData?.pays || 'West Africa',
      region: selectedRegion || selectedCoopData?.regionCity || region,
      memberCount: selectedCoopData?.memberCount ?? coopFarmers.length ?? 0,
      commodity,
      season,
      certificationLevel: selectedCoopData?.certificationStatus || 'None',
      interests: selectedCoopData?.interests || [],
    };

    const promptText = `Generate specific agricultural optimization recommendations for ${context.cooperativeName} cooperative in ${context.region}, ${context.country}. They focus on ${commodity} during the ${season} season. They have ${context.memberCount} member farmers and current certification level is ${context.certificationLevel}. Provide: 1) Top 3 production improvements, 2) Market opportunity this season, 3) Equipment recommendation, 4) Certification next step, 5) Expected yield improvement percentage.`;

    setGenerating(true);
    setRecommendation(null);
    try {
      const res = await fetch(API_ENDPOINTS.OPTIMIZE.PRODUCTION, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          farmerId,
          region,
          crop: commodity,
          superficie,
          saison,
          currentPractices: {
            autres: JSON.stringify({
              requestType: 'admin_optimization',
              context,
              prompt: promptText,
            }),
            irrigation: season === 'dry' ? (isFr ? 'À évaluer' : 'To assess') : (isFr ? 'Pluvial' : 'Rain-fed'),
          },
          soilConditions: {
            autres: selectedCoopData
              ? `${isFr ? 'Coopérative' : 'Cooperative'}: ${coopLabel(selectedCoopData)}`
              : 'Admin regional optimization',
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Request failed');
      }
      setRecommendation(data.optimization || data);
    } catch (err) {
      setRecommendation({
        error: true,
        message:
          err.message ||
          (isFr ? 'Erreur lors de la génération. Réessayez.' : 'Error generating. Please try again.'),
      });
    } finally {
      setGenerating(false);
    }
  };

  const totalArea = optimizations.reduce((s, o) => s + (Number(o.superficie) || 0), 0);
  const totalYield = optimizations.reduce(
    (s, o) => s + (Number(o.aiRecommendations?.forecast?.yieldEstimate) || 0),
    0
  );

  const formatRecommendationOutput = (rec) => {
    if (!rec || rec.error) return '';
    const ai = rec.aiRecommendations || rec;
    if (typeof ai === 'string') return ai;
    const parts = [];
    if (Array.isArray(ai.recommendations)) {
      parts.push(
        ai.recommendations
          .map(
            (r) =>
              `• ${r.title || r.category || ''}: ${r.description || ''}${r.priority ? ` (${r.priority})` : ''}`
          )
          .join('\n')
      );
    }
    if (ai.forecast) {
      parts.push(
        `\n${isFr ? 'Estimation rendement' : 'Yield estimate'}: ${ai.forecast.yieldEstimate ?? '—'} (${isFr ? 'confiance' : 'confidence'} ${ai.forecast.confidence ?? '—'}%)`
      );
    }
    if (ai.budget?.total != null) {
      parts.push(`\n${isFr ? 'Budget indicatif' : 'Indicative budget'}: ${ai.budget.total}`);
    }
    return parts.join('\n') || JSON.stringify(rec, null, 2);
  };

  const emailBody = () => {
    const rec = recommendation;
    if (!rec || rec.error) return '';
    return encodeURIComponent(formatRecommendationOutput(rec));
  };

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-forest">
          {isFr ? 'Optimisation de Production — IA' : 'Production Optimization — AI'}
        </h2>
        <p className="text-gray-500 text-sm">
          {isFr
            ? 'Recommandations basées sur les coopératives réelles et POST /api/optimize/production'
            : 'Recommendations using real cooperatives via POST /api/optimize/production'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: isFr ? 'Coopératives actives' : 'Active Cooperatives',
            value: cooperatives.length,
            icon: '🤝',
          },
          {
            label: isFr ? 'Superficie totale (ha)' : 'Total Area (ha)',
            value: totalArea.toFixed(1),
            icon: '🌾',
          },
          {
            label: isFr ? 'Rendement estimé (t)' : 'Estimated Yield (t)',
            value: totalYield.toFixed(2),
            icon: '📊',
          },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <span className="text-2xl">{icon}</span>
            <p className="text-2xl font-bold font-mono text-brand-forest mt-1">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-brand-forest text-lg mb-1">
          🤖 {isFr ? 'Générer des recommandations IA' : 'Generate AI Recommendations'}
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          {isFr
            ? 'Sélectionnez une coopérative pour contextualiser la région et les membres ; un agriculteur réel est lié à la requête API.'
            : 'Select a cooperative for context; a real farmer ID is required by the optimization API.'}
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFr ? 'Coopérative (optionnel)' : 'Cooperative (optional)'}
            </label>
            <select
              value={selectedCoop}
              onChange={(e) => setSelectedCoop(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
            >
              <option value="">{isFr ? 'Toutes les coopératives' : 'All cooperatives'}</option>
              {cooperatives.map((c) => (
                <option key={c._id} value={c._id}>
                  {coopLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFr ? 'Commodité principale' : 'Main Commodity'}
            </label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
            >
              {['Shea Butter', 'Sesame', 'Cashew', 'Mango', 'Rice', 'Cotton', 'Millet', 'Sorghum'].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFr ? 'Saison' : 'Season'}
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
            >
              <option value="rainy">
                {isFr ? '🌧️ Saison des pluies (Juin–Oct)' : '🌧️ Rainy Season (Jun–Oct)'}
              </option>
              <option value="dry">
                {isFr ? '☀️ Saison sèche (Nov–Mai)' : '☀️ Dry Season (Nov–May)'}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFr ? 'Région (si différente)' : 'Region (if different)'}
            </label>
            <input
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              placeholder={
                selectedCoopData?.regionCity || (isFr ? 'ex: Sikasso, Mali' : 'e.g. Sikasso, Mali')
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
            />
          </div>
        </div>

        {selectedCoopData ? (
          <div className="bg-[#1a3c2e]/5 rounded-xl p-3 mb-4 border border-[#1a3c2e]/10">
            <p className="text-xs font-semibold text-brand-forest mb-1">
              {isFr ? '📋 Contexte chargé depuis la base de données:' : '📋 Context loaded from database:'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
              <span>🌍 {selectedCoopData.country || selectedCoopData.pays || '—'}</span>
              <span>
                👥 {selectedCoopData.memberCount ?? coopFarmers.length ?? '?'}{' '}
                {isFr ? 'membres' : 'members'}
              </span>
              <span>⭐ {selectedCoopData.certificationStatus || 'None'}</span>
              <span>🌾 {selectedCoopData.primaryCrops?.[0] || commodity}</span>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={generateRecommendation}
          disabled={generating || farmers.length === 0}
          className="w-full bg-brand-forest text-white rounded-xl py-3 font-bold text-sm disabled:opacity-50 hover:bg-brand-forest/90 transition flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="animate-spin inline-block">⚙️</span>{' '}
              {isFr ? 'Analyse en cours...' : 'Analyzing...'}
            </>
          ) : (
            <>
              {isFr ? '🤖 Générer les recommandations IA' : '🤖 Generate AI Recommendations'}
            </>
          )}
        </button>
      </div>

      {recommendation && !recommendation.error && (
        <div className="bg-white rounded-2xl border border-[#1a3c2e]/20 p-5">
          <h3 className="font-bold text-brand-forest text-lg mb-3">
            ✅ {isFr ? 'Recommandations générées' : 'Generated Recommendations'}
          </h3>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {formatRecommendationOutput(recommendation)}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(formatRecommendationOutput(recommendation));
              }}
              className="text-xs text-brand-forest border border-brand-forest px-3 py-1.5 rounded-lg hover:bg-brand-forest/5 transition"
            >
              📋 {isFr ? 'Copier' : 'Copy'}
            </button>
            <a
              href={`mailto:${selectedCoopData?.email || 'support@woneapp.com'}?subject=${encodeURIComponent('Recommandations IA — Sahel AgriConnect')}&body=${emailBody()}`}
              className="text-xs text-white bg-brand-forest px-3 py-1.5 rounded-lg hover:bg-brand-forest/90 transition"
            >
              📧 {isFr ? 'Envoyer à la coopérative' : 'Send to Cooperative'}
            </a>
          </div>
        </div>
      )}
      {recommendation?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {recommendation.message}
        </div>
      )}
    </div>
  );
}
