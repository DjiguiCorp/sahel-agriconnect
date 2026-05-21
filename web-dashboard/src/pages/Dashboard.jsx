import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_BASE_URL;

const CROP_EMOJIS = {
  'Shea Butter': '🌿',
  'Sésame': '🌾',
  Sesame: '🌾',
  Anacarde: '🥜',
  Cashew: '🥜',
  Mangue: '🥭',
  Mango: '🥭',
  Riz: '🌾',
  Rice: '🌾',
  Coton: '🌸',
  Cotton: '🌸',
  Mil: '🌾',
  Millet: '🌾',
  Sorgho: '🌾',
  Sorghum: '🌾',
  'Maïs': '🌽',
  Maize: '🌽',
};

const darkCard = 'bg-gradient-to-br from-white/5 to-white/3 rounded-2xl border border-white/10 p-6';

export default function Dashboard() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');

  const [activeTab, setActiveTab] = useState('overview');
  const [farmerStats, setFarmerStats] = useState(null);
  const [coopStats, setCoopStats] = useState(null);
  const [processorStats, setProcessorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState('');
  const [selectedCoop, setSelectedCoop] = useState(null);
  const [coopDetailLoading, setCoopDetailLoading] = useState(false);
  const [coopDetail, setCoopDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(`${API}/api/farmers/public-stats`).then((r) => r.json()),
      fetch(`${API}/api/cooperatives/public-stats`).then((r) => r.json()),
      fetch(`${API}/api/processors/public-stats`).then((r) => r.json()),
    ])
      .then(([farmers, coops, processors]) => {
        if (farmers.status === 'fulfilled') setFarmerStats(farmers.value);
        if (coops.status === 'fulfilled') setCoopStats(coops.value);
        if (processors.status === 'fulfilled') setProcessorStats(processors.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const platformCountries = useMemo(
    () =>
      [
        ...new Set([
          ...(farmerStats?.byCountry || []).map((c) => c._id),
          ...(coopStats?.byCountry || []).map((c) => c._id),
          ...(processorStats?.byCountry || []).map((c) => c._id),
          ...(farmerStats?.recent || []).map((f) => f.country),
          ...(coopStats?.recent || []).map((c) => c.country),
          ...(processorStats?.recent || []).map((p) => p.country),
        ]),
      ]
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b))),
    [farmerStats, coopStats, processorStats]
  );

  const filteredFarmers =
    farmerStats?.recent?.filter((f) => !countryFilter || f.country === countryFilter) || [];
  const filteredCoops =
    coopStats?.recent?.filter((c) => !countryFilter || c.country === countryFilter) || [];
  const filteredProcessors =
    processorStats?.recent?.filter((p) => !countryFilter || p.country === countryFilter) || [];

  const loadCoopDetail = async (coop) => {
    setSelectedCoop(coop);
    setCoopDetailLoading(true);
    setCoopDetail(null);
    try {
      const id = coop._id || coop.id;
      if (id) {
        const r = await fetch(`${API}/api/cooperatives/${id}`);
        const d = await r.json().catch(() => ({}));
        if (d.cooperative || d.data) {
          setCoopDetail(d.cooperative || d.data);
        } else {
          setCoopDetail(coop);
        }
      } else {
        setCoopDetail(coop);
      }
    } catch {
      setCoopDetail(coop);
    } finally {
      setCoopDetailLoading(false);
    }
  };

  const tabs = [
    { key: 'overview', label: isFr ? "🌍 Vue d'ensemble" : '🌍 Overview' },
    {
      key: 'farmers',
      label: isFr
        ? `👩‍🌾 Agriculteurs (${farmerStats?.total || 0})`
        : `👩‍🌾 Farmers (${farmerStats?.total || 0})`,
    },
    {
      key: 'cooperatives',
      label: isFr
        ? `🤝 Coopératives (${coopStats?.total || 0})`
        : `🤝 Cooperatives (${coopStats?.total || 0})`,
    },
    {
      key: 'processors',
      label: isFr
        ? `🏭 Transformateurs (${processorStats?.total || 0})`
        : `🏭 Processors (${processorStats?.total || 0})`,
    },
  ];

  const statCards = [
    {
      icon: '👩‍🌾',
      value: farmerStats?.total || 0,
      label: isFr ? 'Agriculteurs' : 'Farmers',
      sub: `${farmerStats?.active || 0} ${isFr ? 'actifs' : 'active'}`,
      color: '#4CAF50',
      bg: 'from-green-900/40 to-green-950/60',
      border: 'border-green-500/20',
    },
    {
      icon: '🤝',
      value: coopStats?.total || 0,
      label: isFr ? 'Coopératives' : 'Cooperatives',
      sub: `${coopStats?.active || 0} ${isFr ? 'actives' : 'active'}`,
      color: '#B5850A',
      bg: 'from-amber-900/40 to-amber-950/60',
      border: 'border-amber-500/20',
    },
    {
      icon: '🏭',
      value: processorStats?.total || 0,
      label: isFr ? 'Transformateurs' : 'Processors',
      sub: `${processorStats?.certified || 0} ${isFr ? 'certifiés' : 'certified'}`,
      color: '#3b82f6',
      bg: 'from-blue-900/40 to-blue-950/60',
      border: 'border-blue-500/20',
    },
    {
      icon: '🌾',
      value: `${(farmerStats?.totalArea || 0).toFixed(0)} ha`,
      label: isFr ? 'Superficie totale' : 'Total Area',
      sub: isFr ? 'terres agricoles' : 'farmland',
      color: '#1D9E75',
      bg: 'from-teal-900/40 to-teal-950/60',
      border: 'border-teal-500/20',
    },
    {
      icon: '🌍',
      value: platformCountries.length,
      label: isFr ? 'Pays représentés' : 'Countries',
      sub: isFr ? 'sur la plateforme' : 'on platform',
      color: '#9C27B0',
      bg: 'from-purple-900/40 to-purple-950/60',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-[#060f0a]">
      <section
        style={{
          background: 'linear-gradient(135deg, #060f0a 0%, #0a1f10 50%, #060f0a 100%)',
        }}
        className="text-white border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30 mb-3">
                🌍 {isFr ? 'Plateforme en direct' : 'Live Platform'}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {isFr
                  ? 'Écosystème agricole — Sahel AgriConnect'
                  : 'Agricultural Ecosystem — Sahel AgriConnect'}
              </h1>
              <p className="text-white/60 text-base max-w-2xl">
                {isFr
                  ? 'Vue en temps réel des agriculteurs, coopératives et centres de transformation enregistrés.'
                  : 'Real-time view of registered farmers, cooperatives, and transformation centers.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/inscription"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                + {isFr ? 'Inscrire un agriculteur' : 'Register a Farmer'}
              </Link>
              <Link
                to="/cooperative-registration"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{
                  borderColor: '#B5850A',
                  color: '#B5850A',
                  backgroundColor: 'rgba(181,133,10,0.08)',
                }}
              >
                + {isFr ? 'Inscrire une coopérative' : 'Register a Cooperative'}
              </Link>
              <Link
                to="/transformation-registration"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  backgroundColor: 'rgba(59,130,246,0.08)',
                }}
              >
                + {isFr ? 'Centre de transformation' : 'Transformation Center'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-amber-400 font-semibold text-sm">
              {isFr ? '💰 Voir tous nos plans tarifaires' : '💰 View all pricing plans'}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {isFr
                ? 'Agriculteur gratuit · Producer Pro $29.99/mois · Coopérative $199/an'
                : 'Farmer free · Producer Pro $29.99/mo · Cooperative $199/year'}
            </p>
          </div>
          <Link to="/pricing">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold whitespace-nowrap"
            >
              {isFr ? 'Voir les tarifs' : 'View Pricing'}
            </button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-xl border border-white/15 px-3 py-2.5 text-sm bg-white/5 text-white outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="" className="text-black">
              {isFr ? '🌍 Tous les pays' : '🌍 All countries'}
            </option>
            {platformCountries.map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl h-28 bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {statCards.map(({ icon, value, label, sub, color, bg, border }) => (
              <div
                key={label}
                className={`rounded-2xl p-5 bg-gradient-to-br ${bg} border ${border}`}
              >
                <span className="text-2xl">{icon}</span>
                <p className="text-3xl font-bold font-mono mt-2" style={{ color }}>
                  {value}
                </p>
                <p className="text-white/70 text-sm mt-0.5">{label}</p>
                <p className="text-white/40 text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className={darkCard}>
          <h3 className="font-bold text-white mb-5 text-lg">
            🔗 {isFr ? "Flux de l'écosystème" : 'Ecosystem Flow'}
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            {[
              {
                icon: '👩‍🌾',
                label: isFr ? 'Agriculteurs' : 'Farmers',
                count: farmerStats?.total || 0,
                color: '#4CAF50',
                desc: isFr ? 'Produisent les cultures' : 'Produce the crops',
                link: null,
              },
              { arrow: true },
              {
                icon: '🤝',
                label: isFr ? 'Coopératives' : 'Cooperatives',
                count: coopStats?.total || 0,
                color: '#B5850A',
                desc: isFr ? 'Agrègent et certifient' : 'Aggregate and certify',
                link: '/cooperatives',
              },
              { arrow: true },
              {
                icon: '🏭',
                label: isFr ? 'Transformateurs' : 'Processors',
                count: processorStats?.total || 0,
                color: '#3b82f6',
                desc: isFr ? 'Transforment en produits' : 'Transform into products',
                link: null,
              },
              { arrow: true },
              {
                icon: '🌍',
                label: 'AfriYield Exchange',
                count: null,
                color: '#1D9E75',
                desc: isFr ? 'Marchés internationaux' : 'International markets',
                link: '/afri-yield',
              },
            ].map((item, i2) =>
              item.arrow ? (
                <div key={i2} className="text-white/20 text-2xl font-bold hidden sm:block">
                  →
                </div>
              ) : (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center p-4 rounded-2xl border flex-1"
                  style={{ borderColor: `${item.color}30`, background: `${item.color}08` }}
                >
                  <span className="text-3xl mb-2">{item.icon}</span>
                  {item.count !== null && (
                    <span className="text-2xl font-bold font-mono" style={{ color: item.color }}>
                      {item.count}
                    </span>
                  )}
                  <p className="font-semibold text-sm" style={{ color: item.color }}>
                    {item.label}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{item.desc}</p>
                  {item.link && (
                    <Link
                      to={item.link}
                      className="text-xs font-semibold mt-2 hover:underline"
                      style={{ color: item.color }}
                    >
                      {isFr ? 'Voir →' : 'View →'}
                    </Link>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-2xl overflow-x-auto border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-max py-2.5 px-3 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-5">
            <div className={darkCard.replace('p-6', 'p-5')}>
              <h3 className="font-bold text-white mb-4">
                🌾 {isFr ? 'Cultures principales' : 'Main Crops'}
              </h3>
              {(farmerStats?.byCrop || []).length === 0 ? (
                <p className="text-white/40 text-sm">{isFr ? 'Aucune donnée.' : 'No data yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {(farmerStats?.byCrop || []).map(({ _id: crop, count }) => {
                    const max = farmerStats.byCrop[0]?.count || 1;
                    return (
                      <div key={crop}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/70">
                            {CROP_EMOJIS[crop] || '🌾'} {crop}
                          </span>
                          <span className="font-semibold text-green-400">{count}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-green-500/70 transition-all"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={darkCard.replace('p-6', 'p-5')}>
              <h3 className="font-bold text-white mb-4">
                🌍 {isFr ? 'Répartition par pays' : 'Distribution by Country'}
              </h3>
              {(farmerStats?.byCountry || []).length === 0 ? (
                <p className="text-white/40 text-sm">{isFr ? 'Aucune donnée.' : 'No data yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {(farmerStats?.byCountry || []).map(({ _id: country, count }) => (
                    <div
                      key={country}
                      className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
                    >
                      <span className="text-sm text-white/70">{country || 'Unknown'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-white/10 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-amber-500/70"
                            style={{
                              width: `${(count / (farmerStats?.byCountry[0]?.count || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-amber-400 w-5 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={darkCard.replace('p-6', 'p-5')}>
              <h3 className="font-bold text-white mb-4">
                📊 {isFr ? 'Résumé plateforme' : 'Platform Summary'}
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: isFr ? 'Agriculteurs actifs' : 'Active farmers',
                    value: farmerStats?.active || 0,
                    color: '#4CAF50',
                  },
                  {
                    label: isFr ? 'Coopératives actives' : 'Active cooperatives',
                    value: coopStats?.active || 0,
                    color: '#B5850A',
                  },
                  {
                    label: isFr ? 'En attente paiement' : 'Awaiting payment',
                    value: coopStats?.pending || 0,
                    color: '#f59e0b',
                  },
                  {
                    label: isFr ? 'Processeurs certifiés' : 'Certified processors',
                    value: processorStats?.certified || 0,
                    color: '#3b82f6',
                  },
                  {
                    label: isFr ? 'Membres total coopératives' : 'Total cooperative members',
                    value: coopStats?.totalMembers || 0,
                    color: '#1D9E75',
                  },
                  {
                    label: isFr ? 'Superficie totale (ha)' : 'Total area (ha)',
                    value: `${(farmerStats?.totalArea || 0).toFixed(1)}`,
                    color: '#9C27B0',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-white/50">{label}</span>
                    <span className="font-bold font-mono text-lg" style={{ color }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link
                  to="/afri-yield/opportunities"
                  className="block w-full text-center py-2.5 rounded-xl font-bold text-black text-sm bg-amber-500 hover:bg-amber-400 transition"
                >
                  AfriYield Exchange →
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'farmers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl font-bold text-white">
                👩‍🌾 {isFr ? 'Agriculteurs enregistrés' : 'Registered Farmers'}
              </h3>
              <Link
                to="/inscription"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-semibold bg-green-500/90 hover:bg-green-500 transition"
              >
                + {isFr ? 'Enregistrer' : 'Register'}
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-white/50">
                {isFr ? 'Chargement...' : 'Loading...'}
              </div>
            ) : filteredFarmers.length === 0 ? (
              <div className={`text-center py-14 ${darkCard}`}>
                <div className="text-6xl mb-3">👩‍🌾</div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {isFr ? 'Aucun agriculteur enregistré' : 'No farmers registered yet'}
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  {isFr
                    ? 'Les agriculteurs enregistrés apparaîtront ici.'
                    : 'Registered farmers will appear here.'}
                </p>
                <Link
                  to="/inscription"
                  className="inline-block px-5 py-2.5 rounded-xl font-bold text-black text-sm bg-green-500"
                >
                  + {isFr ? 'Enregistrer le premier agriculteur' : 'Register first farmer'}
                </Link>
              </div>
            ) : (
              <div className={`overflow-hidden ${darkCard} p-0`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        {[
                          isFr ? 'Nom' : 'Name',
                          isFr ? 'Cultures' : 'Crops',
                          isFr ? 'Superficie' : 'Area',
                          isFr ? 'Région' : 'Region',
                          isFr ? 'Coopérative' : 'Cooperative',
                          isFr ? 'Statut' : 'Status',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFarmers.map((farmer, i3) => (
                        <tr
                          key={farmer._id || i3}
                          className="border-b border-white/5 hover:bg-white/5 transition"
                        >
                          <td className="px-4 py-3 font-medium text-white">
                            {farmer.nom || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(farmer.cultures)
                                ? farmer.cultures
                                : [farmer.cultures]
                              )
                                .filter(Boolean)
                                .slice(0, 3)
                                .map((c) => (
                                  <span
                                    key={c}
                                    className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400"
                                  >
                                    {CROP_EMOJIS[c] || '🌾'} {c}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-white/70">
                            {farmer.superficie ? `${farmer.superficie} ha` : '—'}
                          </td>
                          <td className="px-4 py-3 text-white/60 text-xs">
                            {farmer.region || '—'}
                            {farmer.country ? ` · ${farmer.country}` : ''}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {farmer.nomCooperative || farmer.lienCooperative === 'oui' ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                                🤝 {farmer.nomCooperative || (isFr ? 'Membre' : 'Member')}
                              </span>
                            ) : (
                              <span className="text-white/30">
                                {isFr ? 'Indépendant' : 'Independent'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                farmer.statut === 'Actif' || farmer.statut === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {farmer.statut === 'Actif'
                                ? isFr
                                  ? 'Actif'
                                  : 'Active'
                                : farmer.statut || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-white/5 border-t border-white/10 text-xs text-white/40">
                  {filteredFarmers.length}{' '}
                  {isFr ? 'agriculteur(s) affiché(s)' : 'farmer(s) shown'}
                  {countryFilter && ` · ${countryFilter}`}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cooperatives' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl font-bold text-white">
                🤝 {isFr ? 'Coopératives enregistrées' : 'Registered Cooperatives'}
              </h3>
              <Link
                to="/cooperative-registration"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-semibold"
                style={{ background: '#B5850A' }}
              >
                + {isFr ? 'Inscrire' : 'Register'}
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-white/50">
                {isFr ? 'Chargement...' : 'Loading...'}
              </div>
            ) : filteredCoops.length === 0 ? (
              <div className={`text-center py-14 ${darkCard}`}>
                <div className="text-6xl mb-3">🤝</div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {isFr ? 'Aucune coopérative enregistrée' : 'No cooperatives registered yet'}
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  {isFr
                    ? 'Les coopératives enregistrées apparaîtront ici.'
                    : 'Registered cooperatives will appear here.'}
                </p>
                <Link
                  to="/cooperative-registration"
                  className="inline-block px-5 py-2.5 rounded-xl font-bold text-black text-sm"
                  style={{ background: '#B5850A' }}
                >
                  {isFr ? 'Inscrire ma coopérative' : 'Register my cooperative'}
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCoops.map((coop) => (
                  <div
                    key={coop._id || coop.cooperativeName}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-900/20 to-amber-950/30 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {coop.cooperativeName || coop.name || coop.nomCooperative}
                        </p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {coop.country || '—'} · {coop.memberCount || 0}
                          {isFr ? ' membres' : ' members'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        {coop.certificationStatus || 'Local'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(coop.primaryCrops || []).slice(0, 3).map((crop) => (
                        <span
                          key={crop}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                        >
                          {crop}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => loadCoopDetail(coop)}
                      className="w-full py-2 rounded-xl text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: 'rgba(181,133,10,0.15)',
                        color: '#B5850A',
                        border: '1px solid rgba(181,133,10,0.3)',
                      }}
                    >
                      {isFr ? 'Voir les détails →' : 'View Details →'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'processors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl font-bold text-white">
                🏭 {isFr ? 'Centres de transformation' : 'Transformation Centers'}
              </h3>
              <Link
                to="/transformation-registration"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
                style={{
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  backgroundColor: 'rgba(59,130,246,0.08)',
                }}
              >
                + {isFr ? 'Enregistrer' : 'Register'}
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-white/50">
                {isFr ? 'Chargement...' : 'Loading...'}
              </div>
            ) : filteredProcessors.length === 0 ? (
              <div className={`text-center py-14 ${darkCard}`}>
                <div className="text-6xl mb-3">🏭</div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {isFr ? 'Aucun transformateur enregistré' : 'No processors registered yet'}
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  {isFr
                    ? 'Les centres de transformation apparaîtront ici.'
                    : 'Transformation centers will appear here.'}
                </p>
                <Link
                  to="/transformation-registration"
                  className="inline-block px-5 py-2.5 rounded-xl font-bold text-sm border border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                >
                  {isFr ? 'Enregistrer un centre' : 'Register a center'}
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProcessors.map((p, i5) => (
                  <div
                    key={p._id || i5}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900/20 to-blue-950/30 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-white">{p.nom}</p>
                        <p className="text-xs text-white/50 mt-0.5">
                          🌍 {p.region}, {p.country}
                        </p>
                      </div>
                      {p.certifie && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                          ⭐ {isFr ? 'Certifié' : 'Certified'}
                        </span>
                      )}
                    </div>
                    {(p.produitsTransformes || p.typesProduits) && (
                      <div className="flex flex-wrap gap-1">
                        {(
                          Array.isArray(p.produitsTransformes || p.typesProduits)
                            ? p.produitsTransformes || p.typesProduits
                            : [p.produitsTransformes || p.typesProduits]
                        )
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((type) => (
                            <span
                              key={type}
                              className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300"
                            >
                              {type}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {selectedCoop && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedCoop(null);
            setCoopDetail(null);
          }}
          role="presentation"
        >
          <div
            className="bg-[#0a1f10] rounded-2xl border border-white/15 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">
                🤝 {isFr ? 'Détails coopérative' : 'Cooperative Details'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedCoop(null);
                  setCoopDetail(null);
                }}
                className="text-white/40 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            {coopDetailLoading ? (
              <div className="text-center py-8 text-white/50">
                {isFr ? 'Chargement...' : 'Loading...'}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  [isFr ? 'Nom' : 'Name', coopDetail?.cooperativeName || selectedCoop.cooperativeName],
                  [isFr ? 'Pays' : 'Country', coopDetail?.country || selectedCoop.country],
                  [
                    isFr ? 'Région' : 'Region',
                    coopDetail?.regionCity || selectedCoop.regionCity || selectedCoop.region,
                  ],
                  [isFr ? 'Responsable' : 'Leader', coopDetail?.leaderName || selectedCoop.leaderName],
                  [
                    isFr ? 'Membres' : 'Members',
                    `${coopDetail?.memberCount ?? selectedCoop.memberCount ?? 0}`,
                  ],
                  [
                    isFr ? 'Cultures' : 'Crops',
                    (coopDetail?.primaryCrops || selectedCoop.primaryCrops || []).join(', ') ||
                      '—',
                  ],
                  [
                    isFr ? 'Certification' : 'Certification',
                    coopDetail?.certificationStatus || selectedCoop.certificationStatus,
                  ],
                  [isFr ? 'Email' : 'Email', coopDetail?.email || selectedCoop.email],
                  [isFr ? 'Téléphone' : 'Phone', coopDetail?.phone || selectedCoop.phone],
                ]
                  .filter(([, v]) => v && v !== '—' && v !== 'undefined' && String(v).trim() !== '')
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between text-sm border-b border-white/5 pb-2 gap-4"
                    >
                      <span className="text-white/50 shrink-0">{label}</span>
                      <span className="text-white font-medium text-right max-w-xs">{value}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
