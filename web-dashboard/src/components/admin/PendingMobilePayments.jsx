import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { authHeaders } from '../../utils/adminSession';

const API = (API_BASE_URL || '').replace(/\/$/, '');

const METHOD_LABEL = {
  orange_money: 'Orange Money',
  wave: 'Wave',
  cash: 'Espèces',
  stripe: 'Stripe',
};

function timeAgo(date, isFr) {
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return '—';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 1) return isFr ? "à l'instant" : 'just now';
  if (mins < 60) return isFr ? `il y a ${mins} min` : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return isFr ? `il y a ${hrs} h` : `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return isFr ? `il y a ${days} j` : `${days} d ago`;
}

export default function PendingMobilePayments({ token, isFr, compact = false }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/mobile-money/pending`, {
        headers: authHeaders(token),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Load failed');
      setPayments(Array.isArray(d.payments) ? d.payments : []);
      setErr('');
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const confirm = async (referenceCode) => {
    setBusy(referenceCode);
    setMsg('');
    setErr('');
    try {
      const r = await fetch(
        `${API}/api/mobile-money/confirm/${encodeURIComponent(referenceCode)}`,
        { method: 'POST', headers: authHeaders(token) }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) throw new Error(d.error || 'Confirm failed');
      setMsg(isFr ? `Confirmé: ${referenceCode}` : `Confirmed: ${referenceCode}`);
      await load();
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setBusy('');
    }
  };

  const reject = async (referenceCode) => {
    const reason = window.prompt(
      isFr ? 'Motif du rejet:' : 'Rejection reason:',
      isFr ? 'Paiement non reçu' : 'Payment not received'
    );
    if (reason == null) return;
    setBusy(referenceCode);
    setMsg('');
    setErr('');
    try {
      const r = await fetch(
        `${API}/api/mobile-money/reject/${encodeURIComponent(referenceCode)}`,
        {
          method: 'POST',
          headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rejectionReason: reason }),
        }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) throw new Error(d.error || 'Reject failed');
      setMsg(isFr ? `Rejeté: ${referenceCode}` : `Rejected: ${referenceCode}`);
      await load();
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setBusy('');
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!payments.length) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
        {isFr ? 'Aucun paiement mobile en attente.' : 'No pending mobile-money payments.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
        <h3 className="font-bold text-[#1a3c2e] text-lg">
          {isFr ? 'Paiements en attente' : 'Pending payments'}
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5">
            {payments.length}
          </span>
        </h3>
      </div>

      {msg ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {payments.map((p) => (
          <div
            key={p.referenceCode}
            className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-bold text-[#1a3c2e]">{p.entityName || '—'}</p>
                <p className="text-xs text-gray-500">
                  {p.entityType === 'cooperative'
                    ? isFr
                      ? 'Coopérative'
                      : 'Cooperative'
                    : isFr
                      ? 'Centre de transformation'
                      : 'Transformation center'}
                  {' · '}
                  {METHOD_LABEL[p.paymentMethod] || p.paymentMethod}
                </p>
              </div>
              <span className="text-xs text-amber-700 font-semibold whitespace-nowrap">
                {timeAgo(p.createdAt, isFr)}
              </span>
            </div>

            <p className="font-mono text-lg font-bold text-amber-900 tracking-wide my-2">
              {p.referenceCode}
            </p>
            <p className="text-sm text-[#1a3c2e] mb-1">
              ${Number(p.amount).toFixed(0)} USD
              <span className="text-gray-500">
                {' '}
                · {Number(p.amountXOF || p.amount * 600).toLocaleString()} XOF
              </span>
            </p>
            <p className="text-xs text-gray-500 mb-3">{p.entityEmail}</p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy === p.referenceCode}
                onClick={() => confirm(p.referenceCode)}
                className="flex-1 rounded-xl bg-green-600 text-white text-sm font-bold py-2.5 disabled:opacity-60"
              >
                {busy === p.referenceCode ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : isFr ? (
                  'Confirmer ✓'
                ) : (
                  'Confirm ✓'
                )}
              </button>
              <button
                type="button"
                disabled={busy === p.referenceCode}
                onClick={() => reject(p.referenceCode)}
                className="flex-1 rounded-xl bg-red-600 text-white text-sm font-bold py-2.5 disabled:opacity-60"
              >
                {isFr ? 'Rejeter ✗' : 'Reject ✗'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hook-friendly count for nav badge */
export function usePendingMobilePaymentCount(token) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`${API}/api/mobile-money/pending`, {
          headers: authHeaders(token),
        });
        const d = await r.json().catch(() => ({}));
        if (!cancelled) setCount(Array.isArray(d.payments) ? d.payments.length : 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);
  return count;
}
