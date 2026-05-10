import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const STATUTS = [
  'pending',
  'scheduled',
  'in_transit',
  'in_storage',
  'in_transformation',
  'completed',
  'cancelled',
];

export default function LogisticsManagement() {
  const [logistics, setLogistics] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [form, setForm] = useState({
    farmerId: '',
    cooperativeId: '',
    origine: '',
    destination: '',
    produit: '',
    quantite: '',
    dateEnlevement: '',
    dateLivraison: '',
    notes: '',
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const headers = authHeaders();
    try {
      const [logRes, farmRes, coopRes, capRes] = await Promise.all([
        fetch(API_ENDPOINTS.LOGISTICS.BASE, { headers }),
        fetch(`${API_ENDPOINTS.FARMERS.BASE}?limit=300`, { headers }),
        fetch(`${API_BASE_URL}/api/cooperatives/admin`, { headers }),
        fetch(API_ENDPOINTS.LOGISTICS.CAPACITY, { headers }),
      ]);
      const logJson = await logRes.json().catch(() => ({}));
      const farmJson = await farmRes.json().catch(() => ({}));
      const coopJson = await coopRes.json().catch(() => ({}));
      const capJson = await capRes.json().catch(() => ({}));

      setLogistics(logJson.logistics || []);
      const fl = Array.isArray(farmJson) ? farmJson : farmJson.farmers || [];
      setFarmers(fl);
      setCooperatives(coopJson.cooperatives || []);
      setCapacity(capJson.success ? capJson : null);
    } catch {
      setError('Erreur de chargement — vérifiez la connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const submitSchedule = async () => {
    if (!form.farmerId || !form.origine.trim() || !form.destination.trim()) {
      alert('Agriculteur, origine et destination sont requis.');
      return;
    }
    setScheduling(true);
    try {
      const payload = {
        type: 'transport',
        farmerId: form.farmerId,
        ...(form.cooperativeId ? { cooperativeId: form.cooperativeId } : {}),
        transport: {
          origine: { adresse: form.origine.trim() },
          destination: { adresse: form.destination.trim() },
          produit: form.produit.trim() || '—',
          quantite: Math.max(1, parseFloat(String(form.quantite).replace(',', '.')) || 100),
          unite: 'kg',
          dateEnlevement: form.dateEnlevement ? new Date(form.dateEnlevement).toISOString() : new Date().toISOString(),
          dateLivraison: form.dateLivraison
            ? new Date(form.dateLivraison).toISOString()
            : new Date(Date.now() + 86400000 * 3).toISOString(),
        },
        notes: form.notes.trim() || undefined,
      };
      const res = await fetch(API_ENDPOINTS.LOGISTICS.SCHEDULE, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.details || 'Échec');
      setShowSchedule(false);
      setForm({
        farmerId: '',
        cooperativeId: '',
        origine: '',
        destination: '',
        produit: '',
        quantite: '',
        dateEnlevement: '',
        dateLivraison: '',
        notes: '',
      });
      await loadAll();
    } catch (e) {
      alert(e.message || 'Erreur');
    } finally {
      setScheduling(false);
    }
  };

  const updateStatus = async (id, statut) => {
    try {
      const res = await fetch(API_ENDPOINTS.LOGISTICS.UPDATE_STATUS(id), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ statut, notes: `Statut: ${statut}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Échec');
      await loadAll();
    } catch (e) {
      alert(e.message || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 gap-3 text-gray-600">
        <Loader2 className="w-8 h-8 animate-spin text-primary-green" aria-hidden />
        <span>Chargement logistique…</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary-green mb-2">Logistique</h2>
          <p className="text-gray-600">
            Opérations réelles via <code className="text-xs bg-gray-100 px-1 rounded">GET/POST /api/logistics</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSchedule(true)}
          className="rounded-xl bg-brand-forest text-white font-semibold px-4 py-2 hover:bg-[#143326]"
        >
          + Planifier transport
        </button>
      </div>

      {capacity?.capacity ? (
        <div className="card mb-6 grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Capacité stockage (API capacity)</p>
            <p className="text-lg font-bold text-primary-green">
              utilisé {capacity.capacity.storage?.used ?? '—'} — transformation{' '}
              {capacity.capacity.transformation?.used ?? '—'}
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Source: GET /api/logistics/capacity/planning
          </div>
        </div>
      ) : null}

      <div className="card mb-6 overflow-x-auto">
        <h3 className="text-xl font-bold text-primary-green mb-4">Opérations planifiées</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left">
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Statut</th>
              <th className="py-2 pr-3">Agriculteur</th>
              <th className="py-2 pr-3">Détails</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {logistics.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Aucune opération. Créez un transport ci-dessus.
                </td>
              </tr>
            ) : (
              logistics.map((log) => (
                <tr key={log._id} className="border-b border-gray-100">
                  <td className="py-3 pr-3 font-medium">{log.type}</td>
                  <td className="py-3 pr-3">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs">{log.statut}</span>
                  </td>
                  <td className="py-3 pr-3">
                    {log.farmerId?.nom || log.farmerId || '—'}
                  </td>
                  <td className="py-3 pr-3 text-gray-600 max-w-xs truncate">
                    {log.type === 'transport' && log.transport
                      ? `${log.transport.origine?.adresse || '—'} → ${log.transport.destination?.adresse || '—'}`
                      : log.notes || '—'}
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      value={log.statut}
                      onChange={(e) => updateStatus(log._id, e.target.value)}
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showSchedule ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-primary-green mb-4">Planifier un transport</h3>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-gray-600">Agriculteur *</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.farmerId}
                  onChange={(e) => setForm((p) => ({ ...p, farmerId: e.target.value }))}
                >
                  <option value="">—</option>
                  {farmers.map((f) => (
                    <option key={f._id || f.id} value={f._id || f.id}>
                      {f.nom} — {f.region}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-gray-600">Coopérative (optionnel)</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
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
              <label className="block">
                <span className="text-gray-600">Origine *</span>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.origine}
                  onChange={(e) => setForm((p) => ({ ...p, origine: e.target.value }))}
                  placeholder="Ex: Ferme, région"
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Destination *</span>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.destination}
                  onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                  placeholder="Ex: Entrepôt, processeur"
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Produit</span>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.produit}
                  onChange={(e) => setForm((p) => ({ ...p, produit: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Quantité (kg)</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.quantite}
                  onChange={(e) => setForm((p) => ({ ...p, quantite: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-gray-600">Enlèvement</span>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.dateEnlevement}
                    onChange={(e) => setForm((p) => ({ ...p, dateEnlevement: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-gray-600">Livraison</span>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.dateLivraison}
                    onChange={(e) => setForm((p) => ({ ...p, dateLivraison: e.target.value }))}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-gray-600">Notes</span>
                <textarea
                  className="mt-1 w-full rounded-lg border px-3 py-2 min-h-[60px]"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border"
                onClick={() => setShowSchedule(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={scheduling}
                onClick={submitSchedule}
                className="px-4 py-2 rounded-xl bg-brand-forest text-white font-semibold disabled:opacity-50"
              >
                {scheduling ? 'Envoi…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
