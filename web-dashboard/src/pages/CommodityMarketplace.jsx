import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Loader2, X, Search } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const API = String(API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// === FULL AFRICAN COMMODITY CATALOG ===
const ALL_COMMODITIES = [
  { key: 'shea', name: 'Shea Butter', nameFr: 'Beurre de karité', emoji: '🌿', category: 'oilseed', countries: ['Mali', 'Burkina Faso', 'Ghana', 'Nigeria', 'Niger'] },
  { key: 'sesame', name: 'Sesame', nameFr: 'Sésame', emoji: '🌾', category: 'oilseed', countries: ['Mali', 'Senegal', 'Burkina Faso', 'Chad', 'Ethiopia'] },
  { key: 'cashew', name: 'Cashew', nameFr: 'Cajou', emoji: '🥜', category: 'nut', countries: ["Côte d'Ivoire", 'Ghana', 'Senegal', 'Guinea-Bissau', 'Benin'] },
  { key: 'mango', name: 'Mango', nameFr: 'Mangue', emoji: '🥭', category: 'fruit', countries: ['Mali', 'Burkina Faso', 'Senegal', "Côte d'Ivoire", 'Togo'] },
  { key: 'cotton', name: 'Cotton', nameFr: 'Coton', emoji: '🌸', category: 'fiber', countries: ['Mali', 'Burkina Faso', 'Senegal', 'Cameroon', 'Chad'] },
  { key: 'rice', name: 'Rice', nameFr: 'Riz', emoji: '🌾', category: 'cereal', countries: ['Senegal', 'Guinea', 'Sierra Leone', "Côte d'Ivoire", 'Mali'] },
  { key: 'millet', name: 'Millet', nameFr: 'Mil', emoji: '🌾', category: 'cereal', countries: ['Mali', 'Niger', 'Burkina Faso', 'Senegal', 'Nigeria'] },
  { key: 'sorghum', name: 'Sorghum', nameFr: 'Sorgho', emoji: '🌾', category: 'cereal', countries: ['Mali', 'Burkina Faso', 'Niger', 'Nigeria', 'Senegal'] },
  { key: 'groundnut', name: 'Groundnut', nameFr: 'Arachide', emoji: '🥜', category: 'oilseed', countries: ['Senegal', 'Mali', 'Gambia', 'Niger', 'Nigeria'] },
  { key: 'moringa', name: 'Moringa', nameFr: 'Moringa', emoji: '🌿', category: 'superfood', countries: ['Senegal', 'Mali', 'Niger', 'Burkina Faso', 'Ghana'] },
  { key: 'ginger', name: 'Ginger', nameFr: 'Gingembre', emoji: '🫚', category: 'spice', countries: ['Nigeria', 'Ghana', "Côte d'Ivoire", 'Sierra Leone', 'Senegal'] },
  { key: 'hibiscus', name: 'Hibiscus (Bissap)', nameFr: 'Hibiscus (Bissap)', emoji: '🌺', category: 'herb', countries: ['Senegal', 'Mali', 'Burkina Faso', 'Gambia', 'Niger'] },
  { key: 'baobab', name: 'Baobab', nameFr: 'Baobab', emoji: '🌳', category: 'superfood', countries: ['Senegal', 'Mali', 'Burkina Faso', 'Zimbabwe', 'Mozambique'] },
  { key: 'cowpea', name: 'Cowpea (Niébé)', nameFr: 'Niébé', emoji: '🫘', category: 'legume', countries: ['Niger', 'Nigeria', 'Mali', 'Burkina Faso', 'Senegal'] },
  { key: 'fonio', name: 'Fonio', nameFr: 'Fonio', emoji: '🌾', category: 'cereal', countries: ['Guinea', 'Mali', 'Senegal', 'Burkina Faso', 'Benin'] },
  { key: 'cocoa', name: 'Cocoa', nameFr: 'Cacao', emoji: '🍫', category: 'beverage', countries: ["Côte d'Ivoire", 'Ghana', 'Nigeria', 'Cameroon', 'Togo'] },
  { key: 'coffee', name: 'Coffee', nameFr: 'Café', emoji: '☕', category: 'beverage', countries: ["Côte d'Ivoire", 'Guinea', 'Ethiopia', 'Uganda', 'Tanzania'] },
  { key: 'vanilla', name: 'Vanilla', nameFr: 'Vanille', emoji: '🌿', category: 'spice', countries: ['Madagascar', 'Uganda', 'Tanzania', 'Comoros'] },
  { key: 'cassava', name: 'Cassava', nameFr: 'Manioc', emoji: '🥔', category: 'tuber', countries: ['Nigeria', 'Ghana', 'Tanzania', "Côte d'Ivoire", 'DRC'] },
  { key: 'yam', name: 'Yam', nameFr: 'Igname', emoji: '🍠', category: 'tuber', countries: ['Nigeria', 'Ghana', "Côte d'Ivoire", 'Benin', 'Togo'] },
  { key: 'plantain', name: 'Plantain', nameFr: 'Plantain', emoji: '🍌', category: 'fruit', countries: ["Côte d'Ivoire", 'Ghana', 'Cameroon', 'DRC', 'Nigeria'] },
  { key: 'pineapple', name: 'Pineapple', nameFr: 'Ananas', emoji: '🍍', category: 'fruit', countries: ["Côte d'Ivoire", 'Ghana', 'Nigeria', 'Cameroon', 'Kenya'] },
  { key: 'avocado', name: 'Avocado', nameFr: 'Avocat', emoji: '🥑', category: 'fruit', countries: ['Kenya', 'Tanzania', 'Ethiopia', "Côte d'Ivoire", 'Rwanda'] },
  { key: 'honey', name: 'Honey', nameFr: 'Miel', emoji: '🍯', category: 'apiculture', countries: ['Ethiopia', 'Tanzania', 'Kenya', 'Mali', 'Zambia'] },
  { key: 'other', name: 'Other Produce', nameFr: 'Autre produit', emoji: '🌱', category: 'other', countries: [] },
];

const CATEGORIES = [
  { key: 'all', label: 'All', labelFr: 'Tous', emoji: '🌍' },
  { key: 'oilseed', label: 'Oilseeds', labelFr: 'Oléagineux', emoji: '🫒' },
  { key: 'cereal', label: 'Cereals', labelFr: 'Céréales', emoji: '🌾' },
  { key: 'fruit', label: 'Fruits', labelFr: 'Fruits', emoji: '🍎' },
  { key: 'nut', label: 'Nuts', labelFr: 'Noix', emoji: '🥜' },
  { key: 'legume', label: 'Legumes', labelFr: 'Légumineuses', emoji: '🫘' },
  { key: 'spice', label: 'Spices & Herbs', labelFr: 'Épices & Herbes', emoji: '🌿' },
  { key: 'herb', label: 'Herbal', labelFr: 'Plantes médicinales', emoji: '🌺' },
  { key: 'tuber', label: 'Tubers', labelFr: 'Tubercules', emoji: '🥔' },
  { key: 'apiculture', label: 'Honey & bees', labelFr: 'Miel & apiculture', emoji: '🍯' },
  { key: 'superfood', label: 'Superfoods', labelFr: 'Superaliments', emoji: '⭐' },
  { key: 'beverage', label: 'Beverages', labelFr: 'Boissons', emoji: '☕' },
  { key: 'fiber', label: 'Fiber', labelFr: 'Fibres', emoji: '🌸' },
  { key: 'other', label: 'Other', labelFr: 'Autre', emoji: '🌱' },
];

const CERT_STYLE = {
  'International (EU/USDA)': { bg: '#fff7df', color: '#92400e', border: '#B5850A40', label: '⭐⭐⭐ International' },
  'Regional (ECOWAS)': { bg: '#eff6ff', color: '#1e40af', border: '#3b82f640', label: '⭐⭐ Regional' },
  Local: { bg: '#f0fdf4', color: '#166534', border: '#16a34a40', label: '⭐ Local' },
  Pending: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Pending' },
};

const COUNTRY_FLAGS = {
  Mali: '🇲🇱',
  Senegal: '🇸🇳',
  'Sénégal': '🇸🇳',
  Ghana: '🇬🇭',
  Niger: '🇳🇪',
  Nigeria: '🇳🇬',
  'Burkina Faso': '🇧🇫',
  "Côte d'Ivoire": '🇨🇮',
  Guinea: '🇬🇳',
  Togo: '🇹🇬',
  Benin: '🇧🇯',
  Cameroon: '🇨🇲',
  Ethiopia: '🇪🇹',
  Kenya: '🇰🇪',
  Tanzania: '🇹🇿',
  Madagascar: '🇲🇬',
  Rwanda: '🇷🇼',
  Uganda: '🇺🇬',
  DRC: '🇨🇩',
};

function countryFlag(country) {
  const c = String(country || '');
  for (const [k, v] of Object.entries(COUNTRY_FLAGS)) {
    if (c.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '🌍';
}

export default function CommodityMarketplace() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [certFilter, setCertFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifiedSet, setNotifiedSet] = useState(new Set());
  const [quoteForm, setQuoteForm] = useState({
    buyerName: '',
    email: '',
    phone: '',
    quantityKg: '',
    deliveryCountry: '',
    message: '',
    productWanted: '',
  });
  const [quoteState, setQuoteState] = useState({ sending: false, ok: false, err: '' });
  const [viewMode, setViewMode] = useState('catalog');

  useEffect(() => {
    const base = API || '';
    fetch(`${base}/api/opportunities`)
      .then((r) => r.json())
      .then((d) => setItems(d.opportunities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const realListings = useMemo(() => {
    return items.filter((o) => {
      const matchCat =
        categoryFilter === 'all' ||
        (() => {
          const c = (
            isFr
              ? ALL_COMMODITIES.find((cm) => cm.nameFr === o.commodity || cm.name === o.commodity)
              : ALL_COMMODITIES.find((cm) => cm.name === o.commodity || cm.nameFr === o.commodity)
          );
          return c?.category === categoryFilter;
        })();
      const hay = `${o.commodity || ''}${o.centerName || ''}${o.location || ''}`.toLowerCase();
      const matchSearch = !searchQuery || hay.includes(searchQuery.toLowerCase());
      const matchCert =
        certFilter === 'all' ||
        (certFilter === 'international'
          ? String(o.certificationStatus || '').includes('International')
          : certFilter === 'regional'
            ? String(o.certificationStatus || '').includes('Regional')
            : certFilter === 'local'
              ? o.certificationStatus === 'Local'
              : false);
      const matchCountry = !countryFilter || o.country === countryFilter;
      return matchCat && matchSearch && matchCert && matchCountry;
    });
  }, [items, categoryFilter, searchQuery, certFilter, countryFilter, isFr]);

  const catalogItems = useMemo(() => {
    return ALL_COMMODITIES.filter((c) => {
      const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameFr.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  const allCountries = useMemo(() => [...new Set(items.map((o) => o.country).filter(Boolean))].sort(), [items]);

  const submitQuote = async (e) => {
    e.preventDefault();
    if (!quoteTarget) return;
    setQuoteState({ sending: true, ok: false, err: '' });
    try {
      const base = API || '';
      const r = await fetch(`${base}/api/marketplace/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: quoteTarget._id,
          ...quoteForm,
          productWanted: quoteForm.productWanted || quoteTarget.commodity,
          quantityKg: Number(quoteForm.quantityKg) || undefined,
        }),
      });
      if (!r.ok) throw new Error();
      setQuoteState({ sending: false, ok: true, err: '' });
    } catch {
      setQuoteState({ sending: false, ok: false, err: isFr ? 'Erreur. Réessayez.' : 'Error. Try again.' });
    }
  };

  const submitNotify = async (commodity) => {
    if (!notifyEmail) return;
    try {
      const base = API || '';
      await fetch(`${base}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail, source: `marketplace_notify_${commodity}` }),
      });
    } catch {
      /* still mark notified for UX */
    }
    setNotifiedSet((prev) => new Set([...prev, commodity]));
    setNotifyTarget(null);
    setNotifyEmail('');
  };

  return (
    <div style={{ background: '#0d1f17', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3c2e, #0d1f17)' }} className="px-6 py-14 text-center">
        <div className="max-w-3xl mx-auto">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(181,133,10,0.2)', color: '#B5850A' }}
          >
            AfriYield Exchange
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isFr ? 'Marketplace de Produits Africains' : 'African Produce Marketplace'}
          </h1>
          <p className="text-white/60 text-lg mb-6 max-w-2xl mx-auto">
            {isFr
              ? 'Toutes les cultures africaines — karité, sésame, cajou, mangue, cacao, fonio et plus. Sourcez directement auprès de coopératives vérifiées ou listez votre production.'
              : 'All African crops — shea, sesame, cashew, mango, cocoa, fonio and more. Source directly from verified cooperatives or list your production.'}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { label: `${ALL_COMMODITIES.length - 1} ${isFr ? 'commodités acceptées' : 'commodities accepted'}`, icon: '🌾' },
              { label: isFr ? 'Certifications Local → USDA' : 'Certifications Local → USDA', icon: '⭐' },
              { label: isFr ? 'Escrow sécurisé sur chaque deal' : 'Secured escrow on every deal', icon: '🔒' },
              { label: isFr ? 'Producteurs de 20+ pays' : 'Producers from 20+ countries', icon: '🌍' },
            ].map(({ label, icon }) => (
              <span
                key={label}
                className="text-sm px-4 py-2 rounded-full font-medium text-white/60"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {icon} {label}
              </span>
            ))}
          </div>

          <div className="inline-flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition"
              style={{
                background: viewMode === 'catalog' ? '#B5850A' : 'transparent',
                color: viewMode === 'catalog' ? '#1a3c2e' : 'rgba(255,255,255,0.5)',
              }}
            >
              {isFr ? '🌾 Catalogue' : '🌾 Catalogue'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('listings')}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition"
              style={{
                background: viewMode === 'listings' ? '#B5850A' : 'transparent',
                color: viewMode === 'listings' ? '#1a3c2e' : 'rgba(255,255,255,0.5)',
              }}
            >
              {isFr ? `📦 Annonces actives (${items.length})` : `📦 Active Listings (${items.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-16" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="py-5 space-y-4">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Search className="w-5 h-5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isFr ? 'Rechercher un produit, une région, un pays...' : 'Search for a product, region, country...'
              }
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/20"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                style={{
                  background: categoryFilter === cat.key ? '#B5850A' : 'rgba(255,255,255,0.06)',
                  color: categoryFilter === cat.key ? '#1a3c2e' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${categoryFilter === cat.key ? '#B5850A' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {cat.emoji} {isFr ? cat.labelFr : cat.label}
              </button>
            ))}
          </div>

          {viewMode === 'listings' && (
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: isFr ? 'Toutes certifications' : 'All certifications' },
                { key: 'international', label: '⭐⭐⭐ International (EU/USDA)' },
                { key: 'regional', label: '⭐⭐ Regional (ECOWAS)' },
                { key: 'local', label: '⭐ Local' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setCertFilter(f.key)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={{
                    background: certFilter === f.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: certFilter === f.key ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${certFilter === f.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {f.label}
                </button>
              ))}
              {allCountries.length > 0 && (
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <option value="">{isFr ? '🌍 Tous les pays' : '🌍 All countries'}</option>
                  {allCountries.map((c) => (
                    <option key={c} value={c}>
                      {countryFlag(c)} {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {viewMode === 'catalog' && (
          <div>
            <p className="text-white/30 text-xs mb-5">
              {catalogItems.length}{' '}
              {isFr ? 'produit(s) accepté(s) sur la plateforme' : 'product(s) accepted on the platform'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {catalogItems.map((commodity) => {
                const hasListings = items.some(
                  (o) =>
                    o.commodity?.toLowerCase().includes(commodity.key) ||
                    o.commodity?.toLowerCase().includes(commodity.name.toLowerCase())
                );
                const isNotified = notifiedSet.has(commodity.key);

                return (
                  <div
                    key={commodity.key}
                    className="rounded-2xl p-4 text-center transition cursor-pointer hover:scale-[1.02]"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${hasListings ? 'rgba(181,133,10,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className="text-4xl mb-2 block">{commodity.emoji}</span>
                    <p className="font-semibold text-white text-sm leading-snug mb-1">
                      {isFr ? commodity.nameFr : commodity.name}
                    </p>
                    <p className="text-xs text-white/30 mb-3">
                      {commodity.countries.slice(0, 2).join(', ')}
                      {commodity.countries.length > 2 ? ` +${commodity.countries.length - 2}` : ''}
                    </p>

                    {hasListings ? (
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('listings');
                          setSearchQuery(commodity.name);
                        }}
                        className="w-full py-2 rounded-xl text-xs font-bold transition"
                        style={{ background: '#B5850A', color: '#1a3c2e' }}
                      >
                        {isFr ? 'Voir annonces →' : 'View listings →'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNotifyTarget(commodity)}
                        className="w-full py-2 rounded-xl text-xs font-semibold transition"
                        style={{
                          background: isNotified ? 'rgba(74,222,128,0.1)' : 'transparent',
                          color: isNotified ? '#4ade80' : 'rgba(255,255,255,0.4)',
                          border: `1px solid ${isNotified ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        {isNotified ? `✓ ${isFr ? 'Notifié' : 'Notified'}` : isFr ? '🔔 Me notifier' : '🔔 Notify me'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="mt-10 rounded-3xl p-8 text-center"
              style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
            >
              <p className="text-3xl mb-3">🌾</p>
              <h3 className="text-2xl font-bold text-white mb-2">
                {isFr ? 'Vous êtes producteur, coopérative ou processeur?' : 'Are you a producer, cooperative, or processor?'}
              </h3>
              <p className="text-white/60 mb-6 max-w-xl mx-auto">
                {isFr
                  ? 'Listez votre production sur AfriYield Exchange et connectez-vous directement avec des acheteurs internationaux et des investisseurs diaspora. Tous les produits agricoles africains sont acceptés.'
                  : 'List your production on AfriYield Exchange and connect directly with international buyers and diaspora investors. All African agricultural produce is accepted.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/cooperative-registration"
                  className="px-7 py-3.5 rounded-xl font-bold text-[#1a3c2e] text-sm"
                  style={{ background: '#B5850A' }}
                >
                  {isFr ? 'Inscrire ma coopérative' : 'Register my cooperative'}
                </Link>
                <Link
                  to="/my-dashboard"
                  className="px-7 py-3.5 rounded-xl font-bold text-white text-sm"
                  style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                >
                  {isFr ? 'Déclarer ma production' : 'Declare my production'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'listings' && (
          <div>
            {loading ? (
              <div className="text-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-white/30 mx-auto" />
              </div>
            ) : realListings.length === 0 ? (
              <div className="text-center py-20 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-6xl mb-4">🌾</p>
                <h3 className="text-xl font-bold text-white mb-2">
                  {isFr ? 'Aucune annonce active pour le moment' : 'No active listings yet'}
                </h3>
                <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
                  {isFr
                    ? 'Les premières annonces de coopératives vérifiées arrivent bientôt. Parcourez notre catalogue pour voir ce qui sera disponible.'
                    : 'First listings from verified cooperatives are coming soon. Browse our catalogue to see what will be available.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('catalog')}
                    className="px-5 py-2.5 rounded-xl font-bold text-[#1a3c2e] text-sm"
                    style={{ background: '#B5850A' }}
                  >
                    {isFr ? 'Voir le catalogue' : 'Browse catalogue'}
                  </button>
                  <Link
                    to="/afri-yield/register"
                    className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                    style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                  >
                    {isFr ? "S'inscrire investisseur" : 'Register as investor'}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-white/30 text-xs mb-5">
                  {realListings.length} {isFr ? 'annonce(s) trouvée(s)' : 'listing(s) found'}
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {realListings.map((o) => {
                    const cert = CERT_STYLE[o.certificationStatus] || CERT_STYLE.Local;
                    const flag = countryFlag(o.country);
                    const commodity = ALL_COMMODITIES.find((c) => c.name === o.commodity || c.nameFr === o.commodity);
                    const fundingPct =
                      o.amountSought > 0 ? Math.min(100, Math.round(((o.amountRaised || 0) / o.amountSought) * 100)) : 0;

                    return (
                      <div
                        key={o._id}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">{commodity?.emoji || '🌾'}</span>
                              <div>
                                <p className="font-bold text-white">
                                  {isFr && commodity ? commodity.nameFr : commodity?.name || o.commodity}
                                </p>
                                <p className="text-xs text-white/40">{o.centerName}</p>
                              </div>
                            </div>
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: cert.bg, color: cert.color, border: `1px solid ${cert.border}` }}
                            >
                              {cert.label}
                            </span>
                          </div>

                          <p className="text-sm text-white/40 mb-4">
                            {flag} {o.location}, {o.country}
                          </p>

                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <p className="text-xs text-white/30 mb-1">{isFr ? 'Recherché' : 'Seeking'}</p>
                              <p className="text-sm font-bold text-white">${(o.amountSought || 0).toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <p className="text-xs text-white/30 mb-1">Min.</p>
                              <p className="text-sm font-bold text-white">${(o.minInvestment || 1000).toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(181,133,10,0.1)' }}>
                              <p className="text-xs text-white/30 mb-1">{isFr ? 'ROI est.' : 'Est. ROI'}</p>
                              <p className="text-sm font-bold" style={{ color: '#B5850A' }}>
                                {o.expectedROIMin > 0 ? `${o.expectedROIMin}–${o.expectedROIMax}%` : `${o.cycledays || 120}d`}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-white/30 mb-1">
                              <span>
                                ${(o.amountRaised || 0).toLocaleString()} {isFr ? 'levés' : 'raised'}
                              </span>
                              <span>{fundingPct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${fundingPct}%`,
                                  background: fundingPct >= 80 ? '#4ade80' : '#B5850A',
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {o.track && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                                style={{
                                  background: { 'Track A': '#1a3c2e', 'Track B': '#B5850A', 'Track C': '#3b82f6' }[o.track] || '#1a3c2e',
                                }}
                              >
                                {o.track}
                              </span>
                            )}
                            {o.verified && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}
                              >
                                ✓ {isFr ? 'Vérifié' : 'Verified'}
                              </span>
                            )}
                            {o.insuranceCoverage && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full text-white/40"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                              >
                                🛡 {isFr ? 'Assuré' : 'Insured'}
                              </span>
                            )}
                            {o.memberFarmers > 0 && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full text-white/40"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                              >
                                👩‍🌾 {o.memberFarmers}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="px-5 pb-5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteTarget(o);
                              setQuoteState({ sending: false, ok: false, err: '' });
                              setQuoteForm((f) => ({ ...f, productWanted: o.commodity }));
                            }}
                            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#1a3c2e] transition hover:opacity-90"
                            style={{ background: '#B5850A' }}
                          >
                            {isFr ? '💬 Demander un devis' : '💬 Request Quote'}
                          </button>
                          <Link
                            to={`/afri-yield/opportunities/${o._id}`}
                            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white text-center"
                            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                          >
                            {isFr ? 'Voir →' : 'View →'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {quoteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#1a3c2e' }}>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide">{isFr ? 'Demande de devis' : 'Quote Request'}</p>
                <p className="font-bold text-white">
                  {quoteTarget.centerName} — {quoteTarget.commodity}
                </p>
              </div>
              <button type="button" onClick={() => setQuoteTarget(null)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {quoteState.ok ? (
                <div className="text-center py-8">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-[#1a3c2e] text-lg mb-2">{isFr ? 'Devis envoyé !' : 'Quote sent!'}</h3>
                  <p className="text-gray-500 text-sm">
                    {isFr ? 'Notre équipe vous contactera dans les 48 heures.' : 'Our team will contact you within 48 hours.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={submitQuote} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Votre nom' : 'Your name'} *</label>
                      <input
                        required
                        value={quoteForm.buyerName}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, buyerName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isFr ? 'Quantité (kg)' : 'Quantity (kg)'}
                      </label>
                      <input
                        type="number"
                        value={quoteForm.quantityKg}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, quantityKg: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isFr ? 'Pays de livraison' : 'Delivery country'}
                      </label>
                      <input
                        value={quoteForm.deliveryCountry}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, deliveryCountry: e.target.value }))}
                        placeholder="USA, France..."
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Message (optionnel)' : 'Message (optional)'}
                    </label>
                    <textarea
                      rows={3}
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B5850A] resize-none"
                    />
                  </div>
                  {quoteState.err && <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">{quoteState.err}</p>}
                  <button
                    type="submit"
                    disabled={quoteState.sending}
                    className="w-full py-3.5 rounded-xl font-bold text-[#1a3c2e] text-sm disabled:opacity-50"
                    style={{ background: '#B5850A' }}
                  >
                    {quoteState.sending ? '...' : isFr ? 'Envoyer ma demande' : 'Send my request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {notifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <span className="text-5xl">{notifyTarget.emoji}</span>
              <h3 className="text-lg font-bold text-[#1a3c2e] mt-3 mb-1">
                {isFr ? `Être notifié — ${notifyTarget.nameFr}` : `Get notified — ${notifyTarget.name}`}
              </h3>
              <p className="text-gray-500 text-sm">
                {isFr
                  ? `Recevez une alerte dès que ${notifyTarget.nameFr} est disponible sur AfriYield.`
                  : `Get an alert as soon as ${notifyTarget.name} is available on AfriYield.`}
              </p>
            </div>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => submitNotify(notifyTarget.key)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: '#1a3c2e' }}
              >
                {isFr ? 'Me notifier' : 'Notify me'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotifyTarget(null);
                  setNotifyEmail('');
                }}
                className="px-4 rounded-xl text-sm text-gray-500 hover:bg-gray-100"
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
