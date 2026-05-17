import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useGeolocation } from '../../hooks/useGeolocation';

import { ALL_COUNTRIES } from '../../data/africanCountries';

const COUNTRIES = ALL_COUNTRIES;

export default function FarmerNeedsTab({ token, isFr }) {
  const [needs, setNeeds] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [response, setResponse] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [supplyListings, setSupplyListings] = useState([]);
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [promotingId, setPromotingId] = useState(null);
  const { country: detectedCountry } = useGeolocation();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const loadNeeds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (countryFilter) params.set('country', countryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('needType', typeFilter);

      const qs = params.toString();
      const needsUrl = qs ? `${API_ENDPOINTS.FARMER_NEEDS.BASE}?${qs}` : API_ENDPOINTS.FARMER_NEEDS.BASE;

      const [needsRes, statsRes] = await Promise.all([
        fetch(needsUrl, { headers }),
        fetch(API_ENDPOINTS.FARMER_NEEDS.STATS, { headers }),
      ]);

      const needsData = needsRes.ok ? await needsRes.json() : {};
      const statsData = statsRes.ok ? await statsRes.json() : {};
      setNeeds(needsData.needs || []);
      setStats(statsData);
    } catch {
      setNeeds([]);
    }
    setLoading(false);
  }, [token, countryFilter, statusFilter, typeFilter]);

  useEffect(() => {
    loadNeeds();
  }, [loadNeeds]);

  const loadSupply = useCallback(async () => {
    if (!token) return;
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    setSupplyLoading(true);
    try {
      const r = await fetch(API_ENDPOINTS.PRODUCE.ADMIN_ALL, { headers: h });
      const d = r.ok ? await r.json() : {};
      setSupplyListings(Array.isArray(d.listings) ? d.listings : []);
    } catch {
      setSupplyListings([]);
    }
    setSupplyLoading(false);
  }, [token]);

  useEffect(() => {
    loadSupply();
  }, [loadSupply]);

  const promoteListing = async (id) => {
    if (!token) return;
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    setPromotingId(id);
    try {
      await fetch(API_ENDPOINTS.PRODUCE.PROMOTE(id), { method: 'PUT', headers: h });
      await loadSupply();
    } finally {
      setPromotingId(null);
    }
  };

  const awaitingPromotion = supplyListings.filter(
    (l) =>
      l.status === 'active' &&
      !l.promotedToMarketplace &&
      String(l.listingType || 'cooperative_supply') === 'cooperative_supply'
  );

  const updateNeed = async (id, status) => {
    await fetch(API_ENDPOINTS.FARMER_NEEDS.BY_ID(id), {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status,
        cooperativeResponse: response,
        adminNotes: response,
      }),
    });
    setSelectedNeed(null);
    setResponse('');
    loadNeeds();
  };

  const statusColor = (s) =>
    ({
      submitted: 'bg-yellow-50 text-yellow-700',
      received_by_cooperative: 'bg-blue-50 text-blue-700',
      processing: 'bg-purple-50 text-purple-700',
      fulfilled: 'bg-green-50 text-green-700',
      declined: 'bg-red-50 text-red-700',
    }[s] || 'bg-gray-100 text-gray-600');

  const statusLabel = (s) =>
    ({
      submitted: isFr ? 'Soumis' : 'Submitted',
      received_by_cooperative: isFr ? 'Reçu coopérative' : 'Coop Received',
      processing: isFr ? 'En traitement' : 'Processing',
      fulfilled: isFr ? 'Satisfait' : 'Fulfilled',
      declined: isFr ? 'Refusé' : 'Declined',
    }[s] || s);

  const needTypeIcon = (t) =>
    ({
      equipment: '🚜',
      training: '📚',
      certification: '⭐',
      irrigation: '💧',
      seeds: '🌱',
      financing: '💰',
      market_access: '🌍',
      other: '📋',
    }[t] || '📋');

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-forest">
            🌾 {isFr ? 'Besoins des Agriculteurs' : 'Farmer Needs'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFr
              ? 'Traitez et coordonnez les besoins soumis par les agriculteurs'
              : 'Process and coordinate needs submitted by farmers'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: isFr ? 'Total' : 'Total',
            value: stats.total || 0,
            bg: 'bg-gray-50',
            color: 'text-gray-700',
          },
          {
            label: isFr ? 'En attente' : 'Pending',
            value: stats.pending || 0,
            bg: 'bg-yellow-50',
            color: 'text-yellow-700',
          },
          {
            label: isFr ? 'En traitement' : 'Processing',
            value: stats.processing || 0,
            bg: 'bg-blue-50',
            color: 'text-blue-700',
          },
          {
            label: isFr ? 'Satisfaits' : 'Fulfilled',
            value: stats.fulfilled || 0,
            bg: 'bg-green-50',
            color: 'text-green-700',
          },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          📍 {isFr ? 'Filtres — données par localisation' : 'Filters — location-based data'}
        </p>
        <div className="flex flex-wrap gap-3">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
          >
            <option value="">{isFr ? '🌍 Tous les pays' : '🌍 All countries'}</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
          >
            <option value="all">{isFr ? 'Tous statuts' : 'All statuses'}</option>
            <option value="submitted">{isFr ? 'Soumis' : 'Submitted'}</option>
            <option value="received_by_cooperative">{isFr ? 'Reçu coopérative' : 'Coop Received'}</option>
            <option value="processing">{isFr ? 'En traitement' : 'Processing'}</option>
            <option value="fulfilled">{isFr ? 'Satisfait' : 'Fulfilled'}</option>
            <option value="declined">{isFr ? 'Refusé' : 'Declined'}</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-forest"
          >
            <option value="all">{isFr ? 'Tous types' : 'All types'}</option>
            <option value="equipment">🚜 {isFr ? 'Équipement' : 'Equipment'}</option>
            <option value="training">📚 {isFr ? 'Formation' : 'Training'}</option>
            <option value="certification">⭐ Certification</option>
            <option value="irrigation">💧 Irrigation</option>
            <option value="seeds">🌱 {isFr ? 'Semences' : 'Seeds'}</option>
            <option value="financing">💰 {isFr ? 'Financement' : 'Financing'}</option>
            <option value="market_access">🌍 {isFr ? 'Marchés' : 'Markets'}</option>
            <option value="other">📋 {isFr ? 'Autre' : 'Other'}</option>
          </select>
          {detectedCountry && !countryFilter && (
            <button
              type="button"
              onClick={() => setCountryFilter(detectedCountry)}
              className="text-xs text-brand-forest border border-brand-forest px-3 py-1.5 rounded-lg hover:bg-brand-forest/5 transition flex items-center gap-1"
            >
              📍 {isFr ? `Voir ${detectedCountry}` : `View ${detectedCountry}`}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</div>
        ) : needs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌾</p>
            <p className="text-gray-500">{isFr ? 'Aucun besoin soumis.' : 'No needs submitted yet.'}</p>
            <p className="text-gray-400 text-sm mt-1">
              {isFr ? 'Les demandes des agriculteurs apparaîtront ici.' : 'Farmer requests will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    isFr ? 'Type' : 'Type',
                    isFr ? 'Agriculteur' : 'Farmer',
                    isFr ? 'Coopérative' : 'Cooperative',
                    isFr ? 'Localisation' : 'Location',
                    isFr ? 'Urgence' : 'Urgency',
                    isFr ? 'Statut' : 'Status',
                    isFr ? 'Date' : 'Date',
                    'Actions',
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {needs.map((need, i) => (
                  <tr
                    key={need._id}
                    className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} cursor-pointer hover:bg-blue-50/20 transition`}
                    onClick={() => setSelectedNeed(selectedNeed?._id === need._id ? null : need)}
                  >
                    <td className="px-4 py-3 text-xl">{needTypeIcon(need.needType)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-forest">{need.farmerName || '—'}</p>
                      <p className="text-xs text-gray-400">{need.farmerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {need.cooperativeName || (isFr ? 'Sans coopérative' : 'No cooperative')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      🌍 {need.country || '—'}
                      <br />
                      {need.region || ''}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          need.urgencyLevel === 'high'
                            ? 'bg-red-50 text-red-700'
                            : need.urgencyLevel === 'medium'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {need.urgencyLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(need.status)}`}>
                        {statusLabel(need.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {need.createdAt ? new Date(need.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-forest hover:underline">
                      {isFr ? 'Traiter →' : 'Process →'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedNeed && (
          <div className="border-t border-gray-200 bg-blue-50/30 px-5 py-5">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  {isFr ? 'Description' : 'Description'}
                </p>
                <p className="text-sm text-gray-700">{selectedNeed.description || '—'}</p>
                {selectedNeed.specificEquipment?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {isFr ? 'Équipements:' : 'Equipment:'} {selectedNeed.specificEquipment.join(', ')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {isFr ? "Répondre à l'agriculteur" : 'Respond to farmer'}
                </p>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={2}
                  placeholder={
                    isFr
                      ? "Message envoyé par WhatsApp à l'agriculteur..."
                      : 'Message sent by WhatsApp to the farmer...'
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-forest resize-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  status: 'received_by_cooperative',
                  label: isFr ? '🤝 Coopérative notifiée' : '🤝 Coop Notified',
                  color: 'bg-blue-600',
                },
                {
                  status: 'processing',
                  label: isFr ? '⚙️ En traitement' : '⚙️ Processing',
                  color: 'bg-purple-600',
                },
                {
                  status: 'fulfilled',
                  label: isFr ? '✅ Besoin satisfait' : '✅ Need Fulfilled',
                  color: 'bg-green-600',
                },
                {
                  status: 'declined',
                  label: isFr ? '❌ Refuser' : '❌ Decline',
                  color: 'bg-red-500',
                },
              ].map((action) => (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => updateNeed(selectedNeed._id, action.status)}
                  className={`text-xs text-white px-4 py-2 rounded-xl font-semibold ${action.color} hover:opacity-90 transition`}
                >
                  {action.label}
                </button>
              ))}
              {selectedNeed.farmerPhone && (
                <a
                  href={`https://wa.me/${String(selectedNeed.farmerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(
                    response ||
                      (isFr
                        ? `Bonjour ${selectedNeed.farmerName}, concernant votre demande sur Sahel AgriConnect...`
                        : `Hello ${selectedNeed.farmerName}, regarding your request on Sahel AgriConnect...`)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition"
                >
                  💬 WhatsApp Direct
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-brand-forest">
            📦{' '}
            {isFr
              ? 'Production déclarée — En attente de promotion AfriYield'
              : 'Declared Production — Awaiting AfriYield Promotion'}
          </h3>
          <button
            type="button"
            onClick={() => loadSupply()}
            disabled={supplyLoading || !token}
            className="text-xs font-semibold text-brand-forest border border-brand-forest px-3 py-1.5 rounded-lg hover:bg-brand-forest/5 disabled:opacity-50"
          >
            {supplyLoading ? (isFr ? '…' : '…') : isFr ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {!token ? (
          <p className="text-sm text-gray-500">{isFr ? 'Connexion requise.' : 'Sign in required.'}</p>
        ) : supplyLoading ? (
          <p className="text-sm text-gray-400">{isFr ? 'Chargement…' : 'Loading…'}</p>
        ) : awaitingPromotion.length === 0 ? (
          <p className="text-sm text-gray-500">
            {isFr
              ? 'Aucune déclaration en attente de promotion sur AfriYield.'
              : 'No declarations awaiting AfriYield promotion.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    {isFr ? 'Agriculteur' : 'Farmer'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    {isFr ? 'Produit' : 'Commodity'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    {isFr ? 'Qté (kg)' : 'Qty (kg)'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    {isFr ? 'Prix/kg' : '$/kg'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    {isFr ? 'Coopérative' : 'Cooperative'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-36" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {awaitingPromotion.map((l) => (
                  <tr key={l._id} className="border-t border-gray-100">
                    <td className="px-3 py-3">
                      <p className="font-medium text-brand-forest">{l.farmerName || '—'}</p>
                      <p className="text-xs text-gray-400">{l.farmerPhone || l.farmerEmail || ''}</p>
                    </td>
                    <td className="px-3 py-3">{l.commodity}</td>
                    <td className="px-3 py-3 font-mono">{Number(l.quantityKg || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono">${l.pricePerKgUSD}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{l.cooperativeName || '—'}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={promotingId === l._id}
                        onClick={() => promoteListing(l._id)}
                        className="text-xs font-bold text-white bg-[#B5850A] px-3 py-1.5 rounded-lg hover:bg-[#9a7109] disabled:opacity-50"
                      >
                        {promotingId === l._id
                          ? '…'
                          : isFr
                            ? 'Promouvoir AfriYield'
                            : 'Promote to AfriYield'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
