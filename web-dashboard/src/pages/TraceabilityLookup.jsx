import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

function statusStepClass(active) {
  return active ? 'bg-[#B5850A] text-white border-[#B5850A]' : 'bg-white text-gray-700 border-gray-200';
}

export default function TraceabilityLookup() {
  const { batchNumber } = useParams();
  const navigate = useNavigate();
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

  const timeline = useMemo(() => {
    const order = ['harvest', 'processing', 'certified', 'sold', 'exported'];
    const labels = {
      harvest: 'Harvest',
      processing: 'Processing',
      certified: 'Certified',
      sold: 'Sold',
      exported: 'Exported',
    };
    const current = state.record?.status || 'harvest';
    const idx = order.indexOf(current);
    return order.map((s, i) => ({ s, label: labels[s], active: i <= (idx >= 0 ? idx : 0) }));
  }, [state.record]);

  const r = state.record;

  return (
    <div className="bg-brand-cream min-h-[60vh]">
      <section className="bg-[#1a3c2e] text-white py-16">
        <div className="section-container text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">Traçabilité AfriYield — Vérifiez votre produit</h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl mx-auto">
            Entrez un numéro de lot pour voir l&apos;historique complet de production
          </p>

          <form
            className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const bn = String(q).trim();
              if (!bn) return;
              navigate(`/trace/${encodeURIComponent(bn)}`);
            }}
          >
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Numéro de lot (ex: SAC-2025-123456)"
                className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-3 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-[#B5850A]"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#B5850A] text-white font-extrabold px-6 py-3 hover:bg-[#9a7109]"
            >
              Vérifier
            </button>
          </form>
        </div>
      </section>

      <section className="section-container py-12">
        {state.loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#B5850A]" aria-hidden />
          </div>
        ) : state.notFound ? (
          <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-extrabold text-[#1a3c2e]">
              Numéro de lot introuvable. Contactez le producteur pour vérification.
            </p>
          </div>
        ) : state.err ? (
          <div className="max-w-3xl mx-auto rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {state.err}
          </div>
        ) : r ? (
          <div className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold text-gray-500 tracking-widest">BATCH</p>
                <p className="mt-1 text-3xl font-extrabold text-[#B5850A]">{r.batchNumber}</p>
                <p className="mt-2 text-lg font-extrabold text-[#1a3c2e]">
                  {countryFlagEmoji(r.farmerCountry)} {r.commodity}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                <CheckCircle2 className="w-5 h-5" aria-hidden />
                <span className="text-sm font-bold">Ce produit a été vérifié par Sahel AgriConnect ✓</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {timeline.map((t) => (
                <div key={t.s} className={`rounded-xl border px-3 py-2 text-center text-xs font-extrabold ${statusStepClass(t.active)}`}>
                  {t.label}
                </div>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-sm font-extrabold text-[#1a3c2e] mb-3">Farmer</p>
                <p className="text-gray-800 font-semibold">{r.farmerName || '—'}</p>
                <p className="text-sm text-gray-600">{r.farmerRegion || '—'}, {r.farmerCountry || '—'}</p>
                <p className="text-sm text-gray-600 mt-2">Coopérative: {r.cooperativeName || '—'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-sm font-extrabold text-[#1a3c2e] mb-3">Transformation / Processor</p>
                <p className="text-gray-800 font-semibold">{r.processorName || '—'}</p>
                <p className="text-sm text-gray-600">{r.buyerCountry ? `Buyer country: ${r.buyerCountry}` : 'Buyer country: —'}</p>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-extrabold text-gray-500 uppercase">Harvest date</p>
                <p className="mt-1 font-extrabold text-[#1a3c2e]">{fmtDate(r.harvestDate)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-extrabold text-gray-500 uppercase">Processing date</p>
                <p className="mt-1 font-extrabold text-[#1a3c2e]">{fmtDate(r.processingDate)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-extrabold text-gray-500 uppercase">Export date</p>
                <p className="mt-1 font-extrabold text-[#1a3c2e]">{fmtDate(r.exportDate)}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-800">
                Quality: {r.qualityGrade || '—'}
              </span>
              <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-800">
                Certification: {r.certificationStatus || '—'}
              </span>
              <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-800">
                Buyer: {countryFlagEmoji(r.buyerCountry)} {r.buyerName || '—'}
              </span>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-700">
            Entrez un numéro de lot pour commencer.
          </div>
        )}
      </section>
    </div>
  );
}

