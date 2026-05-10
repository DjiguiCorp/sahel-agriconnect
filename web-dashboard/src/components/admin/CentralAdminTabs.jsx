import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

/** Exported for Overview cooperative member section */
export function mergeCooperativeSources(adminList, platformList) {
  const admin = (adminList || []).map((c) => ({
    _id: c._id,
    cooperativeName: c.nom,
    nomCooperative: c.nom,
    country: c.country || '',
    pays: c.country,
    memberCount: c.membres,
    nombreMembres: c.membres,
    primaryCrops: Array.isArray(c.produits) ? c.produits : [],
    culturesPrincipales: c.produits,
    certificationStatus: 'None',
    interests: [],
    source: 'admin',
  }));
  const plat = (platformList || []).map((c) => ({
    _id: c._id,
    cooperativeName: c.cooperativeName,
    country: c.country,
    pays: c.country,
    memberCount: c.memberCount,
    primaryCrops: c.primaryCrops || [],
    certificationStatus: c.certificationStatus || 'None',
    interests: c.interests || [],
    source: 'platform',
  }));
  const seen = new Set();
  const out = [];
  for (const row of [...plat, ...admin]) {
    const key = `${row.cooperativeName}-${row.country}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function headersWith(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Seasonal planning — uses POST /api/optimize/production with a real farmerId */
export function PlanningTab({ token, isFr }) {
  const [season, setSeason] = useState('rainy');
  const [farmers, setFarmers] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cooperativeId: '',
    farmerId: '',
    season: 'rainy',
    year: new Date().getFullYear(),
    cropType: 'Shea Butter',
    targetQuantityKg: '',
    plantingDate: '',
    harvestDate: '',
    irrigationNeeded: false,
    notes: '',
  });
  const headers = headersWith(token);

  const load = useCallback(async () => {
    try {
      const [a, b, p] = await Promise.all([
        fetch(`${API_BASE_URL}/api/cooperatives/admin`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/cooperatives/platform-registrations`, { headers }).then((r) => r.json()),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=500`, { headers }).then((r) => r.json()),
      ]);
      const admin = a.cooperatives || [];
      const plat = b.registrations || [];
      setCooperatives(mergeCooperativeSources(admin, plat));
      const fl = Array.isArray(p) ? p : p.farmers || [];
      setFarmers(fl);
    } catch {
      setCooperatives([]);
      setFarmers([]);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const saveplan = async () => {
    if (!form.farmerId) {
      alert(isFr ? 'Sélectionnez un agriculteur.' : 'Select a farmer.');
      return;
    }
    const farmer = farmers.find((f) => String(f._id || f.id) === String(form.farmerId));
    const coop = cooperatives.find((c) => String(c._id) === String(form.cooperativeId));
    const region = String(farmer?.region || coop?.regionCity || coop?.country || 'Sahel').split(',')[0].trim();
    const superficie = Math.max(
      0.5,
      form.targetQuantityKg ? parseFloat(form.targetQuantityKg) / 500 : 2
    );
    const saison = form.season === 'rainy' ? 'Pluvieuse' : 'Sèche';
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/optimize/production`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          farmerId: form.farmerId,
          region,
          crop: form.cropType,
          superficie,
          saison,
          currentPractices: {
            irrigation: form.irrigationNeeded ? 'Requis' : 'Pluvial',
            autres: [
              `Year ${form.year}`,
              form.plantingDate && `Planting ${form.plantingDate}`,
              form.harvestDate && `Harvest ${form.harvestDate}`,
              form.targetQuantityKg && `Target kg ${form.targetQuantityKg}`,
              coop && `Coop ${coop.cooperativeName}`,
              form.notes,
            ]
              .filter(Boolean)
              .join(' | '),
          },
          soilConditions: { autres: form.notes || '' },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || 'Error');
      setShowForm(false);
      await load();
    } catch (e) {
      alert(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const seasons = [
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
  ];

  const coopOptions = cooperatives;

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? 'Planification Saisonnière' : 'Seasonal Planning'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr ? 'Plans liés aux coopératives et agriculteurs réels (API)' : 'Plans tied to real cooperatives & farmers (API)'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-forest/90 transition"
        >
          + {isFr ? 'Nouveau plan' : 'New Plan'}
        </button>
      </div>

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
              <span className="text-3xl">{s.emoji}</span>
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
                {isFr ? 'agriculteurs' : 'farmers'}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-brand-forest">
            {isFr ? 'Coopératives — Saison actuelle' : 'Cooperatives — Current Season'} {currentYear}
          </h3>
          <span className="text-xs text-gray-400">
            {cooperatives.length} {isFr ? 'actives' : 'active'}
          </span>
        </div>
        {cooperatives.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-gray-500 text-sm">
              {isFr ? 'Aucune coopérative enregistrée.' : 'No cooperatives registered yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  isFr ? 'Coopérative' : 'Cooperative',
                  isFr ? 'Pays' : 'Country',
                  isFr ? 'Membres' : 'Members',
                  isFr ? 'Culture principale' : 'Main Crop',
                  isFr ? 'Certification' : 'Certification',
                  'Actions',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cooperatives.map((coop, i) => (
                <tr key={coop._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-medium text-brand-forest">
                    {coop.cooperativeName || coop.nomCooperative}
                  </td>
                  <td className="px-4 py-3 text-gray-600">🌍 {coop.country || coop.pays}</td>
                  <td className="px-4 py-3 text-gray-600">{coop.memberCount || coop.nombreMembres || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 font-medium">
                      {coop.primaryCrops?.[0] || coop.culturesPrincipales?.[0] || 'Shea'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        coop.certificationStatus === 'International'
                          ? 'bg-amber-50 text-amber-700'
                          : coop.certificationStatus === 'Regional'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {coop.certificationStatus === 'None' || !coop.certificationStatus
                        ? isFr
                          ? 'Aucune'
                          : 'None'
                        : coop.certificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, cooperativeId: coop._id }));
                        setShowForm(true);
                      }}
                      className="text-xs text-brand-forest hover:underline font-medium"
                    >
                      {isFr ? 'Planifier →' : 'Plan →'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="font-bold text-brand-forest text-xl mb-4">
              {isFr ? 'Nouveau plan saisonnier' : 'New Seasonal Plan'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Agriculteur (requis)' : 'Farmer (required)'}
                </label>
                <select
                  value={form.farmerId}
                  onChange={(e) => setForm((f) => ({ ...f, farmerId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">{isFr ? 'Sélectionner…' : 'Select…'}</option>
                  {farmers.map((x) => (
                    <option key={x._id || x.id} value={x._id || x.id}>
                      {x.nom} — {x.region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Coopérative' : 'Cooperative'}
                </label>
                <select
                  value={form.cooperativeId}
                  onChange={(e) => setForm((f) => ({ ...f, cooperativeId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">{isFr ? 'Sélectionner...' : 'Select...'}</option>
                  {coopOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.cooperativeName || c.nomCooperative}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Année' : 'Year'}
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Culture' : 'Crop'}
                </label>
                <select
                  value={form.cropType}
                  onChange={(e) => setForm((f) => ({ ...f, cropType: e.target.value }))}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Date de plantation' : 'Planting Date'}
                  </label>
                  <input
                    type="date"
                    value={form.plantingDate}
                    onChange={(e) => setForm((f) => ({ ...f, plantingDate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Date de récolte' : 'Harvest Date'}
                  </label>
                  <input
                    type="date"
                    value={form.harvestDate}
                    onChange={(e) => setForm((f) => ({ ...f, harvestDate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Quantité cible (kg)' : 'Target Quantity (kg)'}
                </label>
                <input
                  type="number"
                  value={form.targetQuantityKg}
                  onChange={(e) => setForm((f) => ({ ...f, targetQuantityKg: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.irrigationNeeded}
                  onChange={(e) => setForm((f) => ({ ...f, irrigationNeeded: e.target.checked }))}
                />
                {isFr ? 'Irrigation nécessaire' : 'Irrigation needed'}
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                disabled={saving}
                onClick={saveplan}
                className="flex-1 bg-brand-forest text-white rounded-xl py-2.5 font-bold text-sm hover:bg-brand-forest/90 transition disabled:opacity-60"
              >
                {saving ? '…' : isFr ? 'Enregistrer' : 'Save Plan'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
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

const CERT_UI_TO_STATUT = {
  pending: 'En attente',
  'in-progress': 'En inspection',
  approved: 'Conforme',
  rejected: 'Non conforme',
};

const STATUT_TO_UI = {
  'En attente': 'pending',
  'En inspection': 'in-progress',
  Conforme: 'approved',
  'Non conforme': 'rejected',
};

function niveauToKey(label) {
  const l = String(label || '');
  if (l.startsWith('International')) return 'international';
  if (l.startsWith('Regional')) return 'regional';
  return 'local';
}

export function CertificationTab({ token, isFr }) {
  const [certLevel, setCertLevel] = useState('all');
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    farmerId: '',
    product: 'Shea Butter',
    certificationLevel: 'Local',
    inspectionDate: '',
    complianceScore: '',
    notes: '',
  });
  const headers = headersWith(token);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [certs, farm] = await Promise.all([
        fetch(`${API_BASE_URL}/api/certifications`, { headers }).then((r) => r.json()),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=400`, { headers }).then((r) => r.json()),
      ]);
      setCertifications(certs.certifications || certs || []);
      setFarmers(Array.isArray(farm) ? farm : farm.farmers || []);
    } catch {
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const levels = [
    { key: 'all', label: isFr ? 'Tous' : 'All', stars: '' },
    { key: 'local', label: 'Local', stars: '⭐' },
    { key: 'regional', label: 'Regional (ECOWAS)', stars: '⭐⭐' },
    { key: 'international', label: 'International (EU/USDA)', stars: '⭐⭐⭐' },
  ];

  const filtered = useMemo(() => {
    if (certLevel === 'all') return certifications;
    return certifications.filter((c) => (c.niveau || '').toLowerCase() === certLevel);
  }, [certifications, certLevel]);

  const saveCert = async () => {
    if (!form.farmerId) {
      alert(isFr ? "Choisir l'agriculteur." : 'Choose a farmer.');
      return;
    }
    setSaving(true);
    try {
      const niveau = niveauToKey(form.certificationLevel);
      const res = await fetch(`${API_BASE_URL}/api/certifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          farmerId: form.farmerId,
          produit: form.product,
          quantite: form.complianceScore ? `${form.complianceScore}%` : '—',
          niveau,
          notes: [form.notes, form.inspectionDate && `Inspection ${form.inspectionDate}`]
            .filter(Boolean)
            .join(' | '),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShowForm(false);
      await load();
    } catch (e) {
      alert(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, uiStatus) => {
    const statut = CERT_UI_TO_STATUT[uiStatus] || uiStatus;
    try {
      const res = await fetch(`${API_BASE_URL}/api/certifications/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ statut }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      setCertifications((prev) =>
        prev.map((c) => (c._id === id ? { ...c, statut } : c))
      );
    } catch (e) {
      alert(e.message || 'Error');
    }
  };

  const statusColor = (s) => {
    const ui = STATUT_TO_UI[s] || 'pending';
    return (
      {
        pending: 'bg-yellow-50 text-yellow-700',
        'in-progress': 'bg-blue-50 text-blue-700',
        approved: 'bg-green-50 text-green-700',
        rejected: 'bg-red-50 text-red-700',
      }[ui] || 'bg-gray-100 text-gray-600'
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? 'Gestion des Certifications' : 'Certification Management'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? '3 niveaux: Local · Régional (CEDEAO) · International (UE/USDA)'
              : '3 levels: Local · Regional (ECOWAS) · International (EU/USDA)'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          + {isFr ? 'Nouvelle certification' : 'New Certification'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: isFr ? 'Total' : 'Total',
            value: certifications.length,
            color: 'text-gray-700',
            bg: 'bg-gray-50',
          },
          {
            label: 'Local',
            value: certifications.filter((c) => c.niveau === 'local').length,
            color: 'text-green-700',
            bg: 'bg-green-50',
          },
          {
            label: 'Regional',
            value: certifications.filter((c) => c.niveau === 'regional').length,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
          },
          {
            label: 'International',
            value: certifications.filter((c) => c.niveau === 'international').length,
            color: 'text-amber-700',
            bg: 'bg-amber-50',
          },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {levels.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setCertLevel(l.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
              certLevel === l.key
                ? 'bg-brand-forest text-white border-brand-forest'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-forest/40'
            }`}
          >
            {l.stars} {l.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            level: 'Local',
            stars: '⭐',
            color: 'border-green-200 bg-green-50',
            titleColor: 'text-green-800',
            market: isFr ? 'Marché national' : 'National Market',
            requirements: isFr
              ? ['Enregistrement coopérative', 'Inspection locale', 'Normes de qualité de base', 'Traçabilité des lots']
              : ['Cooperative registration', 'Local inspection', 'Basic quality standards', 'Batch traceability'],
            benefit: isFr ? 'Accès aux marchés locaux et régionaux' : 'Access to local and regional markets',
          },
          {
            level: 'Regional (ECOWAS)',
            stars: '⭐⭐',
            color: 'border-blue-200 bg-blue-50',
            titleColor: 'text-blue-800',
            market: isFr ? 'Marché CEDEAO' : 'ECOWAS Market',
            requirements: isFr
              ? ['Certification locale validée', 'Conformité CEDEAO', 'Contrôle qualité intermédiaire', 'Audit documentaire']
              : ['Local certification validated', 'ECOWAS compliance', 'Intermediate quality control', 'Document audit'],
            benefit: isFr ? 'Export intra-africain' : 'Intra-African export',
          },
          {
            level: 'International (EU/USDA)',
            stars: '⭐⭐⭐',
            color: 'border-amber-200 bg-amber-50',
            titleColor: 'text-amber-800',
            market: isFr ? 'Marchés Europe / USA' : 'Europe / USA Markets',
            requirements: isFr
              ? ['Certification régionale validée', 'Audit EU/USDA', 'Tests laboratoire', 'Traçabilité complète']
              : ['Regional certification validated', 'EU/USDA audit', 'Lab tests', 'Full traceability'],
            benefit: isFr ? 'Export premium' : 'Premium export',
          },
        ].map((path) => (
          <div key={path.level} className={`rounded-2xl border-2 p-5 ${path.color}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{path.stars}</span>
              <div>
                <p className={`font-bold text-sm ${path.titleColor}`}>{path.level}</p>
                <p className="text-xs text-gray-500">{path.market}</p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-3">
              {path.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {r}
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-600">🎯 {path.benefit}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-brand-forest">
            {isFr ? 'Demandes de certification' : 'Certification Applications'}
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-gray-500 text-sm">
              {isFr ? 'Aucune demande de certification.' : 'No certification applications yet.'}
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 text-brand-forest text-sm font-semibold hover:underline"
            >
              + {isFr ? 'Ajouter la première' : 'Add the first one'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[isFr ? 'Producteur' : 'Producer', isFr ? 'Produit' : 'Product', isFr ? 'Niveau' : 'Level', isFr ? 'Statut' : 'Status', isFr ? 'Inspection' : 'Inspection', isFr ? 'Score' : 'Score', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cert, i) => {
                  const uiStat = STATUT_TO_UI[cert.statut] || 'pending';
                  return (
                    <tr key={cert._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-medium text-brand-forest">{cert.producteur}</td>
                      <td className="px-4 py-3 text-gray-600">{cert.produit}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-brand-forest/10 text-brand-forest font-medium">
                          {cert.niveau}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={uiStat}
                          onChange={(e) => updateStatus(cert._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium ${statusColor(cert.statut)}`}
                        >
                          <option value="pending">{isFr ? 'En attente' : 'Pending'}</option>
                          <option value="in-progress">{isFr ? 'En cours' : 'In Progress'}</option>
                          <option value="approved">{isFr ? 'Approuvé' : 'Approved'}</option>
                          <option value="rejected">{isFr ? 'Rejeté' : 'Rejected'}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {cert.dateInspection ? new Date(cert.dateInspection).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cert.conformite || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">—</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="font-bold text-brand-forest text-xl mb-4">
              {isFr ? 'Nouvelle demande de certification' : 'New Certification Application'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Agriculteur' : 'Farmer'} *
                </label>
                <select
                  value={form.farmerId}
                  onChange={(e) => setForm((f) => ({ ...f, farmerId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">—</option>
                  {farmers.map((x) => (
                    <option key={x._id || x.id} value={x._id || x.id}>
                      {x.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Niveau' : 'Level'}
                  </label>
                  <select
                    value={form.certificationLevel}
                    onChange={(e) => setForm((f) => ({ ...f, certificationLevel: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="Local">Local</option>
                    <option value="Regional">Regional (ECOWAS)</option>
                    <option value="International">International (EU/USDA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Produit' : 'Product'}
                  </label>
                  <select
                    value={form.product}
                    onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    {['Shea Butter', 'Sesame', 'Cashew', 'Mango', 'Rice', 'Cotton'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Date inspection' : 'Inspection Date'}
                  </label>
                  <input
                    type="date"
                    value={form.inspectionDate}
                    onChange={(e) => setForm((f) => ({ ...f, inspectionDate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Score / quantité' : 'Score / qty note'}
                  </label>
                  <input
                    type="text"
                    value={form.complianceScore}
                    onChange={(e) => setForm((f) => ({ ...f, complianceScore: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                    placeholder="ex: 500 kg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                disabled={saving}
                onClick={saveCert}
                className="flex-1 bg-brand-forest text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60"
              >
                {isFr ? 'Enregistrer' : 'Save'}
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

function mapLogisticsStatutToUi(s) {
  const x = String(s || '');
  if (x === 'scheduled' || x === 'pending') return 'scheduled';
  if (x === 'in_transit') return 'in-transit';
  if (x === 'completed') return 'delivered';
  if (x === 'cancelled') return 'cancelled';
  return 'scheduled';
}

function uiToBackendStatut(ui) {
  const m = {
    scheduled: 'scheduled',
    'in-transit': 'in_transit',
    delivered: 'completed',
    delayed: 'in_transit',
    cancelled: 'cancelled',
  };
  return m[ui] || 'scheduled';
}

export function LogisticsTab({ token, isFr }) {
  const [logistics, setLogistics] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    farmerId: '',
    cooperativeName: '',
    commodity: 'Shea Butter',
    quantityKg: '',
    originCountry: '',
    originCity: '',
    destinationCountry: '',
    destinationCity: '',
    transportMode: 'road',
    departureDate: '',
    estimatedArrival: '',
    driverName: '',
    driverPhone: '',
    vehicleRef: '',
    notes: '',
  });
  const headers = headersWith(token);

  const load = useCallback(async () => {
    try {
      const [d, f] = await Promise.all([
        fetch(API_ENDPOINTS.LOGISTICS.BASE, { headers }).then((r) => r.json()),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=300`, { headers }).then((r) => r.json()),
      ]);
      setLogistics(d.logistics || []);
      const fl = Array.isArray(f) ? f : f.farmers || [];
      setFarmers(fl);
    } catch {
      setLogistics([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const saveLogistic = async () => {
    if (!form.farmerId) {
      alert(isFr ? "Choisir l'agriculteur." : 'Choose a farmer.');
      return;
    }
    const orig = [form.originCity, form.originCountry].filter(Boolean).join(', ') || 'Origin';
    const dest = [form.destinationCity, form.destinationCountry].filter(Boolean).join(', ') || 'Destination';
    setSaving(true);
    try {
      const res = await fetch(API_ENDPOINTS.LOGISTICS.SCHEDULE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'transport',
          farmerId: form.farmerId,
          transport: {
            origine: { adresse: orig },
            destination: { adresse: dest },
            produit: form.commodity,
            quantite: Math.max(1, parseFloat(form.quantityKg) || 100),
            unite: 'kg',
            dateEnlevement: form.departureDate
              ? new Date(form.departureDate).toISOString()
              : new Date().toISOString(),
            dateLivraison: form.estimatedArrival
              ? new Date(form.estimatedArrival).toISOString()
              : new Date(Date.now() + 86400000 * 2).toISOString(),
            conducteur: {
              nom: form.driverName || '',
              telephone: form.driverPhone || '',
            },
            vehicule: [form.transportMode, form.vehicleRef].filter(Boolean).join(' · ') || form.transportMode,
          },
          notes: [form.cooperativeName && `Coop: ${form.cooperativeName}`, form.notes].filter(Boolean).join(' | '),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || 'Failed');
      setShowForm(false);
      await load();
    } catch (e) {
      alert(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, uiStatus) => {
    const statut = uiToBackendStatut(uiStatus);
    try {
      const res = await fetch(API_ENDPOINTS.LOGISTICS.UPDATE_STATUS(id), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ statut }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      setLogistics((prev) =>
        prev.map((l) => (l._id === id ? { ...l, statut } : l))
      );
    } catch (e) {
      alert(e.message || 'Error');
    }
  };

  const statusBadge = (s) => {
    const ui = mapLogisticsStatutToUi(s);
    return (
      {
        scheduled: 'bg-blue-50 text-blue-700',
        'in-transit': 'bg-yellow-50 text-yellow-700',
        delivered: 'bg-green-50 text-green-700',
        delayed: 'bg-red-50 text-red-700',
        cancelled: 'bg-gray-100 text-gray-500',
      }[ui] || 'bg-gray-100 text-gray-500'
    );
  };

  const modeIcon = (m) => ({ road: '🚛', rail: '🚂', air: '✈️', sea: '🚢' }[m] || '🚛');

  const rowUiStatus = (log) => mapLogisticsStatutToUi(log.statut);

  const stats = [
    { label: isFr ? 'Total' : 'Total', value: logistics.length, color: 'text-gray-700', bg: 'bg-gray-50' },
    {
      label: isFr ? 'Planifiés' : 'Scheduled',
      value: logistics.filter((l) => ['pending', 'scheduled'].includes(l.statut)).length,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      label: isFr ? 'En transit' : 'In Transit',
      value: logistics.filter((l) => l.statut === 'in_transit').length,
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
    },
    {
      label: isFr ? 'Terminés' : 'Completed',
      value: logistics.filter((l) => l.statut === 'completed').length,
      color: 'text-green-700',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            {isFr ? 'Gestion Logistique' : 'Logistics Management'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr ? 'Transports réels (API) — agriculteur requis' : 'Real transports (API) — farmer required'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          + {isFr ? 'Nouveau transport' : 'New Transport'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</div>
        ) : logistics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🚛</p>
            <p className="text-gray-500 font-medium mb-1">
              {isFr ? 'Aucun transport enregistré.' : 'No transports recorded yet.'}
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-brand-forest font-semibold text-sm hover:underline"
            >
              + {isFr ? 'Créer le premier transport' : 'Create first transport'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    isFr ? 'Mode' : 'Mode',
                    isFr ? 'Infos' : 'Info',
                    isFr ? 'Commodité' : 'Commodity',
                    isFr ? 'Qté (kg)' : 'Qty (kg)',
                    isFr ? 'Origine → Dest.' : 'Origin → Dest.',
                    isFr ? 'Départ' : 'Departure',
                    isFr ? 'Statut' : 'Status',
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
                {logistics.map((log, i) => {
                  const t = log.transport;
                  const ui = rowUiStatus(log);
                  const veh = String(t?.vehicule || 'road').toLowerCase();
                  const modeKey = veh.includes('rail')
                    ? 'rail'
                    : veh.includes('air')
                      ? 'air'
                      : veh.includes('sea')
                        ? 'sea'
                        : 'road';
                  return (
                    <tr key={log._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 text-xl">{modeIcon(modeKey)}</td>
                      <td className="px-4 py-3 font-medium text-brand-forest">
                        {log.farmerId?.nom || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t?.produit || '—'}</td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {t?.quantite != null ? Number(t.quantite).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {t?.origine?.adresse || '—'}
                        <br />→ {t?.destination?.adresse || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {t?.dateEnlevement ? new Date(t.dateEnlevement).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ui}
                          onChange={(e) => updateStatus(log._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium ${statusBadge(log.statut)}`}
                        >
                          <option value="scheduled">{isFr ? 'Planifié' : 'Scheduled'}</option>
                          <option value="in-transit">{isFr ? 'En transit' : 'In Transit'}</option>
                          <option value="delivered">{isFr ? 'Livré' : 'Delivered'}</option>
                          <option value="delayed">{isFr ? 'Retardé' : 'Delayed'}</option>
                          <option value="cancelled">{isFr ? 'Annulé' : 'Cancelled'}</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="font-bold text-brand-forest text-xl mb-4">
              {isFr ? 'Planifier un transport' : 'Schedule Transport'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Agriculteur *' : 'Farmer *'}
                </label>
                <select
                  value={form.farmerId}
                  onChange={(e) => setForm((f) => ({ ...f, farmerId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                >
                  <option value="">—</option>
                  {farmers.map((x) => (
                    <option key={x._id || x.id} value={x._id || x.id}>
                      {x.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Coopérative (libellé)' : 'Cooperative (label)'}
                  </label>
                  <input
                    value={form.cooperativeName}
                    onChange={(e) => setForm((f) => ({ ...f, cooperativeName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Commodité' : 'Commodity'}
                  </label>
                  <select
                    value={form.commodity}
                    onChange={(e) => setForm((f) => ({ ...f, commodity: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    {['Shea Butter', 'Sesame', 'Cashew', 'Mango', 'Rice', 'Cotton'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Quantité (kg)' : 'Quantity (kg)'}
                  </label>
                  <input
                    type="number"
                    value={form.quantityKg}
                    onChange={(e) => setForm((f) => ({ ...f, quantityKg: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Mode de transport' : 'Transport Mode'}
                  </label>
                  <select
                    value={form.transportMode}
                    onChange={(e) => setForm((f) => ({ ...f, transportMode: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
                  >
                    <option value="road">🚛 Road</option>
                    <option value="rail">🚂 Rail</option>
                    <option value="air">✈️ Air</option>
                    <option value="sea">🚢 Sea</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? "Ville d'origine" : 'Origin City'}
                  </label>
                  <input
                    value={form.originCity}
                    onChange={(e) => setForm((f) => ({ ...f, originCity: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? "Pays d'origine" : 'Origin Country'}
                  </label>
                  <input
                    value={form.originCountry}
                    onChange={(e) => setForm((f) => ({ ...f, originCountry: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Ville de destination' : 'Destination City'}
                  </label>
                  <input
                    value={form.destinationCity}
                    onChange={(e) => setForm((f) => ({ ...f, destinationCity: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Pays de destination' : 'Destination Country'}
                  </label>
                  <input
                    value={form.destinationCountry}
                    onChange={(e) => setForm((f) => ({ ...f, destinationCountry: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Date de départ' : 'Departure Date'}
                  </label>
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Arrivée estimée' : 'Estimated Arrival'}
                  </label>
                  <input
                    type="date"
                    value={form.estimatedArrival}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedArrival: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Chauffeur / véhicule' : 'Driver / vehicle'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder={isFr ? 'Nom du chauffeur' : 'Driver name'}
                    value={form.driverName}
                    onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                  <input
                    placeholder={isFr ? 'Téléphone' : 'Phone'}
                    value={form.driverPhone}
                    onChange={(e) => setForm((f) => ({ ...f, driverPhone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                  />
                </div>
                <input
                  placeholder={isFr ? 'Réf. véhicule' : 'Vehicle ref'}
                  value={form.vehicleRef}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleRef: e.target.value }))}
                  className="w-full mt-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                disabled={saving}
                onClick={saveLogistic}
                className="flex-1 bg-brand-forest text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-60"
              >
                {isFr ? 'Planifier' : 'Schedule'}
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
