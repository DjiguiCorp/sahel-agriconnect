import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { Check, Loader2, X } from 'lucide-react';

function apiUrl(path) {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

function buildFilters(t) {
  return [
    { id: 'all', label: t('marketplace.filters.all') },
    { id: 'shea', label: t('marketplace.filters.shea') },
    { id: 'sesame', label: t('marketplace.filters.sesame') },
    { id: 'usda', label: t('marketplace.filters.usdaCertified') },
    { id: 'regional', label: t('marketplace.filters.regionalCertified') },
    { id: 'available', label: t('marketplace.filters.availableNow') },
  ];
}

function certificationBadge(cert) {
  const c = String(cert || '').toLowerCase();
  if (c.includes('international') || c.includes('usda')) return { label: cert, cls: 'bg-[#fff7df] text-[#7a5b10] border-[#e9d7a7]' };
  if (c.includes('regional')) return { label: cert, cls: 'bg-blue-50 text-blue-900 border-blue-200' };
  return { label: cert || 'Local', cls: 'bg-green-50 text-green-900 border-green-200' };
}

function countryFlagEmoji(country) {
  const c = String(country || '').toLowerCase();
  if (c.includes('mali')) return '🇲🇱';
  if (c.includes('senegal') || c.includes('sénégal')) return '🇸🇳';
  if (c.includes('ghana')) return '🇬🇭';
  if (c.includes('niger')) return '🇳🇪';
  if (c.includes('nigeria')) return '🇳🇬';
  if (c.includes('burkina')) return '🇧🇫';
  if (c.includes('côte') || c.includes("cote")) return '🇨🇮';
  if (c.includes('guinee') || c.includes('guinée')) return '🇬🇳';
  if (c.includes('togo')) return '🇹🇬';
  if (c.includes('benin') || c.includes('bénin')) return '🇧🇯';
  return '🌍';
}

export default function CommodityMarketplace() {
  const { t, i18n } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const FILTERS = useMemo(() => buildFilters(t), [t]);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [quoteState, setQuoteState] = useState({ sending: false, ok: false, error: '' });
  const [notified, setNotified] = useState({});
  const [notifyEmail, setNotifyEmail] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    buyerName: '',
    companyName: '',
    email: '',
    phone: '',
    productWanted: '',
    quantityKg: '',
    deliveryCountry: '',
    message: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr('');
      try {
        const r = await fetch(apiUrl('/api/opportunities'));
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || 'Failed to load');
        if (!cancelled) setItems(Array.isArray(j?.opportunities) ? j.opportunities : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const src = Array.isArray(items) ? items : [];
    const f = activeFilter;
    return src.filter((o) => {
      if (f === 'all') return true;
      if (f === 'shea') return String(o.commodity || '').toLowerCase().includes('shea');
      if (f === 'sesame') return String(o.commodity || '').toLowerCase().includes('sesame');
      if (f === 'usda') return String(o.certificationStatus || '').toLowerCase().includes('usda') || String(o.certificationStatus || '').toLowerCase().includes('international');
      if (f === 'regional') return String(o.certificationStatus || '').toLowerCase().includes('regional');
      if (f === 'available') return Number(o.amountSought || 0) > 0; // proxy field (no explicit stock field in model)
      return true;
    });
  }, [items, activeFilter]);

  const openQuote = (op) => {
    setQuoteTarget(op);
    setQuoteForm((p) => ({
      ...p,
      productWanted: op?.commodity || '',
    }));
    setQuoteState({ sending: false, ok: false, error: '' });
    setQuoteOpen(true);
  };

  const submitQuote = async (e) => {
    e.preventDefault();
    if (!quoteTarget?._id) return;
    setQuoteState({ sending: true, ok: false, error: '' });
    try {
      const payload = {
        opportunityId: quoteTarget._id,
        ...quoteForm,
        quantityKg: quoteForm.quantityKg !== '' ? Number(quoteForm.quantityKg) : undefined,
      };
      const r = await fetch(apiUrl('/api/marketplace/quote-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Request failed');
      setQuoteState({ sending: false, ok: true, error: '' });
    } catch (e2) {
      setQuoteState({ sending: false, ok: false, error: e2?.message || 'Error' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="bg-[#1a3c2e] text-white text-center py-14 px-4 rounded-2xl mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{t('marketplace.title')}</h1>
        <p className="text-white/90 max-w-3xl mx-auto">{t('marketplace.subtitle')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold">
            {t('marketplace.badges.sheaSesame')}
          </span>
          <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold">
            {t('marketplace.badges.certifiedSupply')}
          </span>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={[
              'px-4 py-2 rounded-full text-sm font-bold border transition',
              activeFilter === f.id
                ? 'bg-[#B5850A] text-white border-[#B5850A]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#B5850A]/50',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-[#B5850A]" aria-hidden />
        </div>
      ) : err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{err}</div>
      ) : filtered.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { key: 'Shea Butter', name: 'Shea Butter' },
            { key: 'Sesame', name: 'Sesame' },
            { key: 'Shea Butter (2)', name: 'Shea Butter' },
            { key: 'Sesame (2)', name: 'Sesame' },
          ].map((commodity) => (
            <div key={commodity.key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-[#1a3c2e]">{commodity.name}</p>
                  <p className="text-sm text-gray-600">{t('marketplace.card.comingSoon')}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                  {t('marketplace.card.comingSoon')}
                </span>
              </div>
              <button
                onClick={() => setShowNotifyModal(commodity.key || commodity.name)}
                type="button"
                className={`mt-5 w-full rounded-xl py-3 font-semibold text-sm transition ${
                  notified[commodity.key || commodity.name]
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e] hover:text-white'
                }`}
              >
                {notified[commodity.key || commodity.name]
                  ? '✓ ' + (i18n.language === 'fr' ? 'Vous serez notifié' : 'You will be notified')
                  : t('marketplace.card.notifyMe')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((o) => {
            const badge = certificationBadge(o.certificationStatus);
            const flag = countryFlagEmoji(o.country);
            const price = o.price || null;
            return (
              <div key={o._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold text-[#1a3c2e]">
                      {flag} {o.commodity}
                    </p>
                    <p className="text-sm text-gray-600 font-semibold">{o.centerName}</p>
                    <p className="text-sm text-gray-500">{o.location}, {o.country}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">{t('marketplace.card.availableVolume')}</p>
                    <p className="mt-1 font-extrabold text-[#1a3c2e]">
                      {o.amountSought ? `${o.amountSought} kg ${t('marketplace.card.perMonth')}` : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">{t('marketplace.card.priceLabel')}</p>
                    <p className="mt-1 font-extrabold text-[#1a3c2e]">
                      {price ? String(price) : t('marketplace.card.priceOnRequest')}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => openQuote(o)}
                    className="flex-1 rounded-xl bg-[#B5850A] text-white font-extrabold py-2.5 hover:bg-[#9a7109] transition"
                  >
                    {t('marketplace.card.requestQuote')}
                  </button>
                  <Link
                    to={`/afri-yield/opportunities/${o._id}`}
                    className="flex-1 text-center rounded-xl border-2 border-[#1a3c2e] text-[#1a3c2e] font-extrabold py-2.5 hover:bg-[#1a3c2e] hover:text-white transition"
                  >
                    {t('marketplace.card.learnMore')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {quoteOpen && quoteTarget ? (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-[#1a3c2e]">{t('marketplace.quoteModal.title')}</p>
                <p className="text-sm text-gray-600">{quoteTarget.centerName} — {quoteTarget.commodity}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <div className="p-5">
              {quoteState.ok ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 mt-0.5 text-green-700" aria-hidden />
                    <p>{t('marketplace.quoteModal.success')}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitQuote} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('marketplace.quoteModal.buyerName')}>
                    <input value={quoteForm.buyerName} onChange={(e) => setQuoteForm((p) => ({ ...p, buyerName: e.target.value }))} className="input" />
                  </Field>
                  <Field label={t('marketplace.quoteModal.company')}>
                    <input value={quoteForm.companyName} onChange={(e) => setQuoteForm((p) => ({ ...p, companyName: e.target.value }))} className="input" />
                  </Field>
                  <Field label={`${t('marketplace.quoteModal.email')} *`} span2>
                    <input type="email" required value={quoteForm.email} onChange={(e) => setQuoteForm((p) => ({ ...p, email: e.target.value }))} className="input" />
                  </Field>
                  <Field label={t('marketplace.quoteModal.phone')} span2>
                    <input value={quoteForm.phone} onChange={(e) => setQuoteForm((p) => ({ ...p, phone: e.target.value }))} className="input" />
                  </Field>
                  <Field label={t('marketplace.quoteModal.product')} span2>
                    <input value={quoteForm.productWanted} onChange={(e) => setQuoteForm((p) => ({ ...p, productWanted: e.target.value }))} className="input" />
                  </Field>
                  <Field label={t('marketplace.quoteModal.quantity')}>
                    <input type="number" min="0" value={quoteForm.quantityKg} onChange={(e) => setQuoteForm((p) => ({ ...p, quantityKg: e.target.value }))} className="input" />
                  </Field>
                  <Field label={t('marketplace.quoteModal.delivery')}>
                    <input value={quoteForm.deliveryCountry} onChange={(e) => setQuoteForm((p) => ({ ...p, deliveryCountry: e.target.value }))} className="input" />
                  </Field>
                  <Field label={t('marketplace.quoteModal.message')} span2>
                    <textarea rows={4} value={quoteForm.message} onChange={(e) => setQuoteForm((p) => ({ ...p, message: e.target.value }))} className="input" />
                  </Field>

                  {quoteState.error ? (
                    <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                      {t('marketplace.quoteModal.error')}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={quoteState.sending}
                    className="sm:col-span-2 w-full rounded-xl bg-[#B5850A] text-white font-extrabold py-3 hover:bg-[#9a7109] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {quoteState.sending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                    {t('marketplace.quoteModal.submit')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-[#1a3c2e] text-lg mb-1">{i18n.language === 'fr' ? 'Recevoir une alerte' : 'Get notified'}</h3>
            <p className="text-gray-500 text-sm mb-4">
              {i18n.language === 'fr'
                ? `Entrez votre email pour être notifié quand ${showNotifyModal} est disponible.`
                : `Enter your email to be notified when ${showNotifyModal} is available.`}
            </p>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder={i18n.language === 'fr' ? 'votre@email.com' : 'your@email.com'}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#B5850A]"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!notifyEmail) return;
                  try {
                    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: notifyEmail, source: `marketplace_${showNotifyModal}` }),
                    });
                  } catch {}
                  setNotified((p) => ({ ...p, [showNotifyModal]: true }));
                  setShowNotifyModal(null);
                  setNotifyEmail('');
                }}
                className="flex-1 rounded-xl py-2.5 font-bold text-sm text-white"
                style={{ background: '#1a3c2e' }}
              >
                {i18n.language === 'fr' ? 'Me notifier' : 'Notify me'}
              </button>
              <button
                onClick={() => setShowNotifyModal(null)}
                className="px-4 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition"
              >
                {i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, span2, children }) {
  return (
    <label className={`space-y-1 ${span2 ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm font-bold text-gray-700">{label}</span>
      {children}
    </label>
  );
}

