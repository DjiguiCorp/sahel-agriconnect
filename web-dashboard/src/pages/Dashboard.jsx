import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import ProcessorRegistration from '../components/ProcessorRegistration';
import Modal from '../components/Modal';
import { API_ENDPOINTS } from '../config/api';

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

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [activeTab, setActiveTab] = useState('overview');
  const [farmerStats, setFarmerStats] = useState(null);
  const [coopStats, setCoopStats] = useState(null);
  const [processorStats, setProcessorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessorModalOpen, setIsProcessorModalOpen] = useState(false);

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

  const filteredFarmers = farmerStats?.recent?.filter((f) => !countryFilter || f.country === countryFilter) || [];
  const filteredCoops = coopStats?.recent?.filter((c) => !countryFilter || c.country === countryFilter) || [];
  const filteredProcessors =
    processorStats?.recent?.filter((p) => !countryFilter || p.country === countryFilter) || [];

  const allCountries = [
    ...new Set(
      [
        ...(farmerStats?.byCountry || []).map((c) => c._id),
        ...(coopStats?.byCountry || []).map((c) => c._id),
        ...(processorStats?.byCountry || []).map((c) => c._id),
      ].filter(Boolean)
    ),
  ].sort();

  const tabs = [
    { key: 'overview', label: isFr ? "🌍 Vue d'ensemble" : '🌍 Overview' },
    { key: 'farmers', label: isFr ? `👩‍🌾 Agriculteurs (${farmerStats?.total || 0})` : `👩‍🌾 Farmers (${farmerStats?.total || 0})` },
    { key: 'cooperatives', label: isFr ? `🤝 Coopératives (${coopStats?.total || 0})` : `🤝 Cooperatives (${coopStats?.total || 0})` },
    { key: 'processors', label: isFr ? `⚙️ Processeurs (${processorStats?.total || 0})` : `⚙️ Processors (${processorStats?.total || 0})` },
  ];

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 100%)' }} className="text-white">
        <div className="section-container py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {isFr ? 'Tableau de bord — Écosystème agricole' : 'Dashboard — Agricultural Ecosystem'}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            {isFr
              ? "Vue d'ensemble en temps réel des agriculteurs, coopératives et centres de transformation enregistrés sur la plateforme."
              : 'Real-time overview of farmers, cooperatives, and transformation centers registered on the platform.'}
          </p>
        </div>
      </section>

      <section className="section-container py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: '#1a3c2e' }}
            >
              + {isFr ? 'Enregistrer un agriculteur' : 'Register a farmer'}
            </button>
            <button
              onClick={() => setIsProcessorModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition"
            >
              + {isFr ? 'Enregistrer un processeur' : 'Register a processor'}
            </button>
            <Link
              to="/cooperative-registration"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-[#B5850A] text-[#B5850A] hover:bg-[#B5850A]/5 transition"
            >
              + {isFr ? 'Inscrire une coopérative' : 'Register a cooperative'}
            </Link>
          </div>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
          >
            <option value="">{isFr ? '🌍 Tous les pays' : '🌍 All countries'}</option>
            {allCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl h-24 bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '👩‍🌾', value: farmerStats?.total || 0, label: isFr ? 'Agriculteurs' : 'Farmers', sub: `${farmerStats?.active || 0} ${isFr ? 'actifs' : 'active'}`, gradient: 'from-[#1a3c2e] to-[#2d5a3d]' },
              { icon: '🤝', value: coopStats?.total || 0, label: isFr ? 'Coopératives' : 'Cooperatives', sub: `${coopStats?.active || 0} ${isFr ? 'actives' : 'active'}`, gradient: 'from-[#B5850A] to-[#9a7109]' },
              { icon: '⚙️', value: processorStats?.total || 0, label: isFr ? 'Processeurs' : 'Processors', sub: `${processorStats?.certified || 0} ${isFr ? 'certifiés' : 'certified'}`, gradient: 'from-[#3b82f6] to-[#2563eb]' },
              { icon: '🌾', value: `${(farmerStats?.totalArea || 0).toFixed(0)} ha`, label: isFr ? 'Superficie totale' : 'Total Area', sub: isFr ? 'terres agricoles' : 'farmland', gradient: 'from-[#059669] to-[#047857]' },
            ].map(({ icon, value, label, sub, gradient }) => (
              <div key={label} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${gradient}`}>
                <span className="text-2xl">{icon}</span>
                <p className="text-3xl font-bold font-mono mt-2">{value}</p>
                <p className="text-white/80 text-sm mt-0.5">{label}</p>
                <p className="text-white/50 text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-[#1a3c2e] mb-5 text-lg">🔗 {isFr ? "Flux de l'écosystème" : 'Ecosystem Flow'}</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            {[
              { icon: '👩‍🌾', label: isFr ? 'Agriculteurs' : 'Farmers', count: farmerStats?.total || 0, color: '#1a3c2e', desc: isFr ? 'Produisent les cultures' : 'Produce the crops', link: null },
              { arrow: true },
              { icon: '🤝', label: isFr ? 'Coopératives' : 'Cooperatives', count: coopStats?.total || 0, color: '#B5850A', desc: isFr ? 'Agrègent et certifient' : 'Aggregate and certify', link: '/cooperatives' },
              { arrow: true },
              { icon: '⚙️', label: isFr ? 'Processeurs' : 'Processors', count: processorStats?.total || 0, color: '#3b82f6', desc: isFr ? 'Transforment en produits' : 'Transform into products', link: null },
              { arrow: true },
              { icon: '🌍', label: 'AfriYield Exchange', count: null, color: '#059669', desc: isFr ? 'Marchés internationaux' : 'International markets', link: '/afri-yield' },
            ].map((item, i2) =>
              item.arrow ? (
                <div key={i2} className="text-gray-300 text-2xl font-bold hidden sm:block">→</div>
              ) : (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center p-4 rounded-2xl border-2 flex-1"
                  style={{ borderColor: item.color + '30', background: item.color + '08' }}
                >
                  <span className="text-3xl mb-2">{item.icon}</span>
                  {item.count !== null && (
                    <span className="text-2xl font-bold font-mono" style={{ color: item.color }}>{item.count}</span>
                  )}
                  <p className="font-semibold text-sm" style={{ color: item.color }}>{item.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
                  {item.link && (
                    <Link to={item.link} className="text-xs font-semibold mt-2 hover:underline" style={{ color: item.color }}>
                      {isFr ? 'Voir →' : 'View →'}
                    </Link>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-max py-2.5 px-3 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.key ? 'bg-white text-[#1a3c2e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-[#1a3c2e] mb-4">🌾 {isFr ? 'Cultures principales' : 'Main Crops'}</h3>
              {(farmerStats?.byCrop || []).length === 0 ? (
                <p className="text-gray-400 text-sm">{isFr ? 'Aucune donnée.' : 'No data yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {(farmerStats?.byCrop || []).map(({ _id: crop, count }) => {
                    const max = farmerStats.byCrop[0]?.count || 1;
                    return (
                      <div key={crop}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{CROP_EMOJIS[crop] || '🌾'} {crop}</span>
                          <span className="font-semibold text-[#1a3c2e]">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-[#1a3c2e] transition-all" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-[#1a3c2e] mb-4">🌍 {isFr ? 'Répartition par pays' : 'Distribution by Country'}</h3>
              {(farmerStats?.byCountry || []).length === 0 ? (
                <p className="text-gray-400 text-sm">{isFr ? 'Aucune donnée.' : 'No data yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {(farmerStats?.byCountry || []).map(({ _id: country, count }) => (
                    <div key={country} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{country || 'Unknown'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-[#B5850A]" style={{ width: `${(count / (farmerStats?.byCountry[0]?.count || 1)) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[#1a3c2e] w-5 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-[#1a3c2e] mb-4">📊 {isFr ? 'Résumé plateforme' : 'Platform Summary'}</h3>
              <div className="space-y-3">
                {[
                  { label: isFr ? 'Agriculteurs actifs' : 'Active farmers', value: farmerStats?.active || 0, color: '#1a3c2e' },
                  { label: isFr ? 'Coopératives actives' : 'Active cooperatives', value: coopStats?.active || 0, color: '#B5850A' },
                  { label: isFr ? 'En attente paiement' : 'Awaiting payment', value: coopStats?.pending || 0, color: '#f59e0b' },
                  { label: isFr ? 'Processeurs certifiés' : 'Certified processors', value: processorStats?.certified || 0, color: '#3b82f6' },
                  { label: isFr ? 'Membres total coopératives' : 'Total cooperative members', value: coopStats?.totalMembers || 0, color: '#059669' },
                  { label: isFr ? 'Superficie totale (ha)' : 'Total area (ha)', value: `${(farmerStats?.totalArea || 0).toFixed(1)}`, color: '#6d28d9' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="font-bold font-mono text-lg" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/afri-yield/opportunities" className="block w-full text-center py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: '#B5850A' }}>
                  AfriYield Exchange →
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'farmers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1a3c2e]">👩‍🌾 {isFr ? 'Agriculteurs enregistrés' : 'Registered Farmers'}</h3>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: '#1a3c2e' }}>
                + {isFr ? 'Enregistrer' : 'Register'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</div>
            ) : filteredFarmers.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                <div className="text-6xl mb-3">👩‍🌾</div>
                <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{isFr ? 'Aucun agriculteur enregistré' : 'No farmers registered yet'}</h3>
                <p className="text-gray-500 text-sm mb-4">{isFr ? 'Les agriculteurs enregistrés apparaîtront ici.' : 'Registered farmers will appear here.'}</p>
                <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: '#1a3c2e' }}>
                  + {isFr ? 'Enregistrer le premier agriculteur' : 'Register first farmer'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {[isFr ? 'Nom' : 'Name', isFr ? 'Cultures' : 'Crops', isFr ? 'Superficie' : 'Area', isFr ? 'Région' : 'Region', isFr ? 'Coopérative' : 'Cooperative', isFr ? 'Statut' : 'Status'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFarmers.map((farmer, i3) => (
                        <tr key={farmer._id || i3} className={`${i3 % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-[#1a3c2e]/5 transition`}>
                          <td className="px-4 py-3 font-medium text-[#1a3c2e]">{farmer.nom || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(farmer.cultures) ? farmer.cultures : [farmer.cultures]).filter(Boolean).slice(0, 3).map((c) => (
                                <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-[#1a3c2e]/8 text-[#1a3c2e]">
                                  {CROP_EMOJIS[c] || '🌾'} {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-700">{farmer.superficie ? `${farmer.superficie} ha` : '—'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{farmer.region || '—'}</td>
                          <td className="px-4 py-3 text-xs">
                            {farmer.nomCooperative || farmer.lienCooperative === 'oui' ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#B5850A]/10 text-[#B5850A] font-medium">
                                🤝 {farmer.nomCooperative || (isFr ? 'Membre' : 'Member')}
                              </span>
                            ) : (
                              <span className="text-gray-300">{isFr ? 'Indépendant' : 'Independent'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${farmer.statut === 'Actif' || farmer.statut === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {farmer.statut === 'Actif' ? (isFr ? 'Actif' : 'Active') : (farmer.statut || 'Pending')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                  {filteredFarmers.length} {isFr ? 'agriculteur(s) affiché(s)' : 'farmer(s) shown'}{countryFilter && ` · ${countryFilter}`}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cooperatives' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1a3c2e]">🤝 {isFr ? 'Coopératives actives' : 'Active Cooperatives'}</h3>
              <Link to="/cooperative-registration" className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: '#B5850A' }}>
                + {isFr ? 'Inscrire' : 'Register'}
              </Link>
            </div>

            {filteredCoops.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                <div className="text-6xl mb-3">🤝</div>
                <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{isFr ? 'Aucune coopérative active' : 'No active cooperatives yet'}</h3>
                <p className="text-gray-500 text-sm mb-4">{isFr ? 'Les coopératives actives (paiement confirmé) apparaîtront ici.' : 'Active cooperatives (payment confirmed) will appear here.'}</p>
                <Link to="/cooperative-registration" className="px-5 py-2.5 rounded-xl font-bold text-white text-sm inline-block" style={{ background: '#B5850A' }}>
                  {isFr ? 'Inscrire ma coopérative' : 'Register my cooperative'}
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCoops.map((coop, i4) => (
                  <div key={coop._id || i4} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-[#1a3c2e]">{coop.cooperativeName || coop.nomCooperative}</p>
                        <p className="text-xs text-gray-500 mt-0.5">🌍 {coop.regionCity || coop.region}{coop.regionCity ? ', ' : ''}{coop.country}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">✓ {isFr ? 'Active' : 'Active'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="font-bold text-[#1a3c2e] font-mono">{coop.memberCount || 0}</p>
                        <p className="text-xs text-gray-400">{isFr ? 'membres' : 'members'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-[#B5850A]">{coop.certificationStatus || 'None'}</p>
                        <p className="text-xs text-gray-400">{isFr ? 'certification' : 'certification'}</p>
                      </div>
                    </div>
                    {(coop.primaryCrops || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {coop.primaryCrops.slice(0, 3).map((crop) => (
                          <span key={crop} className="text-xs px-2 py-0.5 rounded-full bg-[#1a3c2e]/8 text-[#1a3c2e]">
                            {CROP_EMOJIS[crop] || '🌾'} {crop}
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

        {activeTab === 'processors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1a3c2e]">⚙️ {isFr ? 'Centres de transformation' : 'Transformation Centers'}</h3>
              <button onClick={() => setIsProcessorModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: '#3b82f6' }}>
                + {isFr ? 'Enregistrer' : 'Register'}
              </button>
            </div>

            {filteredProcessors.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                <div className="text-6xl mb-3">⚙️</div>
                <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{isFr ? 'Aucun processeur enregistré' : 'No processors registered yet'}</h3>
                <p className="text-gray-500 text-sm mb-4">{isFr ? 'Les centres de transformation apparaîtront ici.' : 'Transformation centers will appear here.'}</p>
                <button onClick={() => setIsProcessorModalOpen(true)} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: '#3b82f6' }}>
                  {isFr ? 'Enregistrer un centre' : 'Register a center'}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProcessors.map((p, i5) => (
                  <div key={p._id || i5} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-[#1a3c2e]">{p.nom}</p>
                        <p className="text-xs text-gray-500 mt-0.5">🌍 {p.region}, {p.country}</p>
                      </div>
                      {p.certifie && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">⭐ {isFr ? 'Certifié' : 'Certified'}</span>
                      )}
                    </div>
                    {p.typesProduits && (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(p.typesProduits) ? p.typesProduits : [p.typesProduits]).slice(0, 3).map((type) => (
                          <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{type}</span>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isFr ? 'Enregistrer un agriculteur' : 'Register a farmer'}>
        <FarmerRegistrationForm onFarmerAdded={() => { setIsModalOpen(false); window.location.reload(); }} />
      </Modal>
      <Modal isOpen={isProcessorModalOpen} onClose={() => setIsProcessorModalOpen(false)} title={isFr ? 'Enregistrer un processeur' : 'Register a processor'}>
        <ProcessorRegistration onProcessorAdded={() => { setIsProcessorModalOpen(false); window.location.reload(); }} />
      </Modal>
    </div>
  );
}

