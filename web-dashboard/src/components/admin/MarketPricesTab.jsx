import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { authHeaders } from '../../utils/adminSession';

const API = (API_BASE_URL || '').replace(/\/$/, '');

function toEditRow(p) {
  const usd = Number(p.pricePerKgUsd);
  const xof = Number(p.pricePerKgXof);
  return {
    pricePerKgUsd: Number.isFinite(usd) ? String(usd) : '',
    pricePerKgXof: Number.isFinite(xof) ? String(xof) : '',
    weeklyChangePercent: Number.isFinite(Number(p.weeklyChangePercent))
      ? String(p.weeklyChangePercent)
      : '0',
    trend: p.trend || 'stable',
    sourceMarket: p.sourceMarket || (p._id ? 'World Bank' : 'Référence'),
  };
}

function sourceLabel(p, isFr) {
  const s = String(p.sourceMarket || '').trim();
  if (s) return s;
  return isFr ? 'Référence' : 'Reference';
}

export default function MarketPricesTab({ token, isFr }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(`${API}/api/marketplace/prices`);
      const d = await r.json();
      const list = Array.isArray(d.prices) ? d.prices : [];
      setRows(list);
      setEdit(Object.fromEntries(list.map((p) => [p.commodity, toEditRow(p)])));
    } catch (e) {
      setErr(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    setMsg('');
    setErr('');
    try {
      const r = await fetch(`${API}/api/marketplace/prices/sync`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) throw new Error(d.error || 'Sync failed');

      setMsg(
        isFr
          ? `Synchronisation démarrée${d.seeded ? ` · ${d.seeded} cultures ajoutées` : ''}`
          : `Sync started${d.seeded ? ` · ${d.seeded} crops seeded` : ''}`
      );

      // Immediate reload (seeded rows), then refresh again after background sync
      await load();
      setTimeout(() => {
        load().finally(() => setSyncing(false));
      }, 4000);
    } catch (e) {
      setErr(e.message || 'Sync failed');
      setSyncing(false);
    }
  };

  const saveRow = async (commodity) => {
    const body = edit[commodity] || {};
    setMsg('');
    setErr('');
    try {
      const r = await fetch(`${API}/api/marketplace/prices/${encodeURIComponent(commodity)}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pricePerKgUsd: Number(body.pricePerKgUsd),
          pricePerKgXof:
            body.pricePerKgXof === '' || body.pricePerKgXof == null
              ? undefined
              : Number(body.pricePerKgXof),
          weeklyChangePercent: Number(body.weeklyChangePercent) || 0,
          trend: body.trend || 'stable',
          sourceMarket: body.sourceMarket || '',
        }),
      });
      const d = await r.json();
      if (!r.ok || d.success === false) throw new Error(d.error || 'Save failed');
      setMsg(isFr ? `Mis à jour: ${commodity}` : `Updated: ${commodity}`);
      await load();
    } catch (e) {
      setErr(e.message || 'Save failed');
    }
  };

  const setField = (commodity, field, value) => {
    setEdit((prev) => ({
      ...prev,
      [commodity]: { ...(prev[commodity] || toEditRow({})), [field]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1a3c2e]">
            {isFr ? 'Prix marché' : 'Market prices'}
          </h2>
          <p className="text-sm text-gray-500">
            {isFr
              ? 'Références CropPrice (World Bank / Pink Sheet + édition manuelle)'
              : 'CropPrice references (World Bank / Pink Sheet + manual edit)'}
          </p>
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1a3c2e] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isFr ? 'Mettre à jour les prix' : 'Update prices'}
        </button>
      </div>

      {msg ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e]" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">Commodity</th>
                <th className="px-3 py-3">USD/kg</th>
                <th className="px-3 py-3">XOF/kg</th>
                <th className="px-3 py-3">Trend</th>
                <th className="px-3 py-3">Δ %</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">updatedAt</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const e = edit[p.commodity] || toEditRow(p);
                return (
                  <tr key={p.commodity} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-[#1a3c2e]">
                      <span className="mr-1">{p.emoji || '🌾'}</span>
                      {isFr ? p.commodityFr || p.commodity : p.commodity}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.0001"
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-gray-900 bg-white"
                        value={e.pricePerKgUsd}
                        onChange={(ev) => setField(p.commodity, 'pricePerKgUsd', ev.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-gray-900 bg-white"
                        value={e.pricePerKgXof}
                        onChange={(ev) => setField(p.commodity, 'pricePerKgXof', ev.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded-lg border border-gray-300 px-2 py-1 text-gray-900 bg-white"
                        value={e.trend || 'stable'}
                        onChange={(ev) => setField(p.commodity, 'trend', ev.target.value)}
                      >
                        <option value="up">up</option>
                        <option value="down">down</option>
                        <option value="stable">stable</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-gray-900 bg-white"
                        value={e.weeklyChangePercent}
                        onChange={(ev) =>
                          setField(p.commodity, 'weeklyChangePercent', ev.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-40 rounded-lg border border-gray-300 px-2 py-1 text-gray-900 bg-white"
                        value={e.sourceMarket || sourceLabel(p, isFr)}
                        onChange={(ev) => setField(p.commodity, 'sourceMarket', ev.target.value)}
                        placeholder={isFr ? 'Référence' : 'Reference'}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {p.updatedAt
                        ? new Date(p.updatedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US')
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => saveRow(p.commodity)}
                        className="rounded-lg bg-[#B5850A] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        {isFr ? 'Enregistrer' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="p-6 text-center text-gray-500 text-sm">
              {isFr
                ? 'Aucune entrée. Lancez une synchronisation ou attendez les prix par défaut.'
                : 'No rows yet. Run a sync or wait for default prices.'}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
