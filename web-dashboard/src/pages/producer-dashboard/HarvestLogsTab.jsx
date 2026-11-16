import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

const INPUT_TYPE_OPTIONS = [
  { value: 'fertilizer', fr: 'Engrais', en: 'Fertilizer' },
  { value: 'pesticide', fr: 'Pesticide', en: 'Pesticide' },
  { value: 'organic', fr: 'Organique', en: 'Organic' },
  { value: 'none', fr: 'Aucun', en: 'None' },
];

const GRADE_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'ungraded', fr: 'Non classé', en: 'Ungraded' },
];

function emptyInputRow() {
  return { name: '', type: 'none', quantity: '', unit: '' };
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function HarvestLogsTab({ isFr, profile }) {
  const [crops, setCrops] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [form, setForm] = useState({
    cropType: '',
    harvestDate: new Date().toISOString().slice(0, 10),
    quantityKg: '',
    plotSizeHectares: '',
    qualityGrade: 'ungraded',
    storageLocation: '',
    notes: '',
    inputs: [emptyInputRow()],
  });

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token_farmer') || '' : '';

  const loadLogs = useCallback(async () => {
    if (!token) {
      setLoadingLogs(false);
      setLogs([]);
      return;
    }
    setLoadingLogs(true);
    try {
      const r = await fetch(API_ENDPOINTS.HARVEST_LOGS.MY, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setLogs(Array.isArray(d.harvestLogs) ? d.harvestLogs : []);
    } catch (e) {
      setError(e.message || (isFr ? 'Impossible de charger les récoltes.' : 'Could not load harvests.'));
    } finally {
      setLoadingLogs(false);
    }
  }, [token, isFr]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(API_ENDPOINTS.CONFIG.CROPS);
        const d = await r.json().catch(() => ({}));
        if (!cancelled && Array.isArray(d.crops)) {
          setCrops(d.crops);
          setForm((p) => ({
            ...p,
            cropType: p.cropType || d.crops[0] || '',
            plotSizeHectares:
              p.plotSizeHectares ||
              (profile?.superficie != null ? String(profile.superficie) : ''),
          }));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.superficie]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const updateInput = (idx, key, value) => {
    setForm((p) => {
      const inputs = p.inputs.map((row, i) => (i === idx ? { ...row, [key]: value } : row));
      return { ...p, inputs };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setOkMsg('');
    if (!token) {
      setError(
        isFr
          ? 'Connectez-vous avec votre compte agriculteur pour enregistrer une récolte.'
          : 'Sign in with your farmer account to log a harvest.'
      );
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        cropType: form.cropType,
        harvestDate: form.harvestDate,
        quantityKg: Number(form.quantityKg),
        plotSizeHectares:
          form.plotSizeHectares !== '' ? Number(form.plotSizeHectares) : undefined,
        qualityGrade: form.qualityGrade,
        storageLocation: form.storageLocation,
        notes: form.notes,
        cooperativeId: profile?.cooperativeId || undefined,
        inputs: form.inputs.map((row) => ({
          name: row.name,
          type: row.type,
          quantity: row.quantity !== '' ? Number(row.quantity) : null,
          unit: row.unit,
        })),
      };
      const r = await fetch(API_ENDPOINTS.HARVEST_LOGS.BASE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setOkMsg(
        isFr
          ? `Récolte enregistrée — lot ${d.harvestLog?.batchId || ''}`
          : `Harvest saved — batch ${d.harvestLog?.batchId || ''}`
      );
      setForm((p) => ({
        ...p,
        quantityKg: '',
        storageLocation: '',
        notes: '',
        inputs: [emptyInputRow()],
        harvestDate: new Date().toISOString().slice(0, 10),
      }));
      await loadLogs();
    } catch (err) {
      setError(err.message || (isFr ? 'Erreur d\'enregistrement.' : 'Save error.'));
    } finally {
      setSubmitting(false);
    }
  };

  const gradeLabel = (g) => {
    if (g === 'ungraded') return isFr ? 'Non classé' : 'Ungraded';
    return g || '—';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-[#1a3c2e] mb-1">
          {isFr ? 'Enregistrer une récolte' : 'Log a harvest'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {isFr
            ? 'Créez un lot traçable (batchId) pour votre production.'
            : 'Create a traceable batch for your production.'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-[#1a3c2e]">{isFr ? 'Culture' : 'Crop'}</span>
              <select
                required
                value={form.cropType}
                onChange={(e) => setForm((p) => ({ ...p, cropType: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#1a3c2e]">
                {isFr ? 'Date de récolte' : 'Harvest date'}
              </span>
              <input
                type="date"
                required
                value={form.harvestDate}
                onChange={(e) => setForm((p) => ({ ...p, harvestDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#1a3c2e]">
                {isFr ? 'Quantité (kg)' : 'Quantity (kg)'}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.quantityKg}
                onChange={(e) => setForm((p) => ({ ...p, quantityKg: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#1a3c2e]">
                {isFr ? 'Taille de parcelle (ha)' : 'Plot size (ha)'}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.plotSizeHectares}
                onChange={(e) => setForm((p) => ({ ...p, plotSizeHectares: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#1a3c2e]">
                {isFr ? 'Qualité' : 'Quality grade'}
              </span>
              <select
                value={form.qualityGrade}
                onChange={(e) => setForm((p) => ({ ...p, qualityGrade: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label || (isFr ? g.fr : g.en)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#1a3c2e]">
                {isFr ? 'Lieu de stockage' : 'Storage location'}
              </span>
              <input
                type="text"
                value={form.storageLocation}
                onChange={(e) => setForm((p) => ({ ...p, storageLocation: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
                placeholder={isFr ? 'Optionnel' : 'Optional'}
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-[#1a3c2e] mb-2">
              {isFr ? 'Intrants utilisés' : 'Inputs used'}
            </p>
            <div className="space-y-2">
              {form.inputs.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateInput(idx, 'name', e.target.value)}
                    placeholder={isFr ? 'Nom' : 'Name'}
                    className="sm:col-span-3 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                  <select
                    value={row.type}
                    onChange={(e) => updateInput(idx, 'type', e.target.value)}
                    className="sm:col-span-3 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    {INPUT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {isFr ? o.fr : o.en}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => updateInput(idx, 'quantity', e.target.value)}
                    placeholder={isFr ? 'Qté' : 'Qty'}
                    className="sm:col-span-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateInput(idx, 'unit', e.target.value)}
                    placeholder={isFr ? 'Unité' : 'Unit'}
                    className="sm:col-span-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        inputs: p.inputs.length <= 1 ? [emptyInputRow()] : p.inputs.filter((_, i) => i !== idx),
                      }))
                    }
                    className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-xs text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isFr ? 'Retirer' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, inputs: [...p.inputs, emptyInputRow()] }))}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#B5850A]"
            >
              <Plus className="w-4 h-4" />
              {isFr ? 'Ajouter une ligne' : 'Add row'}
            </button>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-[#1a3c2e]">{isFr ? 'Notes' : 'Notes'}</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              placeholder={isFr ? 'Optionnel' : 'Optional'}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {okMsg ? <p className="text-sm text-green-700 font-medium">{okMsg}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
            style={{ background: '#1a3c2e' }}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                …
              </span>
            ) : isFr ? (
              'Enregistrer la récolte'
            ) : (
              'Save harvest'
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-[#1a3c2e] mb-4">
          {isFr ? 'Mes récoltes' : 'My harvests'}
        </h3>
        {loadingLogs ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin text-[#1a3c2e]" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            {isFr ? 'Aucune récolte enregistrée pour le moment.' : 'No harvest logs yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log._id || log.batchId}
                className="rounded-xl border border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="font-bold text-[#1a3c2e]">{log.cropType}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{log.batchId}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(log.harvestDate)} · {Number(log.quantityKg || 0).toLocaleString()} kg ·{' '}
                    {gradeLabel(log.qualityGrade)}
                  </p>
                </div>
                <span
                  className={`inline-flex self-start text-xs font-bold px-2.5 py-1 rounded-full ${
                    log.verifiedByCoop
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {log.verifiedByCoop
                    ? isFr
                      ? 'Vérifié ✓'
                      : 'Verified ✓'
                    : isFr
                      ? 'En attente'
                      : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
