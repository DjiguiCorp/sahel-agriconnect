import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function deriveSeasonKey(country) {
  const c = String(country || '').trim();
  return ['Mali', 'Burkina Faso', 'Niger'].includes(c) ? 'rainy' : 'dry';
}

export default function SeasonalPlanning() {
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith('fr');
  const [season, setSeason] = useState('rainy');
  const [farmers, setFarmers] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cooperativeId: '',
    farmerId: '',
    season: 'rainy',
    year: new Date().getFullYear(),
    cropType: 'Shea Butter',
    superficieHa: '2',
    plantingDate: '',
    harvestDate: '',
    irrigationNeeded: false,
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    const headers = authHeaders();
    try {
      const [coopRes, farmRes, optRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/cooperatives/admin`, { headers }),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=500`, { headers }),
        fetch(API_ENDPOINTS.OPTIMIZE.REGIONAL, { headers }),
      ]);
      const coopJson = await coopRes.json().catch(() => ({}));
      const farmJson = await farmRes.json().catch(() => ({}));
      const optJson = await optRes.json().catch(() => ({}));

      setCooperatives(coopJson.cooperatives || []);
      const flist = Array.isArray(farmJson) ? farmJson : farmJson.farmers || [];
      setFarmers(flist);
      setRegional(optJson?.success ? optJson : null);
    } catch {
      setLoadErr(isFr ? 'Erreur de chargement' : 'Load error');
    } finally {
      setLoading(false);
    }
  }, [isFr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const seasons = useMemo(
    () => [
      {
        key: 'rainy',
        emoji: '🌧️',
        label: isFr ? 'Saison des pluies' : 'Rainy Season',
        months: isFr ? 'Juin — Octobre' : 'June — October',
        crops: ['Sesame', 'Millet', 'Sorghum', 'Rice'],
      },
      {
        key: 'dry',
        emoji: '☀️',
        label: isFr ? 'Saison sèche' : 'Dry Season',
        months: isFr ? 'Novembre — Mai' : 'November — May',
        crops: ['Shea Butter', 'Cashew', 'Mango'],
      },
    ],
    [isFr]
  );

  const farmersForSeason = useMemo(() => {
    return farmers.filter((f) => deriveSeasonKey(f.country) === season);
  }, [farmers, season]);

  const optimizations = regional?.optimizations || [];
  const forecast = regional?.forecast;

  const savePlan = async () => {
    if (!form.farmerId) {
      alert(isFr ? 'Choisir un agriculteur' : 'Select a farmer');
      return;
    }
    setSaving(true);
    try {
      const coop = cooperatives.find((c) => c._id === form.cooperativeId);
      const farmer = farmers.find((f) => String(f._id || f.id) === String(form.farmerId));
      const regionRaw = farmer?.region || coop?.region || coop?.localisation || 'Sahel';
      const region = String(regionRaw).split(',')[0].trim();
      const saison = form.season === 'rainy' ? 'Pluvieuse' : 'Sèche';
      const body = {
        farmerId: form.farmerId,
        region,
        crop: form.cropType,
        superficie: Math.max(0.1, parseFloat(String(form.superficieHa).replace(',', '.')) || 1),
        saison,
        currentPractices: {
          irrigation:
            form.irrigationNeeded
              ? isFr
                ? 'Irrigation nécessaire'
                : 'Irrigation needed'
              : isFr
                ? 'Pluvial'
                : 'Rain-fed',
          autres: [
            `${isFr ? 'Année' : 'Year'} ${form.year}`,
            form.plantingDate && `${isFr ? 'Semis' : 'Planting'}: ${form.plantingDate}`,
            form.harvestDate && `${isFr ? 'Récolte' : 'Harvest'}: ${form.harvestDate}`,
            coop && `${isFr ? 'Coopérative' : 'Cooperative'}: ${coop.nom || coop.name}`,
            form.notes,
          ]
            .filter(Boolean)
            .join(' | '),
        },
        soilConditions: {
          autres: form.notes || '',
        },
      };
      const res = await fetch(API_ENDPOINTS.OPTIMIZE.PRODUCTION, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Request failed');
      }
      setShowForm(false);
      setForm((prev) => ({
        ...prev,
        farmerId: '',
        notes: '',
        plantingDate: '',
        harvestDate: '',
      }));
      await loadData();
    } catch (e) {
      alert(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? 'Planification Saisonnière' : 'Seasonal Planning'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? 'Cycles de culture, agriculteurs, et optimisations de production (API)'
              : 'Crop cycles, farmers, and production optimizations (API)'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-forest/90 transition"
        >
          + {isFr ? 'Nouveau plan' : 'New Plan'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-12 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
          <span className="text-sm">{isFr ? 'Chargement…' : 'Loading…'}</span>
        </div>
      ) : null}

      {loadErr ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">{loadErr}</div>
      ) : null}

      {/* Season cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {seasons.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSeason(s.key)}
            className={`text-left rounded-2xl p-5 cursor-pointer border-2 transition ${
              season === s.key
                ? 'border-brand-forest bg-brand-forest/5'
                : 'border-gray-200 bg-white hover:border-brand-forest/40'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl" aria-hidden>
                {s.emoji}
              </span>
              <div>
                <p className="font-bold text-brand-forest">{s.label}</p>
                <p className="text-xs text-gray-500">{s.months}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {s.crops.map((c) => (
                <span
                  key={c}
                  className="text-xs px-2 py-1 rounded-full bg-brand-forest/10 text-brand-forest font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                {cooperatives.length} {isFr ? 'coopératives' : 'cooperatives'} · {farmers.length}{' '}
                {isFr ? 'agriculteurs' : 'farmers'} · {farmersForSeason.length}{' '}
                {isFr ? 'dans cette saison (estim.)' : 'in this season (est.)'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Regional forecast summary */}
      {forecast ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold text-brand-forest mb-2">
            {isFr ? 'Synthèse optimisations (API régional)' : 'Optimization summary (regional API)'}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500">{isFr ? 'Optimisations' : 'Runs'}</span>
              <p className="font-semibold text-gray-900">{forecast.totalOptimizations ?? '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">{isFr ? 'Superficie (ha)' : 'Area (ha)'}</span>
              <p className="font-semibold text-gray-900">
                {forecast.totalSuperficie != null ? Number(forecast.totalSuperficie).toFixed(1) : '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">{isFr ? 'Rendement estimé (t)' : 'Est. yield (t)'}</span>
              <p className="font-semibold text-gray-900">
                {forecast.totalYieldEstimate != null ? Number(forecast.totalYieldEstimate).toFixed(1) : '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">{isFr ? 'Rendement / ha' : 'Yield / ha'}</span>
              <p className="font-semibold text-gray-900">
                {forecast.averageYield != null ? Number(forecast.averageYield).toFixed(2) : '—'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent optimizations */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-brand-forest">
            {isFr ? 'Dernières optimisations de production' : 'Recent production optimizations'}
          </h3>
          <p className="text-xs text-gray-500">
            {isFr ? 'Données GET /api/optimize/regional' : 'From GET /api/optimize/regional'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="py-3 px-4 font-semibold text-gray-700">{isFr ? 'Région' : 'Region'}</th>
                <th className="py-3 px-4 font-semibold text-gray-700">{isFr ? 'Culture' : 'Crop'}</th>
                <th className="py-3 px-4 font-semibold text-gray-700">ha</th>
                <th className="py-3 px-4 font-semibold text-gray-700">{isFr ? 'Rendement est.' : 'Est. yield'}</th>
              </tr>
            </thead>
            <tbody>
              {optimizations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-gray-500">
                    {isFr ? 'Aucune optimisation enregistrée.' : 'No optimizations yet.'}
                  </td>
                </tr>
              ) : (
                optimizations.map((opt) => (
                  <tr key={opt._id} className="border-b border-gray-50 hover:bg-gray-50/80">
                    <td className="py-3 px-4">{opt.region}</td>
                    <td className="py-3 px-4">{opt.crop}</td>
                    <td className="py-3 px-4">{opt.superficie}</td>
                    <td className="py-3 px-4">
                      {opt.aiRecommendations?.forecast?.yieldEstimate != null
                        ? Number(opt.aiRecommendations.forecast.yieldEstimate).toFixed(1)
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Farmers in selected season */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-brand-forest">
            {isFr ? 'Agriculteurs (saison sélectionnée, estimation)' : 'Farmers (selected season, estimate)'}
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-left">
                <th className="py-3 px-4 font-semibold text-gray-700">{isFr ? 'Nom' : 'Name'}</th>
                <th className="py-3 px-4 font-semibold text-gray-700">{isFr ? 'Région' : 'Region'}</th>
                <th className="py-3 px-4 font-semibold text-gray-700">{isFr ? 'Pays' : 'Country'}</th>
              </tr>
            </thead>
            <tbody>
              {farmersForSeason.slice(0, 80).map((f) => (
                <tr key={f._id || f.id} className="border-b border-gray-50">
                  <td className="py-2 px-4 font-medium">{f.nom}</td>
                  <td className="py-2 px-4 text-gray-600">{f.region}</td>
                  <td className="py-2 px-4 text-gray-600">{f.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-brand-forest mb-4 pr-8">
              {isFr ? 'Nouveau plan de production' : 'New production plan'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              POST {API_ENDPOINTS.OPTIMIZE.PRODUCTION} — {isFr ? 'lier un agriculteur réel' : 'links to a real farmer'}
            </p>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-gray-600">{isFr ? 'Coopérative (réf.)' : 'Cooperative (ref.)'}</span>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.cooperativeId}
                  onChange={(e) => setForm((p) => ({ ...p, cooperativeId: e.target.value }))}
                >
                  <option value="">—</option>
                  {cooperatives.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">{isFr ? 'Agriculteur *' : 'Farmer *'}</span>
                <select
                  required
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.farmerId}
                  onChange={(e) => setForm((p) => ({ ...p, farmerId: e.target.value }))}
                >
                  <option value="">{isFr ? 'Choisir…' : 'Choose…'}</option>
                  {farmers.map((f) => (
                    <option key={f._id || f.id} value={f._id || f.id}>
                      {f.nom} — {f.region}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">{isFr ? 'Saison du plan' : 'Plan season'}</span>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.season}
                  onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))}
                >
                  <option value="rainy">{isFr ? 'Pluvieuse' : 'Rainy'}</option>
                  <option value="dry">{isFr ? 'Sèche' : 'Dry'}</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">{isFr ? 'Année' : 'Year'}</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.year}
                  onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">{isFr ? 'Culture' : 'Crop'}</span>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.cropType}
                  onChange={(e) => setForm((p) => ({ ...p, cropType: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">{isFr ? 'Superficie (ha)' : 'Area (ha)'}</span>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.superficieHa}
                  onChange={(e) => setForm((p) => ({ ...p, superficieHa: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  <span className="text-gray-600">{isFr ? 'Semis' : 'Planting'}</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={form.plantingDate}
                    onChange={(e) => setForm((p) => ({ ...p, plantingDate: e.target.value }))}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-gray-600">{isFr ? 'Récolte' : 'Harvest'}</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={form.harvestDate}
                    onChange={(e) => setForm((p) => ({ ...p, harvestDate: e.target.value }))}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.irrigationNeeded}
                  onChange={(e) => setForm((p) => ({ ...p, irrigationNeeded: e.target.checked }))}
                />
                {isFr ? 'Irrigation nécessaire' : 'Irrigation needed'}
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Notes</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowForm(false)}
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={savePlan}
                className="px-4 py-2 rounded-xl bg-brand-forest text-white font-semibold disabled:opacity-60"
              >
                {saving ? (isFr ? 'Envoi…' : 'Saving…') : isFr ? 'Générer le plan' : 'Generate plan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
