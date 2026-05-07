import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function truncate(s, n = 80) {
  if (!s) return '—';
  const t = String(s);
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function urgencyPill(u) {
  const map = {
    immediate: 'bg-red-100 text-red-900 border-red-200',
    within_week: 'bg-amber-100 text-amber-900 border-amber-200',
    seasonal: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  };
  const label = { immediate: 'Immédiat', within_week: 'Cette semaine', seasonal: 'Saison' }[u] || u;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${map[u] || 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
}

function statusLabel(s) {
  const m = { new: 'Nouveau', assigned: 'Assigné', in_progress: 'En cours', resolved: 'Résolu' };
  return m[s] || s;
}

export default function ExpertRequestsManagement({ onCountsChanged }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [assignInput, setAssignInput] = useState({ id: null, name: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API_ENDPOINTS.EXPERTS.REQUESTS, { headers: authHeaders() });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Chargement impossible');
      const list = Array.isArray(data.requests) ? data.requests : [];
      setRequests(list);
      if (typeof onCountsChanged === 'function') {
        onCountsChanged(list.filter((x) => x.status === 'new').length);
      }
    } catch (e) {
      setError(e.message || 'Erreur');
      setRequests([]);
      if (typeof onCountsChanged === 'function') onCountsChanged(0);
    } finally {
      setLoading(false);
    }
  }, [onCountsChanged]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'assigned') return requests.filter((q) => q.status === 'assigned' || q.status === 'in_progress');
    if (filter === 'all') return requests;
    return requests.filter((q) => q.status === filter);
  }, [requests, filter]);

  const assignExpert = async (id) => {
    const assignedExpert = assignInput.name.trim();
    if (!assignedExpert || assignInput.id !== id) return;
    try {
      const r = await fetch(API_ENDPOINTS.EXPERTS.ASSIGN(id), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ assignedExpert }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Assignation échouée');
      await load();
      setAssignInput({ id: null, name: '' });
    } catch (e) {
      alert(e.message);
    }
  };

  const markResolved = async (id) => {
    try {
      const r = await fetch(API_ENDPOINTS.EXPERTS.STATUS(id), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'resolved' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Mise à jour échouée');
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map((q) => ({
      FarmerName: q.farmerName,
      Email: q.farmerEmail,
      Phone: q.farmerPhone || '',
      Country: q.country || '',
      Region: q.region || '',
      CropType: q.cropType || '',
      Problem: (q.problemDescription || '').replace(/\r?\n/g, ' '),
      DiseaseDetected: q.diseaseDetected || '',
      CooperativeMember: q.cooperativeMember ? 'yes' : 'no',
      Urgency: q.urgency,
      Status: q.status,
      CreatedAt: q.createdAt ? new Date(q.createdAt).toISOString() : '',
    }));
    const header = Object.keys(rows[0] || {});
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header.join(','), ...rows.map((row) => header.map((h) => esc(row[h])).join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `expert-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary-green">Demandes Experts</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'Tous'],
            ['new', 'Nouveau'],
            ['assigned', 'Assignés'],
            ['resolved', 'Résolus'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                filter === k ? 'bg-primary-green text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Exporter CSV
        </button>
      </div>

      {loading && <p className="text-gray-600">Chargement…</p>}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Agriculteur</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Pays</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Culture</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Problème</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Diag. IA</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Coop.</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Urgence</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Statut</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((q) => (
                <tr key={q._id} className="text-gray-800">
                  <td className="px-3 py-2 font-medium">{q.farmerName}</td>
                  <td className="px-3 py-2">{q.farmerEmail}</td>
                  <td className="px-3 py-2">{q.country || '—'}</td>
                  <td className="px-3 py-2">{q.cropType || '—'}</td>
                  <td className="max-w-[140px] px-3 py-2">{truncate(q.problemDescription)}</td>
                  <td className="max-w-[120px] px-3 py-2">{truncate(q.diseaseDetected)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${
                        q.cooperativeMember ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    >
                      {q.cooperativeMember ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{urgencyPill(q.urgency)}</td>
                  <td className="px-3 py-2">{statusLabel(q.status)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {q.createdAt ? new Date(q.createdAt).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {assignInput.id === q._id ? (
                        <>
                          <input
                            placeholder="Nom expert"
                            value={assignInput.name}
                            onChange={(e) => setAssignInput({ id: q._id, name: e.target.value })}
                            className="w-full min-w-[120px] rounded border px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            className="text-xs font-semibold text-primary-green underline"
                            onClick={() => assignExpert(q._id)}
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            className="text-xs text-gray-600"
                            onClick={() => setAssignInput({ id: null, name: '' })}
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setAssignInput({ id: q._id, name: q.assignedExpert || '' })}
                            className="text-xs font-semibold text-primary-green hover:underline"
                          >
                            Assigner un expert
                          </button>
                          {q.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => markResolved(q._id)}
                              className="text-xs font-semibold text-gray-700 hover:underline"
                            >
                              Marquer résolu
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Aucune demande pour ce filtre.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
