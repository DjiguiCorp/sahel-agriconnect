import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

/** Backend IrrigationSurvey ↔ UI field mapping */
const STATUT_FILTERS = ['all', 'submitted', 'under_review', 'approved', 'in_progress', 'completed'];

function mapUiMethodToType(m) {
  const M = {
    none: 'Aucune',
    manual: 'Manuelle',
    canal: 'Gravitaire',
    drip: 'Goutte à goutte',
    sprinkler: 'Aspersion',
    solar_pump: 'Pompe solaire',
    motorized: 'Pompe diesel',
  };
  return M[m] || 'Aucune';
}

function reverseMethodType(t) {
  const R = {
    Aucune: 'none',
    Manuelle: 'manual',
    Gravitaire: 'canal',
    'Goutte à goutte': 'drip',
    Aspersion: 'sprinkler',
    'Pompe solaire': 'solar_pump',
    'Pompe diesel': 'motorized',
  };
  return R[t] || 'none';
}

function mapWater(w) {
  const W = {
    rain: 'Autre',
    river: 'Rivière',
    well: 'Puits',
    borehole: 'Forage',
    reservoir: 'Barrage',
  };
  return W[w] || 'Autre';
}

function reverseWater(src) {
  const R = {
    Autre: 'rain',
    Rivière: 'river',
    Puits: 'well',
    Forage: 'borehole',
    Barrage: 'reservoir',
    Lac: 'reservoir',
  };
  return R[src] || 'rain';
}

function mapPriorite(u) {
  if (u === 'critical' || u === 'high') return 'Haute';
  if (u === 'medium') return 'Moyenne';
  return 'Basse';
}

function mapUrgenceNeeds(u) {
  if (u === 'critical') return 'Immédiate';
  if (u === 'high') return 'Saison prochaine';
  return 'Long terme';
}

function mapRequestToNeedType(rt) {
  const R = {
    assessment: 'Amélioration existant',
    solar_pump: 'Pompe solaire',
    drip_system: 'Goutte à goutte',
    borehole: 'Système mixte',
    canal: 'Amélioration existant',
    training: 'Amélioration existant',
  };
  return R[rt] || 'Amélioration existant';
}

function mapNeedsToUrgency(needs) {
  if (!needs) return 'medium';
  if (needs.priorite === 'Haute' && needs.urgence === 'Immédiate') return 'critical';
  if (needs.priorite === 'Haute') return 'high';
  if (needs.priorite === 'Basse') return 'low';
  return 'medium';
}

function pickFarmerId(farmers, cooperatives, cooperativeId) {
  if (!farmers.length) return null;
  if (!cooperativeId) return farmers[0]._id || farmers[0].id;
  const coop = cooperatives.find((c) => c._id === cooperativeId);
  const name = (coop?.cooperativeName || coop?.nomCooperative || '').trim();
  const match = farmers.find(
    (f) =>
      String(f.cooperativeId) === String(cooperativeId) ||
      (name &&
        String(f.nomCooperative || '')
          .toLowerCase()
          .includes(name.slice(0, 14).toLowerCase()))
  );
  const id = (match || farmers[0])._id || (match || farmers[0]).id;
  return id || null;
}

function normalizeSurvey(s) {
  const prob = s.currentIrrigation?.probleme || '';
  const coopBracket = prob.match(/^\[Coop:\s*([^\]]+)\]\s*/);
  const cooperativeName = coopBracket
    ? coopBracket[1].trim()
    : s.cooperativeName || (typeof s.farmerId === 'object' && s.farmerId?.nom) || '—';
  const challengeDescription = coopBracket ? prob.slice(coopBracket[0].length).trim() : prob;

  const statut = s.statut || 'submitted';
  const urgencyLevel = mapNeedsToUrgency(s.needs);
  const typeUi = reverseMethodType(s.currentIrrigation?.type);
  const farmer =
    typeof s.farmerId === 'object' && s.farmerId !== null ? s.farmerId : null;

  return {
    _id: s._id,
    cooperativeName,
    country: s.localisation?.adresse || s.country || '',
    region: s.region || '',
    currentIrrigationMethod: typeUi,
    landAreaHa:
      s.currentIrrigation?.superficieIrriguee ?? s.needs?.superficieCible ?? '',
    farmerCount: farmer ? 1 : 0,
    urgencyLevel,
    statut,
    status: statut,
    contactEmail: farmer?.email || '',
    challengeDescription,
    waterSourceAvailable: reverseWater(s.currentIrrigation?.sourceEau),
    solarPumpAvailable: s.currentIrrigation?.type === 'Pompe solaire',
    estimatedCostUSD: s.needs?.budgetEstime,
    mainCrops: [],
    raw: s,
  };
}

export default function IrrigationTab({ token, isFr }) {
  const [surveys, setSurveys] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [form, setForm] = useState({
    cooperativeId: '',
    cooperativeName: '',
    farmerCount: '',
    region: '',
    country: '',
    currentIrrigationMethod: 'none',
    landAreaHa: '',
    waterSourceAvailable: 'rain',
    solarPumpAvailable: false,
    mainCrops: [],
    season: 'rainy',
    challengeDescription: '',
    urgencyLevel: 'medium',
    estimatedCostUSD: '',
    requestType: 'assessment',
    status: 'submitted',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const load = useCallback(async () => {
    if (!token) return;
    const h = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    setLoading(true);
    try {
      const [irr, coops, farm] = await Promise.all([
        fetch(`${API_BASE_URL}/api/irrigation`, { headers: h }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/cooperatives`, { headers: h }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/farmers?limit=800`, { headers: h }).then((r) => r.json()),
      ]);
      const raw = Array.isArray(irr) ? irr : irr.surveys || irr.assessments || [];
      setSurveys(raw.map(normalizeSurvey));
      setCooperatives(Array.isArray(coops) ? coops : coops.cooperatives || []);
      setFarmers(Array.isArray(farm) ? farm : farm.farmers || []);
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onCoopSelect = (e) => {
    const coop = cooperatives.find((c) => c._id === e.target.value);
    setForm((f) => ({
      ...f,
      cooperativeId: e.target.value,
      cooperativeName: coop ? coop.cooperativeName || coop.nomCooperative || '' : '',
      region: coop?.regionCity || f.region,
      country: coop?.country || coop?.pays || f.country,
      farmerCount: coop?.memberCount != null ? String(coop.memberCount) : f.farmerCount,
    }));
  };

  const submitAssessment = async () => {
    const farmerId = pickFarmerId(farmers, cooperatives, form.cooperativeId);
    if (!farmerId) {
      alert(isFr ? 'Aucun agriculteur trouvé pour lier cette évaluation.' : 'No farmer found to link this assessment.');
      return;
    }
    if (!form.region?.trim()) {
      alert(isFr ? 'La région est requise.' : 'Region is required.');
      return;
    }
    if (!form.cooperativeName?.trim()) {
      alert(isFr ? 'Le nom de la coopérative est requis.' : 'Cooperative name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        farmerId,
        region: form.region.trim(),
        localisation: form.country ? { adresse: form.country.trim() } : undefined,
        currentIrrigation: {
          type: mapUiMethodToType(form.currentIrrigationMethod),
          superficieIrriguee: Number(form.landAreaHa) || 0,
          sourceEau: mapWater(form.waterSourceAvailable),
          probleme: `[Coop: ${form.cooperativeName.trim()}] ${form.challengeDescription || ''}`.trim(),
        },
        needs: {
          typeIrrigation: mapRequestToNeedType(form.requestType),
          superficieCible: Number(form.landAreaHa) || undefined,
          budgetEstime: Number(form.estimatedCostUSD) || undefined,
          priorite: mapPriorite(form.urgencyLevel),
          urgence: mapUrgenceNeeds(form.urgencyLevel),
        },
      };

      const res = await fetch(`${API_BASE_URL}/api/irrigation/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.details || 'Failed');
      }

      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      setForm((f) => ({
        ...f,
        cooperativeId: '',
        challengeDescription: '',
        estimatedCostUSD: '',
        landAreaHa: '',
        farmerCount: '',
      }));
      await load();
    } catch {
      alert(isFr ? "Impossible d'enregistrer l'évaluation." : 'Could not save assessment.');
    }
    setSubmitting(false);
  };

  const updateStatus = async (id, statut) => {
    try {
      await fetch(`${API_BASE_URL}/api/irrigation/${id}/assess`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ statut }),
      });
      setSurveys((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, statut, status: statut } : s
        )
      );
      setSelectedSurvey((prev) =>
        prev && prev._id === id ? { ...prev, statut, status: statut } : prev
      );
    } catch {
      /* ignore */
    }
  };

  const urgencyColor = (u) =>
    ({
      low: 'bg-green-50 text-green-700',
      medium: 'bg-yellow-50 text-yellow-700',
      high: 'bg-orange-50 text-orange-700',
      critical: 'bg-red-50 text-red-700',
    }[u] || 'bg-gray-100 text-gray-600');

  const statusColor = (s) =>
    ({
      submitted: 'bg-gray-100 text-gray-600',
      under_review: 'bg-blue-50 text-blue-700',
      approved: 'bg-green-50 text-green-700',
      in_progress: 'bg-purple-50 text-purple-700',
      completed: 'bg-brand-forest/10 text-brand-forest',
      rejected: 'bg-red-50 text-red-700',
    }[s] || 'bg-gray-100 text-gray-600');

  const methodIcon = (m) =>
    ({
      none: '❌',
      manual: '🪣',
      canal: '💧',
      drip: '💦',
      sprinkler: '🌀',
      solar_pump: '☀️',
      motorized: '⚙️',
    }[m] || '❓');

  const filtered =
    filter === 'all' ? surveys : surveys.filter((s) => (s.statut || s.status) === filter);

  const totalFarmersAffected = surveys.reduce((acc, r) => acc + (Number(r.farmerCount) || 0), 0);
  const totalAreaHa = surveys.reduce((acc, r) => acc + (Number(r.landAreaHa) || 0), 0);
  const critical = surveys.filter((s) => s.urgencyLevel === 'critical' || s.urgencyLevel === 'high').length;

  const byCountry = surveys.reduce((acc, s) => {
    const key = s.country || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const statutLabel = (f) => {
    if (f === 'all') return isFr ? 'Tous' : 'All';
    if (f === 'submitted') return isFr ? 'Soumis' : 'Submitted';
    if (f === 'under_review') return isFr ? 'En révision' : 'In Review';
    if (f === 'approved') return isFr ? 'Approuvés' : 'Approved';
    if (f === 'in_progress') return isFr ? 'En cours' : 'In Progress';
    if (f === 'completed') return isFr ? 'Complétés' : 'Completed';
    return f;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? "Gestion de l'Irrigation" : 'Irrigation Management'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? 'Évaluez, priorisez et coordonnez les besoins en irrigation des coopératives'
              : 'Evaluate, prioritize, and coordinate cooperative irrigation needs'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-forest/90 transition self-start"
        >
          + {isFr ? 'Nouvelle évaluation' : 'New Assessment'}
        </button>
      </div>

      {success && (
        <div className="rounded-xl p-3 bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          ✓ {isFr ? 'Évaluation enregistrée avec succès.' : 'Assessment saved successfully.'}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: '💧',
            label: isFr ? 'Total évaluations' : 'Total Assessments',
            value: surveys.length,
            bg: 'bg-blue-50',
            color: 'text-blue-700',
          },
          {
            icon: '👩‍🌾',
            label: isFr ? 'Agriculteurs affectés' : 'Farmers Affected',
            value: totalFarmersAffected,
            bg: 'bg-green-50',
            color: 'text-green-700',
          },
          {
            icon: '🌾',
            label: isFr ? 'Superficie totale (ha)' : 'Total Area (ha)',
            value: totalAreaHa.toFixed(1),
            bg: 'bg-yellow-50',
            color: 'text-yellow-700',
          },
          {
            icon: '🚨',
            label: isFr ? 'Urgences actives' : 'Active Urgencies',
            value: critical,
            bg: 'bg-red-50',
            color: 'text-red-700',
          },
        ].map(({ icon, label, value, bg, color }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <span className="text-2xl">{icon}</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-brand-forest mb-4">
          💡{' '}
          {isFr
            ? "Guide des méthodes d'irrigation — Impact par niveau"
            : 'Irrigation Methods Guide — Impact by Level'}
        </h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {
              icon: '❌',
              method: isFr ? 'Aucune irrigation' : 'No Irrigation',
              impact: isFr
                ? 'Dépendance totale à la pluie. Pertes importantes en saison sèche.'
                : 'Fully rain-dependent. Major losses in dry season.',
              level: isFr ? 'Niveau 0' : 'Level 0',
              color: 'border-red-200 bg-red-50',
            },
            {
              icon: '🪣',
              method: isFr ? 'Irrigation manuelle' : 'Manual Irrigation',
              impact: isFr
                ? 'Pénible et peu efficace. Couvre moins de 20% des besoins.'
                : 'Laborious and inefficient. Covers less than 20% of needs.',
              level: isFr ? 'Niveau 1' : 'Level 1',
              color: 'border-orange-200 bg-orange-50',
            },
            {
              icon: '💧',
              method: isFr ? 'Canal gravitaire' : 'Gravity Canal',
              impact: isFr
                ? "Bon si source disponible. Couvre jusqu'à 60% des besoins."
                : 'Good if source available. Covers up to 60% of needs.',
              level: isFr ? 'Niveau 2' : 'Level 2',
              color: 'border-yellow-200 bg-yellow-50',
            },
            {
              icon: '☀️',
              method: isFr ? 'Pompe solaire' : 'Solar Pump',
              impact: isFr
                ? 'Recommandé. Zéro carburant, couvre 80%+ des besoins. ROI en 2 ans.'
                : 'Recommended. Zero fuel, covers 80%+ of needs. ROI in 2 years.',
              level: isFr ? 'Niveau 3' : 'Level 3',
              color: 'border-green-200 bg-green-50',
            },
            {
              icon: '💦',
              method: isFr ? 'Goutte-à-goutte' : 'Drip Irrigation',
              impact: isFr
                ? 'Optimal pour karité et sésame. Économise 50% d\'eau.'
                : 'Optimal for shea and sesame. Saves 50% water.',
              level: isFr ? 'Niveau 4' : 'Level 4',
              color: 'border-blue-200 bg-blue-50',
            },
            {
              icon: '🌀',
              method: isFr ? 'Aspersion' : 'Sprinkler',
              impact: isFr
                ? 'Idéal pour grandes superficies. Couverture uniforme.'
                : 'Ideal for large areas. Uniform coverage.',
              level: isFr ? 'Niveau 5' : 'Level 5',
              color: 'border-purple-200 bg-purple-50',
            },
          ].map((m) => (
            <div key={m.method} className={`rounded-xl border p-3 ${m.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{m.icon}</span>
                <span className="font-semibold text-sm text-gray-800">{m.method}</span>
              </div>
              <span className="text-xs font-bold text-gray-500">{m.level}</span>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{m.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(byCountry).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-brand-forest mb-3">
            🌍 {isFr ? 'Vue par pays' : 'Country Overview'}
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(byCountry).map(([country, countryData]) => (
              <div key={country} className="bg-gray-50 rounded-xl p-3">
                <p className="font-semibold text-brand-forest text-sm">🌍 {country}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {countryData.length} {isFr ? 'évaluations' : 'assessments'} ·{' '}
                  {countryData.reduce((sum, r) => sum + (Number(r.farmerCount) || 0), 0)}{' '}
                  {isFr ? 'agriculteurs' : 'farmers'}
                </p>
                <div className="mt-2">
                  {countryData.filter((d) => d.urgencyLevel === 'critical' || d.urgencyLevel === 'high')
                    .length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      🚨{' '}
                      {
                        countryData.filter(
                          (d) => d.urgencyLevel === 'critical' || d.urgencyLevel === 'high'
                        ).length
                      }{' '}
                      {isFr ? 'urgences' : 'urgent'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-bold text-brand-forest">
            {isFr ? "Évaluations d'irrigation" : 'Irrigation Assessments'}
          </h3>
          <div className="flex gap-1 flex-wrap">
            {STATUT_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  filter === f ? 'bg-brand-forest text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {statutLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">💧</p>
            <p className="text-gray-500 font-medium mb-1">
              {isFr ? "Aucune évaluation d'irrigation." : 'No irrigation assessments yet.'}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {isFr
                ? 'Créez la première évaluation pour une coopérative ayant des besoins en irrigation.'
                : 'Create the first assessment for a cooperative with irrigation needs.'}
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-brand-forest font-semibold text-sm hover:underline"
            >
              + {isFr ? 'Créer la première évaluation' : 'Create first assessment'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    isFr ? 'Coopérative' : 'Cooperative',
                    isFr ? 'Pays / Région' : 'Country / Region',
                    isFr ? 'Méthode actuelle' : 'Current Method',
                    isFr ? 'Superficie (ha)' : 'Area (ha)',
                    isFr ? 'Agriculteurs' : 'Farmers',
                    isFr ? 'Urgence' : 'Urgency',
                    isFr ? 'Statut' : 'Status',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={s._id}
                    className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} cursor-pointer hover:bg-blue-50/30 transition`}
                    onClick={() => setSelectedSurvey(selectedSurvey?._id === s._id ? null : s)}
                  >
                    <td className="px-4 py-3 font-medium text-brand-forest">{s.cooperativeName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      🌍 {s.country || '—'}
                      <br />
                      <span className="text-gray-400">{s.region || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-lg">
                      {methodIcon(s.currentIrrigationMethod)}
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {s.currentIrrigationMethod || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-forest">
                      {s.landAreaHa !== '' && s.landAreaHa != null ? s.landAreaHa : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono">{s.farmerCount ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${urgencyColor(
                          s.urgencyLevel
                        )}`}
                      >
                        {s.urgencyLevel === 'critical' ? '🚨 ' : s.urgencyLevel === 'high' ? '⚠️ ' : ''}
                        {s.urgencyLevel || 'medium'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.statut || s.status || 'submitted'}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(s._id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium ${statusColor(
                          s.statut || s.status
                        )}`}
                      >
                        <option value="submitted">{isFr ? 'Soumis' : 'Submitted'}</option>
                        <option value="under_review">{isFr ? 'En révision' : 'In Review'}</option>
                        <option value="approved">{isFr ? 'Approuvé' : 'Approved'}</option>
                        <option value="in_progress">{isFr ? 'En cours' : 'In Progress'}</option>
                        <option value="completed">{isFr ? 'Complété' : 'Completed'}</option>
                        <option value="rejected">{isFr ? 'Rejeté' : 'Rejected'}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${s.contactEmail || ''}?subject=Irrigation — ${encodeURIComponent(s.cooperativeName || '')}&body=${encodeURIComponent(`Bonjour,\n\nRegardant votre évaluation d'irrigation en ${s.region}, ${s.country}.`)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-brand-forest hover:underline"
                      >
                        {isFr ? 'Contacter' : 'Contact'}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedSurvey && (
          <div className="border-t border-gray-200 bg-blue-50/30 px-5 py-4">
            <h4 className="font-bold text-brand-forest mb-2">
              📋 {isFr ? 'Détails:' : 'Details:'} {selectedSurvey.cooperativeName}
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">
                  {isFr ? 'Contexte' : 'Context'}
                </p>
                <p className="text-gray-700">
                  {selectedSurvey.challengeDescription ||
                    (isFr ? 'Aucune description fournie.' : 'No description provided.')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">
                  {isFr ? 'Infos techniques' : 'Technical Info'}
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    💧 {isFr ? "Source d'eau:" : 'Water source:'}{' '}
                    <strong>{selectedSurvey.waterSourceAvailable || '—'}</strong>
                  </p>
                  <p>
                    ☀️ {isFr ? 'Pompe solaire:' : 'Solar pump:'}{' '}
                    <strong>
                      {selectedSurvey.solarPumpAvailable
                        ? isFr
                          ? 'Oui'
                          : 'Yes'
                        : isFr
                          ? 'Non'
                          : 'No'}
                    </strong>
                  </p>
                  <p>
                    💰 {isFr ? 'Coût estimé:' : 'Estimated cost:'}{' '}
                    <strong>
                      {selectedSurvey.estimatedCostUSD
                        ? `$${Number(selectedSurvey.estimatedCostUSD).toLocaleString()}`
                        : '—'}
                    </strong>
                  </p>
                  <p>
                    🌾 {isFr ? 'Cultures:' : 'Crops:'}{' '}
                    <strong>{(selectedSurvey.mainCrops || []).join(', ') || '—'}</strong>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <a
                href={`mailto:${selectedSurvey.contactEmail || ''}?subject=${encodeURIComponent(`Approbation irrigation — ${selectedSurvey.cooperativeName}`)}&body=${encodeURIComponent("Bonjour,\n\nVotre demande d'irrigation a été approuvée. Voici les prochaines étapes:\n\n1. ...")}`}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
              >
                ✅ {isFr ? 'Envoyer approbation' : 'Send Approval'}
              </a>
              <a
                href={`mailto:${selectedSurvey.contactEmail || ''}?subject=${encodeURIComponent(`Évaluation irrigation requise — ${selectedSurvey.cooperativeName}`)}`}
                className="text-xs bg-brand-forest text-white px-3 py-1.5 rounded-lg hover:bg-brand-forest/90 transition"
              >
                📋 {isFr ? "Demander plus d'info" : 'Request More Info'}
              </a>
              <button
                type="button"
                onClick={() => updateStatus(selectedSurvey._id, 'in_progress')}
                className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition"
              >
                🔄 {isFr ? 'Marquer en cours' : 'Mark In Progress'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          role="presentation"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-brand-forest text-xl mb-4">
              💧 {isFr ? "Nouvelle évaluation d'irrigation" : 'New Irrigation Assessment'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Coopérative' : 'Cooperative'}
                  </label>
                  <select
                    value={form.cooperativeId}
                    onChange={onCoopSelect}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="">{isFr ? 'Sélectionner ou saisir manuellement' : 'Select or enter manually'}</option>
                    {cooperatives.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.cooperativeName || c.nomCooperative}
                      </option>
                    ))}
                  </select>
                </div>
                {!form.cooperativeId && (
                  <div className="col-span-2">
                    <input
                      value={form.cooperativeName}
                      onChange={(e) => setForm((f) => ({ ...f, cooperativeName: e.target.value }))}
                      placeholder={
                        isFr ? 'Nom de la coopérative (si non listée)' : 'Cooperative name (if not listed)'
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Pays' : 'Country'}
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Région / Zone' : 'Region / Zone'}
                  </label>
                  <input
                    value={form.region}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Méthode actuelle' : 'Current Method'}
                  </label>
                  <select
                    value={form.currentIrrigationMethod}
                    onChange={(e) => setForm((f) => ({ ...f, currentIrrigationMethod: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="none">❌ {isFr ? 'Aucune' : 'None'}</option>
                    <option value="manual">🪣 {isFr ? 'Manuelle' : 'Manual'}</option>
                    <option value="canal">💧 {isFr ? 'Canal gravitaire' : 'Gravity Canal'}</option>
                    <option value="drip">💦 {isFr ? 'Goutte-à-goutte' : 'Drip'}</option>
                    <option value="sprinkler">🌀 {isFr ? 'Aspersion' : 'Sprinkler'}</option>
                    <option value="solar_pump">☀️ {isFr ? 'Pompe solaire' : 'Solar Pump'}</option>
                    <option value="motorized">⚙️ {isFr ? 'Motorisée' : 'Motorized'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? "Source d'eau disponible" : 'Water Source Available'}
                  </label>
                  <select
                    value={form.waterSourceAvailable}
                    onChange={(e) => setForm((f) => ({ ...f, waterSourceAvailable: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="rain">{isFr ? 'Pluie uniquement' : 'Rain only'}</option>
                    <option value="river">{isFr ? 'Rivière / Fleuve' : 'River / Stream'}</option>
                    <option value="well">{isFr ? 'Puits' : 'Well'}</option>
                    <option value="borehole">{isFr ? 'Forage' : 'Borehole'}</option>
                    <option value="reservoir">{isFr ? 'Réservoir / Barrage' : 'Reservoir / Dam'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Superficie (ha)' : 'Area (ha)'}
                  </label>
                  <input
                    type="number"
                    value={form.landAreaHa}
                    onChange={(e) => setForm((f) => ({ ...f, landAreaHa: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Nb agriculteurs' : 'Farmer Count'}
                  </label>
                  <input
                    type="number"
                    value={form.farmerCount}
                    onChange={(e) => setForm((f) => ({ ...f, farmerCount: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Coût estimé ($)' : 'Estimated Cost ($)'}
                  </label>
                  <input
                    type="number"
                    value={form.estimatedCostUSD}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedCostUSD: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? "Niveau d'urgence" : 'Urgency Level'}
                  </label>
                  <select
                    value={form.urgencyLevel}
                    onChange={(e) => setForm((f) => ({ ...f, urgencyLevel: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="low">{isFr ? 'Faible — peut attendre' : 'Low — can wait'}</option>
                    <option value="medium">{isFr ? 'Moyen — cette saison' : 'Medium — this season'}</option>
                    <option value="high">{isFr ? 'Élevé — urgent' : 'High — urgent'}</option>
                    <option value="critical">{isFr ? '🚨 Critique — immédiat' : '🚨 Critical — immediate'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Type de demande' : 'Request Type'}
                  </label>
                  <select
                    value={form.requestType}
                    onChange={(e) => setForm((f) => ({ ...f, requestType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="assessment">{isFr ? 'Évaluation des besoins' : 'Needs Assessment'}</option>
                    <option value="solar_pump">{isFr ? 'Acquisition pompe solaire' : 'Solar Pump Acquisition'}</option>
                    <option value="drip_system">{isFr ? 'Installation goutte-à-goutte' : 'Drip System Installation'}</option>
                    <option value="borehole">{isFr ? 'Forage de puits' : 'Borehole Drilling'}</option>
                    <option value="canal">{isFr ? 'Construction de canal' : 'Canal Construction'}</option>
                    <option value="training">{isFr ? "Formation à l'irrigation" : 'Irrigation Training'}</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.solarPumpAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, solarPumpAvailable: e.target.checked }))}
                  className="w-4 h-4 rounded accent-brand-forest"
                />
                <span className="text-sm text-gray-700">
                  ☀️ {isFr ? 'Pompe solaire déjà disponible sur site' : 'Solar pump already available on site'}
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Description des défis et besoins' : 'Challenge & Need Description'}
                </label>
                <textarea
                  value={form.challengeDescription}
                  onChange={(e) => setForm((f) => ({ ...f, challengeDescription: e.target.value }))}
                  rows={3}
                  placeholder={
                    isFr
                      ? 'Décrivez la situation actuelle, les pertes subies, les solutions déjà essayées...'
                      : 'Describe current situation, losses suffered, solutions already tried...'
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={submitAssessment}
                disabled={submitting || !form.cooperativeName?.trim()}
                className="flex-1 bg-brand-forest text-white rounded-xl py-3 font-bold text-sm disabled:opacity-40 hover:bg-brand-forest/90 transition"
              >
                {submitting ? '...' : isFr ? "💾 Enregistrer l'évaluation" : '💾 Save Assessment'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm"
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
