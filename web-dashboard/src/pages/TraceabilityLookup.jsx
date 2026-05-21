import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config/api';
import { CheckCircle2, Loader2, Search } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString();
}

function countryFlagEmoji(country) {
  const c = String(country || '').toLowerCase();
  if (c.includes('mali')) return '🇲🇱';
  if (c.includes('senegal') || c.includes('sénégal')) return '🇸🇳';
  if (c.includes('ghana')) return '🇬🇭';
  if (c.includes('niger')) return '🇳🇪';
  if (c.includes('nigeria')) return '🇳🇬';
  if (c.includes('burkina')) return '🇧🇫';
  if (c.includes('côte') || c.includes('cote')) return '🇨🇮';
  if (c.includes('guinee') || c.includes('guinée')) return '🇬🇳';
  if (c.includes('togo')) return '🇹🇬';
  if (c.includes('benin') || c.includes('bénin')) return '🇧🇯';
  if (c.includes('usa') || c.includes('united states')) return '🇺🇸';
  if (c.includes('france')) return '🇫🇷';
  if (c.includes('uk') || c.includes('united kingdom')) return '🇬🇧';
  if (c.includes('uae') || c.includes('emirates')) return '🇦🇪';
  return '🌍';
}

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '1rem',
};

const PANEL_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '1rem',
};

function timelineStepStyle(active) {
  return active
    ? { background: '#B5850A', color: 'white', border: '1px solid #B5850A', borderRadius: '50%' }
    : {
        background: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '50%',
      };
}

export default function TraceabilityLookup() {
  const { batchNumber } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [q, setQ] = useState(batchNumber || '');
  const [state, setState] = useState({ loading: false, err: '', record: null, notFound: false });

  const fetchBatch = async (num) => {
    const bn = String(num || '').trim();
    if (!bn) return;
    setState({ loading: true, err: '', record: null, notFound: false });
    try {
      const r = await fetch(API_ENDPOINTS.SUPPLYCHAIN.BATCH(encodeURIComponent(bn)));
      const j = await r.json().catch(() => ({}));
      if (r.status === 404) {
        setState({ loading: false, err: '', record: null, notFound: true });
        return;
      }
      if (!r.ok) throw new Error(j?.error || 'Request failed');
      setState({ loading: false, err: '', record: j.record, notFound: false });
    } catch (e) {
      setState({ loading: false, err: e.message || 'Error', record: null, notFound: false });
    }
  };

  useEffect(() => {
    if (batchNumber) fetchBatch(batchNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchNumber]);

  const goSearch = () => {
    const bn = String(q).trim();
    if (!bn) return;
    navigate(`/trace/${encodeURIComponent(bn)}`);
  };

  const timeline = useMemo(() => {
    const order = ['harvest', 'processing', 'certified', 'sold', 'exported'];
    const labels = {
      harvest: isFr ? 'Récolte' : 'Harvest',
      processing: isFr ? 'Transformation' : 'Processing',
      certified: isFr ? 'Certifié' : 'Certified',
      sold: isFr ? 'Vendu' : 'Sold',
      exported: isFr ? 'Exporté' : 'Exported',
    };
    const current = state.record?.status || 'harvest';
    const idx = order.indexOf(current);
    return order.map((s, i) => ({ s, label: labels[s], active: i <= (idx >= 0 ? idx : 0) }));
  }, [state.record, isFr]);

  const r = state.record;

  return (
    <div style={{ background: '#060f0a', minHeight: '100vh' }}>
      <section
        style={{
          background: 'linear-gradient(135deg, #0d2a18 0%, #060f0a 100%)',
          borderBottom: '1px solid rgba(29,158,117,0.2)',
        }}
        className="py-14"
      >
        <div className="max-w-2xl mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'rgba(29,158,117,0.1)',
              color: '#1D9E75',
              borderColor: 'rgba(29,158,117,0.3)',
            }}
          >
            🔍 {isFr ? 'Traçabilité des produits' : 'Product Traceability'}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? "Vérifiez l'origine de votre produit" : 'Verify Your Product Origin'}
          </h1>
          <p className="text-white/60 text-base mb-8 max-w-lg mx-auto">
            {isFr
              ? "Saisissez le numéro de lot pour tracer l'itinéraire complet de ce produit — de la récolte à l'exportation."
              : 'Enter the batch number to trace the complete journey of this product — from harvest to export.'}
          </p>
          <div className="flex gap-2 max-w-lg mx-auto">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goSearch();
                }
              }}
              placeholder={
                isFr ? 'Ex: SAC-2026-001 ou numéro de lot' : 'e.g. SAC-2026-001 or batch number'
              }
              className="flex-1 px-5 py-4 rounded-xl text-white text-sm focus:outline-none placeholder:text-white/30"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <button
              type="button"
              onClick={goSearch}
              className="px-6 py-4 rounded-xl font-bold text-black text-sm flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity"
              style={{ background: '#1D9E75' }}
            >
              <Search size={16} aria-hidden />
              {isFr ? 'Rechercher' : 'Search'}
            </button>
          </div>
        </div>
      </section>

      <section className="section-container py-12">
        {state.loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="animate-spin text-teal-400 mx-auto mb-3" size={32} aria-hidden />
              <p className="text-white/50 text-sm">{isFr ? 'Recherche en cours...' : 'Searching...'}</p>
            </div>
          </div>
        ) : state.notFound ? (
          <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-white font-bold text-xl mb-2">{isFr ? 'Lot introuvable' : 'Batch Not Found'}</h2>
            <p className="text-white/50 text-sm">
              {isFr
                ? `Aucun lot trouvé pour "${q}". Vérifiez le numéro et réessayez.`
                : `No batch found for "${q}". Check the number and try again.`}
            </p>
          </div>
        ) : state.err ? (
          <div
            className="max-w-3xl mx-auto rounded-2xl p-6 text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {state.err}
          </div>
        ) : r ? (
          <div className="max-w-4xl mx-auto p-8" style={CARD_STYLE}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold text-white/50 tracking-widest uppercase">Batch</p>
                <p className="mt-1 text-3xl font-extrabold text-[#B5850A]">{r.batchNumber}</p>
                <p className="mt-2 text-lg font-extrabold text-white">
                  {countryFlagEmoji(r.farmerCountry)} {r.commodity}
                </p>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)' }}
              >
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" aria-hidden />
                <span className="text-sm font-bold text-teal-400">
                  {isFr
                    ? 'Ce produit a été vérifié par Sahel AgriConnect ✓'
                    : 'This product was verified by Sahel AgriConnect ✓'}
                </span>
              </div>
            </div>

            <div className="mt-8 relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 hidden sm:block" aria-hidden />
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative">
                {timeline.map((t) => (
                  <div key={t.s} className="flex flex-col items-center gap-2">
                    <div
                      className="w-10 h-10 flex items-center justify-center text-[10px] font-extrabold shrink-0"
                      style={timelineStepStyle(t.active)}
                    >
                      {t.label.charAt(0)}
                    </div>
                    <span
                      className={`text-xs font-bold text-center ${t.active ? 'text-[#B5850A]' : 'text-white/40'}`}
                    >
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="p-5" style={PANEL_STYLE}>
                <p className="text-sm font-semibold uppercase text-teal-400 mb-3">
                  {isFr ? 'Agriculteur' : 'Farmer'}
                </p>
                <p className="text-white font-semibold">{r.farmerName || '—'}</p>
                <p className="text-sm text-white/50">
                  {r.farmerRegion || '—'}, {r.farmerCountry || '—'}
                </p>
                <p className="text-sm text-white/50 mt-2">
                  {isFr ? 'Coopérative:' : 'Cooperative:'} {r.cooperativeName || '—'}
                </p>
              </div>
              <div className="p-5" style={PANEL_STYLE}>
                <p className="text-sm font-semibold uppercase text-teal-400 mb-3">
                  {isFr ? 'Transformation / Processeur' : 'Transformation / Processor'}
                </p>
                <p className="text-white font-semibold">{r.processorName || '—'}</p>
                <p className="text-sm text-white/50">
                  {r.buyerCountry
                    ? `${isFr ? "Pays acheteur:" : 'Buyer country:'} ${r.buyerCountry}`
                    : `${isFr ? 'Pays acheteur:' : 'Buyer country:'} —`}
                </p>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                [isFr ? 'Date de récolte' : 'Harvest date', fmtDate(r.harvestDate)],
                [isFr ? 'Date de transformation' : 'Processing date', fmtDate(r.processingDate)],
                [isFr ? "Date d'export" : 'Export date', fmtDate(r.exportDate)],
              ].map(([label, value]) => (
                <div key={label} className="p-5" style={PANEL_STYLE}>
                  <p className="text-xs font-extrabold text-white/50 uppercase">{label}</p>
                  <p className="mt-1 font-extrabold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
              >
                {isFr ? 'Qualité:' : 'Quality:'} {r.qualityGrade || '—'}
              </span>
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                {isFr ? 'Certification:' : 'Certification:'} {r.certificationStatus || '—'}
              </span>
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
              >
                {isFr ? 'Acheteur:' : 'Buyer:'} {countryFlagEmoji(r.buyerCountry)} {r.buyerName || '—'}
              </span>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-8 text-center text-white/60" style={CARD_STYLE}>
            {isFr ? 'Entrez un numéro de lot pour commencer.' : 'Enter a batch number to get started.'}
          </div>
        )}
      </section>
    </div>
  );
}
