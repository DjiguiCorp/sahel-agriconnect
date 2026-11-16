import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import TraceabilityLookup from './TraceabilityLookup';

function fmtDate(d, locale) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function gradeStyle(grade) {
  if (grade === 'A') return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
  if (grade === 'B') return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
  if (grade === 'C') return { bg: '#ffedd5', color: '#9a3412', border: '#fdba74' };
  return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
}

export default function TracePage() {
  const { batchId, batchNumber } = useParams();
  const id = String(batchId || batchNumber || '').trim();
  const { i18n } = useTranslation();
  const [isFr, setIsFr] = useState(() =>
    (i18n.resolvedLanguage || i18n.language || '').startsWith('fr')
  );
  const [state, setState] = useState({
    loading: Boolean(id),
    cert: null,
    missing: false,
    legacy: false,
    err: '',
  });

  useEffect(() => {
    if (!id) {
      setState({ loading: false, cert: null, missing: false, legacy: true, err: '' });
      return;
    }
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, err: '', missing: false, legacy: false }));
      try {
        const r = await fetch(API_ENDPOINTS.HARVEST_LOGS.CERTIFICATE(id));
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (r.ok && (d.batchId || d.success)) {
          setState({
            loading: false,
            cert: d,
            missing: false,
            legacy: false,
            err: '',
          });
          return;
        }
        // Fall back to supply-chain batch lookup for older SAC-* lots
        const sc = await fetch(API_ENDPOINTS.SUPPLYCHAIN.BATCH(encodeURIComponent(id)));
        if (cancelled) return;
        if (sc.ok) {
          setState({ loading: false, cert: null, missing: false, legacy: true, err: '' });
          return;
        }
        setState({ loading: false, cert: null, missing: true, legacy: false, err: '' });
      } catch (e) {
        if (!cancelled) {
          setState({
            loading: false,
            cert: null,
            missing: false,
            legacy: false,
            err: e.message || 'Error',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.legacy) {
    return <TraceabilityLookup />;
  }

  const locale = isFr ? 'fr-FR' : 'en-US';
  const cert = state.cert;
  const grade = cert?.qualityGrade || 'ungraded';
  const gStyle = gradeStyle(grade);

  return (
    <div
      className="min-h-screen px-4 py-8 md:py-12"
      style={{ background: 'linear-gradient(180deg, #f7f3ea 0%, #ffffff 45%, #f5f0e8 100%)' }}
    >
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div className="max-w-xl mx-auto">
        <div className="no-print flex justify-end mb-4">
          <div className="inline-flex rounded-xl border border-[#1a3a2a]/20 overflow-hidden text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsFr(true);
                i18n.changeLanguage('fr');
              }}
              className={`px-3 py-1.5 ${isFr ? 'bg-[#1a3a2a] text-white' : 'bg-white text-[#1a3a2a]'}`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFr(false);
                i18n.changeLanguage('en');
              }}
              className={`px-3 py-1.5 ${!isFr ? 'bg-[#1a3a2a] text-white' : 'bg-white text-[#1a3a2a]'}`}
            >
              EN
            </button>
          </div>
        </div>

        {state.loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#1a3a2a]" />
            <p className="mt-3 text-sm text-[#1a3a2a]/70">
              {isFr ? 'Chargement du certificat…' : 'Loading certificate…'}
            </p>
          </div>
        ) : state.err ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="text-red-700 font-semibold">{state.err}</p>
          </div>
        ) : state.missing || !cert ? (
          <div className="rounded-2xl border border-[#1a3a2a]/15 bg-white p-10 text-center print-card">
            <p className="text-5xl mb-3">🔍</p>
            <h1 className="text-xl font-bold text-[#1a3a2a] mb-2">
              {isFr ? 'Lot introuvable' : 'Batch not found'}
            </h1>
            <p className="text-sm text-[#1a3a2a]/60 mb-6">
              {isFr
                ? `Aucun certificat pour le lot « ${id || '—'} ».`
                : `No certificate found for batch “${id || '—'}”.`}
            </p>
            <Link
              to="/"
              className="inline-flex px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#1a3a2a' }}
            >
              {isFr ? 'Retour à l’accueil' : 'Back to home'}
            </Link>
          </div>
        ) : (
          <article
            className="print-card rounded-3xl border bg-white overflow-hidden shadow-lg"
            style={{ borderColor: 'rgba(26,58,42,0.15)' }}
          >
            <header
              className="px-6 py-6 text-center"
              style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #244a36 100%)' }}
            >
              <img
                src="/sahel-logo.png"
                alt="Sahel AgriConnect"
                className="h-12 w-auto mx-auto mb-3 brightness-0 invert opacity-95"
              />
              <p className="text-[#c9962a] text-xs font-bold tracking-widest uppercase mb-1">
                Sahel AgriConnect
              </p>
              <h1 className="text-white text-xl md:text-2xl font-bold">
                {isFr ? 'Certificat de Traçabilité' : 'Traceability Certificate'}
              </h1>
            </header>

            <div className="px-6 py-7 space-y-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-[#1a3a2a]/45 font-semibold mb-1">
                  Batch ID
                </p>
                <p
                  className="text-2xl md:text-3xl font-extrabold font-mono tracking-tight"
                  style={{ color: '#1a3a2a' }}
                >
                  {cert.batchId}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#1a3a2a]/10 bg-[#f7f3ea]/60 p-4">
                  <p className="text-xs text-[#1a3a2a]/50 font-semibold mb-1">
                    {isFr ? 'Culture' : 'Crop'}
                  </p>
                  <p className="font-bold text-[#1a3a2a] text-lg">🌾 {cert.cropType}</p>
                </div>
                <div className="rounded-2xl border border-[#1a3a2a]/10 bg-[#f7f3ea]/60 p-4">
                  <p className="text-xs text-[#1a3a2a]/50 font-semibold mb-1">
                    {isFr ? 'Quantité' : 'Quantity'}
                  </p>
                  <p className="font-bold text-[#1a3a2a] text-lg font-mono">
                    {Number(cert.quantityKg || 0).toLocaleString()} kg
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a3a2a]/10 bg-[#f7f3ea]/60 p-4 sm:col-span-2">
                  <p className="text-xs text-[#1a3a2a]/50 font-semibold mb-1">
                    {isFr ? 'Coopérative' : 'Cooperative'}
                  </p>
                  <p className="font-bold text-[#1a3a2a]">
                    {cert.cooperativeName || (isFr ? '—' : '—')}
                  </p>
                  <p className="text-sm text-[#1a3a2a]/65 mt-0.5">
                    {[cert.cooperativeRegion, cert.cooperativeCountry].filter(Boolean).join(', ') ||
                      '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a3a2a]/10 bg-[#f7f3ea]/60 p-4">
                  <p className="text-xs text-[#1a3a2a]/50 font-semibold mb-1">
                    {isFr ? 'Date de récolte' : 'Harvest date'}
                  </p>
                  <p className="font-semibold text-[#1a3a2a]">
                    {fmtDate(cert.harvestDate, locale)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a3a2a]/10 bg-[#f7f3ea]/60 p-4">
                  <p className="text-xs text-[#1a3a2a]/50 font-semibold mb-1">
                    {isFr ? 'Qualité' : 'Quality'}
                  </p>
                  <span
                    className="inline-flex px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      background: gStyle.bg,
                      color: gStyle.color,
                      border: `1px solid ${gStyle.border}`,
                    }}
                  >
                    {grade === 'ungraded'
                      ? isFr
                        ? 'Non classé'
                        : 'Ungraded'
                      : grade}
                  </span>
                </div>
              </div>

              <div
                className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${
                  cert.verifiedByCoop
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                {cert.verifiedByCoop ? (
                  <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm font-semibold ${
                    cert.verifiedByCoop ? 'text-green-800' : 'text-amber-900'
                  }`}
                >
                  {cert.verifiedByCoop
                    ? isFr
                      ? `Vérifié par la coopérative le ${fmtDate(cert.verifiedAt, locale)}`
                      : `Verified by the cooperative on ${fmtDate(cert.verifiedAt, locale)}`
                    : isFr
                      ? 'En attente de vérification'
                      : 'Awaiting verification'}
                </p>
              </div>

              <div className="no-print flex gap-2 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#c9962a' }}
                >
                  {isFr ? 'Imprimer' : 'Print'}
                </button>
                <Link
                  to="/"
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-[#1a3a2a]/20 text-[#1a3a2a]"
                >
                  {isFr ? 'Accueil' : 'Home'}
                </Link>
              </div>
            </div>

            <footer className="px-6 py-4 text-center border-t border-[#1a3a2a]/10 bg-[#f7f3ea]/40">
              <p className="text-xs text-[#1a3a2a]/55">
                {isFr
                  ? 'Propulsé par Sahel AgriConnect · sahelagriconnect.com'
                  : 'Powered by Sahel AgriConnect · sahelagriconnect.com'}
              </p>
              {cert.certificateGeneratedAt ? (
                <p className="text-[10px] text-[#1a3a2a]/35 mt-1">
                  {isFr ? 'Généré le' : 'Generated'}{' '}
                  {fmtDate(cert.certificateGeneratedAt, locale)}
                </p>
              ) : null}
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
