import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, MapPin, Search, Filter, CheckCircle, ChevronRight } from 'lucide-react';
import CooperativeInquiryModal from './CooperativeInquiryModal';
import { API_BASE_URL } from '../config/api';
import { AFRICAN_REGIONS } from '../data/africanRegions';

const apiRoot = API_BASE_URL.replace(/\/$/, '');

export default function CooperativeDashboard() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countryFilter, setCountryFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [certFilter, setCertFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryCoop, setInquiryCoop] = useState(null);

  useEffect(() => {
    setError(null);
    fetch(`${apiRoot}/api/cooperatives`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.cooperatives || [];
        const active = list.filter((c) => {
          const st = c.status ?? c.statut;
          if (st === 'Inactive' || st === 'inactive') return false;
          return (
            c.status === 'active' ||
            !c.status ||
            st === 'Fonctionnelle' ||
            st === 'En développement' ||
            st === 'pending'
          );
        });
        setCooperatives(active);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(() => Object.keys(AFRICAN_REGIONS).sort(), []);

  const allCrops = useMemo(
    () => [
      'Shea Butter',
      'Sesame',
      'Cashew',
      'Mango',
      'Rice',
      'Cotton',
      'Millet',
      'Sorghum',
      'Maize',
      'Groundnut',
      'Cowpea',
      'Yam',
      'Cassava',
      'Plantain',
      'Other',
    ],
    []
  );

  const filtered = useMemo(() => {
    return cooperatives.filter((c) => {
      const name = (
        c.cooperativeName ||
        c.nomCooperative ||
        c.nom ||
        ''
      ).toLowerCase();
      const country = c.country || c.pays || '';
      const crops =
        c.primaryCrops || c.culturesPrincipales || c.produits || [];
      const cert = c.certificationStatus || '';
      const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
      const matchCountry = !countryFilter || country === countryFilter;
      const matchCrop = !cropFilter || crops.includes(cropFilter);
      const matchCert = !certFilter || cert === certFilter;
      return matchSearch && matchCountry && matchCrop && matchCert;
    });
  }, [cooperatives, searchQuery, countryFilter, cropFilter, certFilter]);

  const certBadge = (level) =>
    ({
      International: {
        label: '⭐⭐⭐ International (EU/USDA)',
        color: 'bg-amber-50 text-amber-700 border border-amber-200',
      },
      Regional: {
        label: '⭐⭐ Regional (ECOWAS)',
        color: 'bg-blue-50 text-blue-700 border border-blue-200',
      },
      Local: {
        label: '⭐ Local',
        color: 'bg-green-50 text-green-700 border border-green-200',
      },
    }[level] || null);

  const stats = [
    {
      icon: '🤝',
      value: cooperatives.length,
      label: isFr ? 'Coopératives actives' : 'Active Cooperatives',
    },
    {
      icon: '👩‍🌾',
      value: cooperatives.reduce(
        (s, c) => s + (Number(c.memberCount || c.nombreMembres || c.membres) || 0),
        0
      ),
      label: isFr ? 'Agriculteurs membres' : 'Member Farmers',
    },
    {
      icon: '🌍',
      value: countries.length,
      label: isFr ? 'Pays représentés' : 'Countries Represented',
    },
    {
      icon: '⭐',
      value: cooperatives.filter(
        (c) => c.certificationStatus && c.certificationStatus !== 'None'
      ).length,
      label: isFr ? 'Certifiées' : 'Certified',
    },
  ];

  const clearFilters = () => {
    setSearchQuery('');
    setCountryFilter('');
    setCropFilter('');
    setCertFilter('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 60%, #3d7a50 100%)',
        }}
      >
        <div className="px-8 py-12">
          <p className="text-[#B5850A] font-bold text-sm uppercase tracking-widest mb-3">
            {isFr ? 'Réseau coopératif' : 'Cooperative Network'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isFr ? 'Coopératives partenaires' : 'Partner Cooperatives'}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mb-8">
            {isFr
              ? "Rejoignez un réseau de producteurs certifiés en Afrique. Accédez à l'équipement, la formation, et les marchés internationaux via AfriYield Exchange."
              : 'Join a network of certified producers across Africa. Access equipment, training, and international markets via AfriYield Exchange.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(({ icon, value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <span className="text-2xl">{icon}</span>
                <p className="text-3xl font-bold font-mono text-white mt-1">{value}</p>
                <p className="text-white/60 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">
            {isFr ? 'Filtrer les coopératives' : 'Filter cooperatives'}
          </span>
          {(searchQuery || countryFilter || cropFilter || certFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:underline"
            >
              {isFr ? 'Effacer les filtres' : 'Clear filters'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFr ? 'Rechercher...' : 'Search...'}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
            />
          </div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
          >
            <option value="">{isFr ? '🌍 Tous les pays' : '🌍 All countries'}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
          >
            <option value="">{isFr ? '🌾 Toutes les cultures' : '🌾 All crops'}</option>
            {allCrops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
          >
            <option value="">{isFr ? '⭐ Toutes certifications' : '⭐ All certifications'}</option>
            <option value="Local">⭐ Local</option>
            <option value="Regional">⭐⭐ Regional (ECOWAS)</option>
            <option value="International">⭐⭐⭐ International (EU/USDA)</option>
          </select>
        </div>
      </div>

      {!loading && (
        <p className="text-sm text-gray-500">
          {filtered.length}{' '}
          {isFr ? 'coopérative(s) trouvée(s)' : 'cooperative(s) found'}
          {(searchQuery || countryFilter || cropFilter || certFilter) && (
            <span className="text-gray-400">
              {' '}
              {isFr ? 'selon vos filtres' : 'matching your filters'}
            </span>
          )}
        </p>
      )}

      {loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-200">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-red-700 font-semibold">
            {isFr ? 'Impossible de charger les coopératives.' : 'Unable to load cooperatives.'}
          </p>
          <p className="text-red-500 text-sm mt-1">
            {isFr ? 'Vérifiez votre connexion et réessayez.' : 'Check your connection and try again.'}
          </p>
        </div>
      )}

      {!loading && !error && cooperatives.length === 0 && (
        <div
          className="text-center py-20 rounded-3xl border border-gray-200"
          style={{ background: 'linear-gradient(135deg, #F5F0E8, #EDE8E0)' }}
        >
          <div className="text-7xl mb-5">🌱</div>
          <h3 className="text-2xl font-bold text-[#1a3c2e] mb-3">
            {isFr ? 'Le réseau coopératif se construit' : 'The cooperative network is being built'}
          </h3>
          <p className="text-gray-600 max-w-lg mx-auto mb-2 leading-relaxed">
            {isFr
              ? "Les coopératives vérifiées apparaîtront ici. Rejoignez le réseau maintenant et soyez parmi les premières coopératives visibles par les investisseurs diaspora et les acheteurs internationaux via AfriYield Exchange."
              : 'Verified cooperatives will appear here. Join the network now and be among the first cooperatives visible to diaspora investors and international buyers via AfriYield Exchange.'}
          </p>
          <p className="text-[#B5850A] font-semibold text-sm mb-8">
            {isFr
              ? '199$/an · Portail activé après paiement · Accès AfriYield Exchange inclus'
              : '$199/year · Portal activated after payment · AfriYield Exchange access included'}
          </p>
          <a
            href="/cooperative-registration"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm shadow-lg hover:opacity-90 transition"
            style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
          >
            {isFr ? 'Inscrire ma coopérative →' : 'Register my cooperative →'}
          </a>
        </div>
      )}

      {!loading && !error && cooperatives.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 font-semibold">
            {isFr ? 'Aucune coopérative ne correspond à vos filtres.' : 'No cooperatives match your filters.'}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-[#1a3c2e] font-semibold text-sm hover:underline"
          >
            {isFr ? 'Effacer les filtres' : 'Clear filters'}
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((coop) => {
            const name = coop.cooperativeName || coop.nomCooperative || coop.nom;
            const country = coop.country || coop.pays;
            const region = coop.regionCity || coop.region;
            const leader = coop.leaderName || coop.nomResponsable || coop.responsable;
            const members = coop.memberCount || coop.nombreMembres || coop.membres || 0;
            const crops = coop.primaryCrops || coop.culturesPrincipales || coop.produits || [];
            const cert = coop.certificationStatus;
            const interests = coop.interests || [];
            const badge = cert ? certBadge(cert) : null;

            return (
              <article
                key={coop._id || coop.id || name}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#1a3c2e]/30 transition-all duration-200 flex flex-col overflow-hidden"
              >
                <div
                  className="h-1.5 w-full"
                  style={{
                    background:
                      cert === 'International'
                        ? 'linear-gradient(90deg,#B5850A,#d4a017)'
                        : cert === 'Regional'
                          ? 'linear-gradient(90deg,#3b82f6,#60a5fa)'
                          : 'linear-gradient(90deg,#1a3c2e,#2d5a3d)',
                  }}
                />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-[#1a3c2e] leading-snug truncate">{name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500 truncate">
                          {region ? `${region}, ` : ''}
                          {country}
                        </span>
                      </div>
                    </div>
                    {badge && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4 bg-[#1a3c2e]/5 rounded-xl px-3 py-2.5">
                    <Users className="w-4 h-4 text-[#1a3c2e] flex-shrink-0" />
                    <span className="text-sm font-semibold text-[#1a3c2e]">
                      {Number(members).toLocaleString()}{' '}
                      {isFr ? 'agriculteurs membres' : 'member farmers'}
                    </span>
                  </div>

                  {crops.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {isFr ? 'Cultures principales' : 'Main Crops'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {crops.slice(0, 4).map((crop) => (
                          <span
                            key={crop}
                            className="text-xs px-2.5 py-1 rounded-full bg-[#1a3c2e]/8 text-[#1a3c2e] font-medium border border-[#1a3c2e]/10"
                          >
                            🌾 {crop}
                          </span>
                        ))}
                        {crops.length > 4 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                            +{crops.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {interests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {isFr ? "Programmes d'intérêt" : 'Interest Programs'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((interest) => (
                          <span
                            key={interest}
                            className="text-xs px-2 py-1 rounded-full bg-[#B5850A]/10 text-[#B5850A] font-medium"
                          >
                            {interest === 'Equipment Fund'
                              ? '🔧'
                              : interest === 'Certification'
                                ? '⭐'
                                : interest === 'Diaspora Investment'
                                  ? '💰'
                                  : interest === 'Export Program'
                                    ? '🌍'
                                    : '📋'}{' '}
                            {isFr
                              ? interest === 'Equipment Fund'
                                ? 'Équipement'
                                : interest === 'Certification'
                                  ? 'Certification'
                                  : interest === 'Diaspora Investment'
                                    ? 'Investissement diaspora'
                                    : interest === 'Export Program'
                                      ? 'Export'
                                      : interest
                              : interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {leader && (
                    <p className="text-xs text-gray-400 mb-4">
                      👤 {isFr ? 'Responsable:' : 'Leader:'}{' '}
                      <span className="text-gray-600 font-medium">{leader}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mb-5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">
                      {isFr ? 'Vérifiée par Sahel AgriConnect' : 'Verified by Sahel AgriConnect'}
                    </span>
                  </div>

                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={() => setInquiryCoop(coop)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
                    >
                      {isFr ? 'Demander à rejoindre' : 'Request to Join'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {inquiryCoop && (
        <CooperativeInquiryModal cooperative={inquiryCoop} onClose={() => setInquiryCoop(null)} />
      )}
    </div>
  );
}
