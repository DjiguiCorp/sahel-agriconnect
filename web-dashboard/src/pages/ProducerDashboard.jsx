import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';
import { API_ENDPOINTS } from '../config/api';
import { CROP_EMOJIS } from './producer-dashboard/constants';

const OverviewTab = lazy(() => import('./producer-dashboard/OverviewTab'));
const ListingsTab = lazy(() => import('./producer-dashboard/ListingsTab'));
const BenefitsTab = lazy(() => import('./producer-dashboard/BenefitsTab'));
const ServicesTab = lazy(() => import('./producer-dashboard/ServicesTab'));

const TAB_FALLBACK = (
  <div className="flex justify-center py-16">
    <Loader2 className="w-8 h-8 text-[#1a3c2e] animate-spin" aria-label="Chargement" />
  </div>
);

function maskedDestination(contact, isEmail) {
  if (isEmail) {
    const parts = contact.split('@');
    if (parts.length !== 2) return contact;
    const local = parts[0];
    const masked = local.length <= 1 ? '*' : `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}`;
    return `${masked}@${parts[1]}`;
  }
  if (contact.length <= 8) return contact;
  return `${contact.substring(0, 4)}...${contact.substring(contact.length - 4)}`;
}

function persistFarmerPhone(phone) {
  if (!phone) return;
  const normalized = String(phone).trim();
  if (!normalized || localStorage.getItem('sac_user_phone') === normalized) return;
  localStorage.setItem('sac_user_phone', normalized);
  window.dispatchEvent(new Event('sac_user_updated'));
}

function ProducerDashboard() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const navigate = useNavigate();
  const { userEmail, userName, userPhone, isRegistered, clearUser, registerUser } = useRegisteredUser();

  const [activeTab, setActiveTab] = useState('overview');
  const [loadedTabs, setLoadedTabs] = useState(() => new Set(['overview']));
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [earningsStats, setEarningsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewListing, setShowNewListing] = useState(false);
  const [identEmail, setIdentEmail] = useState('');
  const [identError, setIdentError] = useState('');
  const [identifying, setIdentifying] = useState(false);
  const fetchKeyRef = useRef('');

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

  const selectTab = useCallback((key) => {
    setActiveTab(key);
    setLoadedTabs((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  useEffect(() => {
    setListingForm((p) => ({
      ...p,
      farmerName: profile?.nom || profile?.nomComplet || userName || p.farmerName,
      farmerPhone: profile?.telephone || userPhone || p.farmerPhone,
      farmerEmail: (userEmail || profile?.email || p.farmerEmail || '').toLowerCase(),
      cooperativeName: profile?.nomCooperative || p.cooperativeName,
    }));
  }, [profile, userName, userPhone, userEmail]);

  useEffect(() => {
    if (!userEmail) {
      fetchKeyRef.current = '';
      setLoading(false);
      setProfile(null);
      setListings([]);
      setEarningsStats(null);
      return;
    }

    const fetchKey = `${userEmail}|${userPhone || ''}`;
    if (fetchKeyRef.current === fetchKey) return;
    fetchKeyRef.current = fetchKey;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const identifier = userPhone || userEmail;
        const [farmerRes, listingRes, statsRes] = await Promise.allSettled([
          fetch(`${API_ENDPOINTS.FARMERS.BASE}?email=${encodeURIComponent(userEmail)}`),
          fetch(API_ENDPOINTS.PRODUCE.FARMER(identifier)),
          fetch(API_ENDPOINTS.PRODUCE.STATS(identifier)),
        ]);

        if (cancelled) return;

        if (farmerRes.status === 'fulfilled' && farmerRes.value.ok) {
          const data = await farmerRes.value.json().catch(() => ({}));
          if (data.farmer) {
            setProfile(data.farmer);
            persistFarmerPhone(data.farmer.telephone);
          }
        }

        if (listingRes.status === 'fulfilled' && listingRes.value.ok) {
          const data = await listingRes.value.json().catch(() => ({}));
          setListings(Array.isArray(data.listings) ? data.listings : []);
        } else {
          setListings([]);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const data = await statsRes.value.json().catch(() => ({}));
          setEarningsStats(data);
        } else {
          setEarningsStats(null);
        }
      } catch {
        if (!cancelled) {
          setListings([]);
          setEarningsStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
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
        return;
      }
      const farmer = data.farmer;
      fetchKeyRef.current = '';
      registerUser(identEmail.trim().toLowerCase(), farmer.nom || '', farmer.telephone || '');
      setProfile(farmer);
      persistFarmerPhone(farmer.telephone);
    } catch {
      setIdentError(isFr ? 'Erreur de connexion.' : 'Connection error.');
    } finally {
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
        visibility: 'cooperative_only',
        listingType: 'cooperative_supply',
        cooperativeApproved: false,
        promotedToMarketplace: false,
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

  const tabs = useMemo(
    () => [
      { key: 'overview', label: isFr ? '🏠 Aperçu' : '🏠 Overview' },
      { key: 'listings', label: isFr ? '🌾 Ma production' : '🌾 My production' },
      { key: 'benefits', label: isFr ? '🎁 Avantages' : '🎁 Benefits' },
      { key: 'services', label: isFr ? '🚜 Services' : '🚜 Services' },
    ],
    [isFr]
  );

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

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Loader2 className="w-10 h-10 text-[#1a3c2e] animate-spin" aria-label={isFr ? 'Chargement' : 'Loading'} />
      </div>
    );
  }

  const farmerName = profile?.nom || profile?.nomComplet || userName || '';
  const firstName = farmerName.split(' ')[0] || '';
  const cooperative = profile?.nomCooperative || profile?.cooperative || '';
  const crops = profile?.cultures || profile?.culturesPrincipales || [];
  const countryDisplay = profile?.country || '';
  const contactMasked = userEmail ? maskedDestination(userEmail, true) : '';

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
              {contactMasked ? (
                <p className="text-white/40 text-xs mt-1">{contactMasked}</p>
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
            onClick={() => selectTab(tab.key)}
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

      {activeTab === 'overview' && loadedTabs.has('overview') && (
        <Suspense fallback={TAB_FALLBACK}>
          <OverviewTab
            isFr={isFr}
            profile={profile}
            cooperative={cooperative}
            listings={listings}
            onOpenListings={() => selectTab('listings')}
            onDeclareProduction={() => {
              selectTab('listings');
              setShowNewListing(true);
            }}
          />
        </Suspense>
      )}

      {activeTab === 'listings' && loadedTabs.has('listings') && (
        <Suspense fallback={TAB_FALLBACK}>
          <ListingsTab
            isFr={isFr}
            listings={listings}
            showNewListing={showNewListing}
            setShowNewListing={setShowNewListing}
            listingForm={listingForm}
            setListingForm={setListingForm}
            listingState={listingState}
            submitListing={submitListing}
          />
        </Suspense>
      )}

      {activeTab === 'benefits' && loadedTabs.has('benefits') && (
        <Suspense fallback={TAB_FALLBACK}>
          <BenefitsTab isFr={isFr} profile={profile} cooperative={cooperative} />
        </Suspense>
      )}

      {activeTab === 'services' && loadedTabs.has('services') && (
        <Suspense fallback={TAB_FALLBACK}>
          <ServicesTab isFr={isFr} />
        </Suspense>
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

export default memo(ProducerDashboard);
