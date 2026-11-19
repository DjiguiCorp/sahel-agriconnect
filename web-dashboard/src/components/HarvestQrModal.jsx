import { useEffect, useState } from 'react';
import { Loader2, X, Download, ExternalLink } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function HarvestQrModal({ batchId, isFr, onClose }) {
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const r = await fetch(API_ENDPOINTS.HARVEST_LOGS.QR(batchId));
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok || !d.qrCodeBase64) throw new Error(d.error || 'QR failed');
        setQr(d.qrCodeBase64);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const download = () => {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `${batchId}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white border border-gray-200 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#1a3a2a]">
            {isFr ? 'QR de traçabilité' : 'Traceability QR'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3a2a]" />
          </div>
        ) : err ? (
          <p className="text-sm text-red-600 text-center py-8">{err}</p>
        ) : (
          <div className="text-center">
            <img
              src={qr}
              alt={`QR ${batchId}`}
              className="mx-auto w-56 h-56 rounded-xl border border-gray-100"
            />
            <p className="mt-3 font-mono text-sm font-bold text-[#1a3a2a]">{batchId}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white"
                style={{ background: '#c9962a' }}
              >
                <Download className="w-4 h-4" />
                {isFr ? 'Télécharger le QR' : 'Download QR'}
              </button>
              <a
                href={`/trace/${encodeURIComponent(batchId)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border border-[#1a3a2a]/20 text-[#1a3a2a]"
              >
                <ExternalLink className="w-4 h-4" />
                {isFr ? 'Voir la page publique' : 'View public page'}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
