import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Tractor,
  Droplets,
  Thermometer,
  BookOpen,
  DollarSign,
  Check,
  Loader2,
} from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import { API_ENDPOINTS } from '../config/api';

const CROPS = ['Shea Butter', 'Sesame', 'Cashew', 'Mango', 'Rice', 'Cotton', 'Millet', 'Sorghum'];
const CROP_EMOJIS = {
  'Shea Butter': '🌿',
  Sesame: '🌾',
  Cashew: '🥜',
  Mango: '🥭',
  Rice: '🌾',
  Cotton: '🌸',
  Millet: '🌾',
  Sorghum: '🌾',
};

function mapFarmerQualityToCert(ql) {
  const q = String(ql || '').toLowerCase();
  if (q === 'international') return 'International';
  if (q === 'regional') return 'Regional';
  if (q === 'local') return 'Local';
  return 'None';
}

export default function ProducerDashboard() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const { userEmail, userName, userPhone, isRegistered, clearUser, registerUser } = useRegisteredUser();

  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [earningsStats, setEarningsStats] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showNewListing, setShowNewListing] = useState(false);
  const [identEmail, setIdentEmail] = useState('');
  const [identError, setIdentError] = useState('');
  const [identifying, setIdentifying] = useState(false);

  const [listingForm, setListingForm] = useState({
    commodity: 'Shea Butter',
    quantityKg: '',
    pricePerKgUSD: '',
    certificationLevel: 'None',
    qualityGrade: 'B',
    availableFrom: '',
    availableUntil: '',
    minimumOrderKg: '50',
    description: '',
    farmerName: '',
    farmerPhone: '',
    farmerEmail: '',
    cooperativeName: '',
  });

  const [listingState, setListingState] = useState({ loading: false, ok: false, err: '' });

  useEffect(() => {
    setListingForm((p) => ({
      ...p,
      farmerName: userName || p.farmerName,
      farmerPhone: userPhone || p.farmerPhone,
      farmerEmail: userEmail || p.farmerEmail,
    }));
  }, [userName, userPhone, userEmail]);

  useEffect(() => {
    if (!profile) return;
    setListingForm((p) => ({
      ...p,
      farmerName: profile.nom || p.farmerName,
      farmerPhone: profile.telephone || p.farmerPhone,
      farmerEmail: (userEmail || profile.email || p.farmerEmail || '').toLowerCase(),
      cooperativeName: profile.nomCooperative || p.cooperativeName,
    }));
  }, [profile, userEmail]);

  useEffect(() => {
    if (!userEmail) {
      setLoadingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      try {
        const identifier = userPhone || userEmail || '';
        const [farmerRes, listingRes, statsRes] = await Promise.allSettled([
          fetch(`${API_ENDPOINTS.FARMERS.BASE}?email=${encodeURIComponent(userEmail)}`),
          identifier
            ? fetch(API_ENDPOINTS.PRODUCE.FARMER(identifier))
            : Promise.resolve({ ok: false }),
          identifier
            ? fetch(API_ENDPOINTS.PRODUCE.STATS(identifier))
            : Promise.resolve({ ok: false }),
        ]);

        if (cancelled) return;

        if (farmerRes.status === 'fulfilled' && farmerRes.value.ok) {
          const data = await farmerRes.value.json().catch(() => ({}));
          if (data.farmer) {
            setProfile(data.farmer);
            if (data.farmer.telephone) {
              localStorage.setItem('sac_user_phone', data.farmer.telephone);
              window.dispatchEvent(new Event('sac_user_updated'));
            }
          }
        }

        if (listingRes.status === 'fulfilled' && listingRes.value.ok) {
          const data = await listingRes.value.json().catch(() => ({}));
          setListings(data.listings || []);
        } else if (!cancelled) {
          setListings([]);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const data = await statsRes.value.json().catch(() => ({}));
          setEarningsStats(data);
        } else if (!cancelled) {
          setEarningsStats(null);
        }
      } catch {
        if (!cancelled) {
          setListings([]);
          setEarningsStats(null);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail, userPhone]);

  const identify = async (e) => {
    e.preventDefault();
    if (!identEmail.trim()) return;
    setIdentifying(true);
    setIdentError('');
    try {
      const res = await fetch(
        `${API_ENDPOINTS.FARMERS.BASE}?email=${encodeURIComponent(identEmail.trim())}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.farmer) {
        setIdentError(isFr ? 'Aucun profil trouvé.' : 'No profile found.');
        setIdentifying(false);
        return;
      }
      const farmer = data.farmer;
      registerUser(identEmail.trim().toLowerCase(), farmer.nom || '', farmer.telephone || '');
      setProfile(farmer);
      setIdentifying(false);
    } catch {
      setIdentError(isFr ? 'Erreur de connexion.' : 'Connection error.');
      setIdentifying(false);
    }
  };

  const submitListing = async (e) => {
    e.preventDefault();
    setListingState({ loading: true, ok: false, err: '' });
    try {
      const country = profile?.country || '';
      const region = profile?.region || '';
      const body = {
        ...listingForm,
        quantityKg: Number(listingForm.quantityKg),
        pricePerKgUSD: Number(listingForm.pricePerKgUSD),
        minimumOrderKg: Number(listingForm.minimumOrderKg || 50),
        farmerName: profile?.nom || profile?.nomComplet || userName || listingForm.farmerName,
        farmerPhone: profile?.telephone || userPhone || listingForm.farmerPhone,
        farmerEmail: String(userEmail || listingForm.farmerEmail || '').toLowerCase(),
        cooperativeName: profile?.nomCooperative || listingForm.cooperativeName,
        country,
        region,
      };
      if (profile?._id) body.farmerId = profile._id;

      const r = await fetch(API_ENDPOINTS.PRODUCE.BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'fail');
      const data = await r.json();
      setListings((prev) => [data.listing, ...prev]);
      setListingState({ loading: false, ok: true, err: '' });
      setTimeout(() => {
        setShowNewListing(false);
        setListingState({ loading: false, ok: false, err: '' });
      }, 2000);
      const id = userPhone || userEmail || '';
      if (id) {
        const sr = await fetch(API_ENDPOINTS.PRODUCE.STATS(id));
        if (sr.ok) setEarningsStats(await sr.json().catch(() => null));
      }
    } catch {
      setListingState({
        loading: false,
        ok: false,
        err: isFr ? 'Erreur. Réessayez.' : 'Error. Try again.',
      });
    }
  };

  if (!isRegistered && !profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🌾</div>
          <h2 className="text-xl font-bold text-[#1a3c2e] mb-2">
            {isFr ? 'Mon Tableau de Bord Producteur' : 'My Producer Dashboard'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {isFr
              ? 'Entrez votre email pour accéder à votre tableau de bord.'
              : 'Enter your email to access your dashboard.'}
          </p>
          <form onSubmit={identify} className="space-y-3">
            <input
              type="email"
              required
              value={identEmail}
              onChange={(e) => setIdentEmail(e.target.value)}
              placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            />
            {identError && <p className="text-red-500 text-xs">{identError}</p>}
            <button
              type="submit"
              disabled={identifying}
              className="w-full rounded-xl py-3 font-bold text-white text-sm"
              style={{ background: '#1a3c2e' }}
            >
              {identifying ? '...' : isFr ? 'Accéder →' : 'Access →'}
            </button>
          </form>
          <p className="text-gray-400 text-xs mt-4">
            {isFr ? 'Pas encore inscrit ?' : 'Not registered yet?'}{' '}
            <Link to="/dashboard" className="text-[#1a3c2e] font-semibold hover:underline">
              {isFr ? "S'inscrire" : 'Register'}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (isRegistered && loadingProfile && !profile) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center px-4">
        <Loader2 className="w-10 h-10 text-[#1a3c2e] animate-spin" aria-label={isFr ? 'Chargement' : 'Loading'} />
      </div>
    );
  }

  const farmerName = profile?.nom || profile?.nomComplet || userName || '';
  const firstName = farmerName.split(' ')[0] || '';
  const cooperative = profile?.nomCooperative || profile?.cooperative || '';
  const certLevel = mapFarmerQualityToCert(profile?.qualityLevel || profile?.certification);
  const crops = profile?.cultures || profile?.culturesPrincipales || [];

  const benefits = [
    {
      key: 'tractor',
      icon: <Tractor className="w-5 h-5" />,
      label: isFr ? 'Accès tracteur' : 'Tractor Access',
      progress: cooperative ? 60 : 20,
      status: cooperative
        ? isFr
          ? 'Via coopérative'
          : 'Via cooperative'
        : isFr
          ? 'Rejoindre une coop.'
          : 'Join a cooperative',
      color: '#1a3c2e',
      action: cooperative ? '/farmer-needs' : '/cooperatives',
      actionLabel: cooperative ? (isFr ? 'Réserver' : 'Book') : isFr ? 'Rejoindre' : 'Join',
    },
    {
      key: 'cold_storage',
      icon: <Thermometer className="w-5 h-5" />,
      label: isFr ? 'Stockage frigorifique' : 'Cold Storage',
      progress: certLevel !== 'None' ? 70 : cooperative ? 40 : 10,
      status:
        certLevel !== 'None'
          ? isFr
            ? 'Certifié — éligible'
            : 'Certified — eligible'
          : isFr
            ? 'Certification requise'
            : 'Certification needed',
      color: '#3b82f6',
      action: '/farmer-certification',
      actionLabel: isFr ? 'Certifier' : 'Get Certified',
    },
    {
      key: 'training',
      icon: <BookOpen className="w-5 h-5" />,
      label: isFr ? 'Formations' : 'Training',
      progress: cooperative ? 50 : 25,
      status: cooperative
        ? isFr
          ? 'Disponible via coop.'
          : 'Available via coop.'
        : isFr
          ? 'Rejoindre une coop.'
          : 'Join a cooperative',
      color: '#8b5cf6',
      action: '/farmer-needs',
      actionLabel: isFr ? 'Demander' : 'Request',
    },
    {
      key: 'irrigation',
      icon: <Droplets className="w-5 h-5" />,
      label: isFr ? 'Irrigation' : 'Irrigation',
      progress: cooperative ? 45 : 15,
      status: isFr ? 'Demande possible' : 'Request available',
      color: '#0ea5e9',
      action: '/farmer-needs',
      actionLabel: isFr ? 'Demander' : 'Request',
    },
    {
      key: 'micro_loan',
      icon: <DollarSign className="w-5 h-5" />,
      label: isFr ? 'Micro-financement' : 'Micro-loan',
      progress: cooperative && certLevel !== 'None' ? 80 : cooperative ? 35 : 5,
      status:
        cooperative && certLevel !== 'None'
          ? isFr
            ? 'Éligible via AfriYield'
            : 'Eligible via AfriYield'
          : isFr
            ? 'Certification + coop. requises'
            : 'Cert. + coop. needed',
      color: '#B5850A',
      action: '/afri-yield',
      actionLabel: 'AfriYield',
    },
  ];

  const tabs = [
    { key: 'overview', label: isFr ? '🏠 Aperçu' : '🏠 Overview' },
    { key: 'listings', label: isFr ? '🌾 Mes produits' : '🌾 My Produce' },
    { key: 'benefits', label: isFr ? '🎁 Avantages' : '🎁 Benefits' },
    { key: 'services', label: isFr ? '🚜 Services' : '🚜 Services' },
  ];

  const countryDisplay = profile?.country || '';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 100%)' }}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm">{isFr ? 'Bonjour,' : 'Hello,'}</p>
              <h1 className="text-3xl font-bold text-white">
                {firstName || (isFr ? 'Agriculteur' : 'Farmer')} 👋
              </h1>
              {cooperative && <p className="text-[#B5850A] text-sm mt-1">🤝 {cooperative}</p>}
              {countryDisplay ? (
                <p className="text-white/50 text-xs mt-0.5">
                  🌍 {profile?.region ? `${profile.region}, ` : ''}
                  {countryDisplay}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-white/60">{isFr ? 'Revenus totaux' : 'Total Earnings'}</p>
                <p className="text-2xl font-bold font-mono text-[#B5850A]">
                  ${(earningsStats?.totalEarnings || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              {
                icon: '📦',
                value: earningsStats?.activeListings ?? '—',
                label: isFr ? 'Annonces actives' : 'Active Listings',
              },
              {
                icon: '👁',
                value: earningsStats?.totalViews ?? '—',
                label: isFr ? 'Vues totales' : 'Total Views',
              },
              {
                icon: '💬',
                value: earningsStats?.totalInquiries ?? '—',
                label: isFr ? 'Demandes reçues' : 'Inquiries Received',
              },
              {
                icon: '🌾',
                value:
                  earningsStats?.totalKgListed != null
                    ? `${Number(earningsStats.totalKgListed).toLocaleString()} kg`
                    : '—',
                label: isFr ? 'Kg listés' : 'Kg Listed',
              },
            ].map(({ icon, value, label }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <span className="text-xl">{icon}</span>
                <p className="text-lg font-bold font-mono text-white mt-1">{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>

          {crops.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {crops.slice(0, 5).map((crop) => (
                <span key={crop} className="text-xs px-2.5 py-1 rounded-full bg-white/15 text-white/80">
                  {CROP_EMOJIS[crop] || '🌾'} {crop}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-[#1a3c2e] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-[#1a3c2e] mb-4">{isFr ? '📋 Statut du profil' : '📋 Profile Status'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: isFr ? 'Profil' : 'Profile',
                  value: profile ? (isFr ? 'Vérifié' : 'Verified') : isFr ? 'En attente' : 'Pending',
                  color: profile ? 'text-green-600' : 'text-yellow-600',
                  bg: profile ? 'bg-green-50' : 'bg-yellow-50',
                  icon: profile ? '✅' : '⏳',
                },
                {
                  label: isFr ? 'Coopérative' : 'Cooperative',
                  value: cooperative || (isFr ? 'Non membre' : 'Not a member'),
                  color: cooperative ? 'text-[#1a3c2e]' : 'text-gray-400',
                  bg: cooperative ? 'bg-[#1a3c2e]/5' : 'bg-gray-50',
                  icon: cooperative ? '🤝' : '➕',
                },
                {
                  label: isFr ? 'Certification' : 'Certification',
                  value: certLevel !== 'None' ? certLevel : isFr ? 'Aucune' : 'None',
                  color: certLevel !== 'None' ? 'text-amber-600' : 'text-gray-400',
                  bg: certLevel !== 'None' ? 'bg-amber-50' : 'bg-gray-50',
                  icon: '⭐',
                },
                {
                  label: isFr ? 'Annonces' : 'Listings',
                  value: `${listings.length} ${isFr ? 'produits' : 'products'}`,
                  color: listings.length > 0 ? 'text-[#1a3c2e]' : 'text-gray-400',
                  bg: listings.length > 0 ? 'bg-[#1a3c2e]/5' : 'bg-gray-50',
                  icon: '📦',
                },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${bg}`}>
                  <span className="text-2xl">{icon}</span>
                  <p className={`font-bold text-sm mt-1 ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('listings');
                setShowNewListing(true);
              }}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-dashed border-[#1a3c2e]/30 hover:border-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition text-left"
            >
              <Plus className="w-8 h-8 text-[#1a3c2e] shrink-0" />
              <div>
                <p className="font-semibold text-[#1a3c2e] text-sm">
                  {isFr ? 'Lister un produit' : 'List a product'}
                </p>
                <p className="text-xs text-gray-400">{isFr ? 'Vendre ma récolte' : 'Sell my harvest'}</p>
              </div>
            </button>
            <Link
              to="/farmer-needs"
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#B5850A]/40 hover:bg-[#B5850A]/5 transition"
            >
              <span className="text-3xl shrink-0">🌾</span>
              <div>
                <p className="font-semibold text-[#1a3c2e] text-sm">
                  {isFr ? 'Soumettre un besoin' : 'Submit a need'}
                </p>
                <p className="text-xs text-gray-400">{isFr ? 'Équipement, formation...' : 'Equipment, training...'}</p>
              </div>
            </Link>
            <Link
              to="/cooperatives"
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#B5850A]/40 hover:bg-[#B5850A]/5 transition"
            >
              <span className="text-3xl shrink-0">🤝</span>
              <div>
                <p className="font-semibold text-[#1a3c2e] text-sm">
                  {isFr ? 'Rejoindre une coopérative' : 'Join a cooperative'}
                </p>
                <p className="text-xs text-gray-400">{isFr ? 'Voir les services' : 'View services'}</p>
              </div>
            </Link>
          </div>

          {listings.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1a3c2e]">{isFr ? '📦 Dernières annonces' : '📦 Recent Listings'}</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('listings')}
                  className="text-xs text-[#B5850A] hover:underline"
                >
                  {isFr ? 'Voir tout →' : 'View all →'}
                </button>
              </div>
              <div className="space-y-2">
                {listings.slice(0, 3).map((l) => (
                  <div key={l._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CROP_EMOJIS[l.commodity] || '🌾'}</span>
                      <div>
                        <p className="font-medium text-sm text-[#1a3c2e]">{l.commodity}</p>
                        <p className="text-xs text-gray-400">
                          {l.quantityKg?.toLocaleString()} kg · ${l.pricePerKgUSD}/kg
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-[#1a3c2e]">
              {isFr ? 'Mes produits listés' : 'My Listed Products'}
            </h3>
            <button
              type="button"
              onClick={() => setShowNewListing(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
              style={{ background: '#1a3c2e' }}
            >
              <Plus className="w-4 h-4" />
              {isFr ? 'Nouvelle annonce' : 'New Listing'}
            </button>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
              <div className="text-6xl mb-3">🌾</div>
              <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">
                {isFr ? 'Aucun produit listé' : 'No products listed'}
              </h3>
              <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
                {isFr
                  ? 'Listez votre récolte pour la vendre directement aux acheteurs locaux et internationaux.'
                  : 'List your harvest to sell directly to local and international buyers.'}
              </p>
              <button
                type="button"
                onClick={() => setShowNewListing(true)}
                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#1a3c2e' }}
              >
                + {isFr ? 'Lister mon premier produit' : 'List my first product'}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {listings.map((l) => (
                <div key={l._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CROP_EMOJIS[l.commodity] || '🌾'}</span>
                      <div>
                        <p className="font-bold text-[#1a3c2e]">{l.commodity}</p>
                        <p className="text-xs text-gray-400">
                          {l.qualityGrade} Grade · {l.certificationLevel}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        l.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : l.status === 'sold'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center bg-gray-50 rounded-lg p-2">
                      <p className="font-bold font-mono text-[#1a3c2e]">{l.quantityKg?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">kg</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-2">
                      <p className="font-bold font-mono text-[#B5850A]">${l.pricePerKgUSD}</p>
                      <p className="text-xs text-gray-400">/kg</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-2">
                      <p className="font-bold font-mono text-green-600">
                        ${((l.pricePerKgUSD || 0) * (l.quantityKg || 0)).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{isFr ? 'valeur' : 'value'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-1">
                    <span>
                      👁 {l.viewCount || 0} {isFr ? 'vues' : 'views'}
                    </span>
                    <span>
                      💬 {l.inquiryCount || 0} {isFr ? 'demandes' : 'inquiries'}
                    </span>
                    <span>{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showNewListing && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl relative">
                <h3 className="font-bold text-[#1a3c2e] text-xl mb-4">
                  {isFr ? '🌾 Lister un produit' : '🌾 List a Product'}
                </h3>
                {listingState.ok ? (
                  <div className="text-center py-6">
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-bold text-[#1a3c2e]">{isFr ? 'Produit listé !' : 'Product listed!'}</p>
                  </div>
                ) : (
                  <form onSubmit={submitListing} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isFr ? 'Produit' : 'Commodity'} *
                      </label>
                      <select
                        value={listingForm.commodity}
                        onChange={(e) => setListingForm((p) => ({ ...p, commodity: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                      >
                        {CROPS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isFr ? 'Quantité (kg)' : 'Quantity (kg)'} *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={listingForm.quantityKg}
                          onChange={(e) => setListingForm((p) => ({ ...p, quantityKg: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isFr ? 'Prix/kg (USD)' : 'Price/kg (USD)'} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          min={0}
                          value={listingForm.pricePerKgUSD}
                          onChange={(e) => setListingForm((p) => ({ ...p, pricePerKgUSD: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isFr ? 'Certification' : 'Certification'}
                        </label>
                        <select
                          value={listingForm.certificationLevel}
                          onChange={(e) => setListingForm((p) => ({ ...p, certificationLevel: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                        >
                          <option value="None">{isFr ? 'Aucune' : 'None'}</option>
                          <option value="Local">Local</option>
                          <option value="Regional">Regional (ECOWAS)</option>
                          <option value="International">International (EU/USDA)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Qualité' : 'Grade'}</label>
                        <select
                          value={listingForm.qualityGrade}
                          onChange={(e) => setListingForm((p) => ({ ...p, qualityGrade: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                        >
                          <option value="C">C</option>
                          <option value="B">B</option>
                          <option value="A">A</option>
                          <option value="Export Grade">Export Grade</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isFr ? 'Description (optionnel)' : 'Description (optional)'}
                      </label>
                      <textarea
                        value={listingForm.description}
                        onChange={(e) => setListingForm((p) => ({ ...p, description: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                      />
                    </div>
                    {listingState.err && (
                      <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{listingState.err}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={listingState.loading}
                        className="flex-1 rounded-xl py-3 font-bold text-white text-sm disabled:opacity-50"
                        style={{ background: '#1a3c2e' }}
                      >
                        {listingState.loading ? '...' : isFr ? 'Publier' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewListing(false)}
                        className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm"
                      >
                        {isFr ? 'Annuler' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'benefits' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-[#1a3c2e]">
              {isFr ? 'Mes avantages coopératifs' : 'My Cooperative Benefits'}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {isFr
                ? 'Votre progression vers chaque avantage. Rejoignez une coopérative et obtenez une certification pour débloquer plus.'
                : 'Your progress toward each benefit. Join a cooperative and get certified to unlock more.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div key={b.key} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: b.color }}
                  >
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a3c2e] text-sm">{b.label}</p>
                    <p className="text-xs text-gray-400">{b.status}</p>
                  </div>
                  <span className="text-lg font-bold font-mono shrink-0" style={{ color: b.color }}>
                    {b.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${b.progress}%`, background: b.color }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400 flex-1 min-w-0">
                    {b.progress < 30
                      ? isFr
                        ? '💡 Rejoignez une coopérative pour avancer'
                        : '💡 Join a cooperative to progress'
                      : b.progress < 70
                        ? isFr
                          ? '✓ Bonne progression'
                          : '✓ Good progress'
                        : isFr
                          ? '🎉 Presque éligible !'
                          : '🎉 Almost eligible!'}
                  </p>
                  <Link to={b.action} className="text-xs font-semibold shrink-0 hover:underline" style={{ color: b.color }}>
                    {b.actionLabel} →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h4 className="font-bold text-[#1a3c2e] mb-4">
              ⭐ {isFr ? 'Parcours de certification' : 'Certification Pathway'}
            </h4>
            <div className="flex items-center gap-2 mb-3">
              {['None', 'Local', 'Regional', 'International'].map((level, idx) => {
                const levels = ['None', 'Local', 'Regional', 'International'];
                const currentIndex = levels.indexOf(certLevel);
                const done = currentIndex > idx;
                const active = currentIndex === idx;
                return (
                  <div key={level} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex-1 h-3 rounded-full ${done || active ? '' : 'bg-gray-200'}`}
                      style={{
                        background: done ? '#1a3c2e' : active ? '#B5850A' : undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-3">
              {['None', 'Local', 'Regional', 'International'].map((lev) => (
                <span key={lev} className={certLevel === lev ? 'text-[#B5850A] font-bold' : ''}>
                  {lev}
                </span>
              ))}
            </div>
            {certLevel === 'None' && (
              <Link
                to="/farmer-certification"
                className="block w-full text-center py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#B5850A' }}
              >
                {isFr ? '⭐ Commencer la certification' : '⭐ Start Certification'}
              </Link>
            )}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-[#1a3c2e]">{isFr ? 'Services disponibles' : 'Available Services'}</h3>
            <p className="text-gray-500 text-sm mt-1">
              {isFr
                ? 'Réservez des services via votre coopérative ou directement.'
                : 'Book services via your cooperative or directly.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                type: 'tractor',
                icon: '🚜',
                label: isFr ? 'Tracteur' : 'Tractor',
                desc: isFr ? 'Labour, semis, transport de récolte' : 'Plowing, planting, harvest transport',
                price: isFr ? '15–25$/heure' : '$15–25/hour',
              },
              {
                type: 'irrigation',
                icon: '💧',
                label: isFr ? 'Irrigation' : 'Irrigation',
                desc: isFr ? "Systèmes d'irrigation solaire ou gravitaire" : 'Solar or gravity irrigation systems',
                price: isFr ? 'Selon besoins' : 'Based on needs',
              },
              {
                type: 'cold_storage',
                icon: '🏠',
                label: isFr ? 'Stockage frigorifique' : 'Cold Storage',
                desc: isFr ? 'Conservation post-récolte certifiée' : 'Certified post-harvest conservation',
                price: isFr ? '2$/kg/mois' : '$2/kg/month',
              },
              {
                type: 'training',
                icon: '📚',
                label: isFr ? 'Formation' : 'Training',
                desc: isFr ? 'Techniques agricoles, certification, export' : 'Farming techniques, certification, export',
                price: isFr ? '99–299$ selon niveau' : '$99–299 by level',
              },
              {
                type: 'micro_loan',
                icon: '💰',
                label: isFr ? 'Micro-financement' : 'Micro-loan',
                desc: isFr ? 'Financement intrants, équipements via AfriYield' : 'Input/equipment financing via AfriYield',
                price: isFr ? 'Dès 500$' : 'From $500',
              },
              {
                type: 'processing',
                icon: '⚙️',
                label: isFr ? 'Transformation' : 'Processing',
                desc: isFr ? 'Centres de transformation certifiés' : 'Certified transformation centers',
                price: isFr ? '0.5–1$/kg' : '$0.5–1/kg',
              },
            ].map((service) => (
              <div key={service.type} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl shrink-0">{service.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1a3c2e]">{service.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{service.desc}</p>
                    <p className="text-xs font-semibold text-[#B5850A] mt-1">{service.price}</p>
                  </div>
                </div>
                <Link
                  to="/farmer-needs"
                  className="block w-full text-center py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90"
                  style={{ background: '#1a3c2e' }}
                >
                  {isFr ? 'Demander ce service →' : 'Request this service →'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={() => {
            clearUser();
            navigate('/');
          }}
          className="text-xs text-gray-400 hover:text-red-400 transition"
        >
          {isFr ? 'Se déconnecter du tableau de bord' : 'Sign out of dashboard'}
        </button>
      </div>
    </div>
  );
}
