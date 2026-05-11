import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Send, Plus, Search, Loader2, Check, X } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const PROJECT_TYPES = [
  { key: 'crop_program', en: 'Crop Production Program', fr: 'Programme de production agricole', emoji: '🌾' },
  { key: 'training', en: 'Training Initiative', fr: 'Initiative de formation', emoji: '📚' },
  { key: 'export_liaison', en: 'Export Liaison Program', fr: 'Programme liaison export', emoji: '🌍' },
  { key: 'diaspora_initiative', en: 'Diaspora Engagement Initiative', fr: 'Initiative diaspora', emoji: '💰' },
  { key: 'off_season', en: 'Off-Season Production', fr: 'Production hors-saison', emoji: '☀️' },
  { key: 'certification_push', en: 'National Certification Push', fr: 'Campagne de certification', emoji: '⭐' },
  { key: 'business_development', en: 'Business Development', fr: 'Développement des affaires', emoji: '📈' },
  { key: 'food_security', en: 'Food Security Program', fr: 'Programme de sécurité alimentaire', emoji: '🍽' },
  { key: 'other', en: 'Other Initiative', fr: 'Autre initiative', emoji: '📋' },
];

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

function LoginScreen({ onLogin, isFr }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const orgTypeHint = urlParams.get('type') || 'government';

  const portalLabels = {
    government: { en: 'Government Portal', fr: 'Portail Gouvernemental', emoji: '🏛️' },
    ngo: { en: 'NGO / Partner Portal', fr: 'Portail ONG / Partenaire', emoji: '🤝' },
    enterprise: { en: 'Enterprise Portal', fr: 'Portail Entreprise', emoji: '🏢' },
  };
  const label = portalLabels[orgTypeHint] || portalLabels.government;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/government/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Login failed');
      localStorage.setItem('gov_token', d.token);
      localStorage.setItem('gov_admin', JSON.stringify(d.admin));
      onLogin(d.token, d.admin);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #143326 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden">
            <img src="/sahel-logo.png" alt="Sahel AgriConnect" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sahel AgriConnect</h1>
          <p className="text-white/50 text-sm mt-1">
            {label.emoji} {isFr ? label.fr : label.en}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="font-bold text-[#1a3c2e] text-lg mb-5 text-center">
            {isFr ? 'Connexion admin pays' : 'Country admin login'}
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFr ? 'Email officiel' : 'Official email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Mot de passe' : 'Password'}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
              />
            </div>
            {error && <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 font-bold text-white text-sm disabled:opacity-50"
              style={{ background: '#1a3c2e' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isFr ? 'Connexion...' : 'Logging in...'}
                </span>
              ) : isFr ? (
                'Se connecter'
              ) : (
                'Log in'
              )}
            </button>
          </form>
          <div className="mt-6 bg-[#1a3c2e]/5 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-xs text-center mb-3">
              {isFr
                ? 'Première connexion? Votre mot de passe vous a été envoyé par notre équipe.'
                : 'First time? Your password was sent by our team.'}
            </p>
            <div className="flex gap-2">
              <Link
                to="/platform-licensing?type=government"
                className="flex-1 text-center py-2 rounded-lg text-xs font-semibold text-[#1a3c2e]/70 hover:text-[#1a3c2e] border border-gray-200 hover:border-[#1a3c2e]/30 transition"
              >
                🏛️ {isFr ? 'Demander accès gouvernemental' : 'Request gov access'}
              </Link>
              <Link
                to="/platform-licensing?type=ngo"
                className="flex-1 text-center py-2 rounded-lg text-xs font-semibold text-[#1a3c2e]/70 hover:text-[#1a3c2e] border border-gray-200 hover:border-[#1a3c2e]/30 transition"
              >
                🤝 {isFr ? 'Demander accès ONG' : 'Request NGO access'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GovernmentPortal() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [token, setToken] = useState(() => localStorage.getItem('gov_token'));
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gov_admin'));
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [processors, setProcessors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    titleFr: '',
    description: '',
    descriptionFr: '',
    projectType: 'crop_program',
    targetAudience: ['farmers'],
    targetCommodities: [],
    season: 'both',
    priority: 'medium',
    incentives: '',
    requirements: '',
    partnerCountries: [],
    externalPartner: '',
  });
  const [broadcasting, setBroadcasting] = useState(null);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const handleLogin = (t, a) => {
    setToken(t);
    setAdmin(a);
  };
  const handleLogout = () => {
    localStorage.removeItem('gov_token');
    localStorage.removeItem('gov_admin');
    setToken(null);
    setAdmin(null);
  };

  useEffect(() => {
    if (!token || !admin) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const r = await fetch(`${API}/api/government/dashboard`, { headers });
        const d = await r.json();
        if (d.success) setStats(d.stats);
      } else if (activeTab === 'farmers') {
        const r = await fetch(`${API}/api/government/farmers?limit=100`, { headers });
        const d = await r.json();
        if (d.success) setFarmers(d.farmers);
      } else if (activeTab === 'cooperatives') {
        const r = await fetch(`${API}/api/government/cooperatives`, { headers });
        const d = await r.json();
        if (d.success) setCooperatives(d.cooperatives);
      } else if (activeTab === 'processors') {
        const r = await fetch(`${API}/api/government/processors`, { headers });
        const d = await r.json();
        if (d.success) setProcessors(d.processors);
      } else if (activeTab === 'projects') {
        const r = await fetch(`${API}/api/government/projects`, { headers });
        const d = await r.json();
        if (d.success) setProjects(d.projects);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  const createProject = async () => {
    try {
      const r = await fetch(`${API}/api/government/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(projectForm),
      });
      const d = await r.json();
      if (d.success) {
        setProjects((prev) => [d.project, ...prev]);
        setShowProjectForm(false);
        setProjectForm({
          title: '',
          titleFr: '',
          description: '',
          descriptionFr: '',
          projectType: 'crop_program',
          targetAudience: ['farmers'],
          targetCommodities: [],
          season: 'both',
          priority: 'medium',
          incentives: '',
          requirements: '',
          partnerCountries: [],
          externalPartner: '',
        });
      }
    } catch {
      /* ignore */
    }
  };

  const broadcastProject = async (projectId) => {
    setBroadcasting(projectId);
    setBroadcastResult(null);
    try {
      const r = await fetch(`${API}/api/government/projects/${projectId}/broadcast`, { method: 'POST', headers });
      const d = await r.json();
      setBroadcastResult({ projectId, count: d.broadcastCount, success: d.success });
      if (d.success) {
        setProjects((prev) =>
          prev.map((p) => (p._id === projectId ? { ...p, status: 'active', broadcastCount: d.broadcastCount } : p))
        );
      }
    } catch {
      setBroadcastResult({ projectId, success: false });
    }
    setBroadcasting(null);
  };

  if (!token || !admin) return <LoginScreen onLogin={handleLogin} isFr={isFr} />;

  const tabs = [
    { key: 'overview', label: isFr ? '🏠 Aperçu' : '🏠 Overview' },
    { key: 'farmers', label: isFr ? `👩‍🌾 Agriculteurs (${stats?.farmers ?? '—'})` : `👩‍🌾 Farmers (${stats?.farmers ?? '—'})` },
    {
      key: 'cooperatives',
      label: isFr ? `🤝 Coopératives (${stats?.cooperatives ?? '—'})` : `🤝 Cooperatives (${stats?.cooperatives ?? '—'})`,
    },
    {
      key: 'processors',
      label: isFr ? `⚙️ Processeurs (${stats?.processors ?? '—'})` : `⚙️ Processors (${stats?.processors ?? '—'})`,
    },
    { key: 'projects', label: isFr ? `📋 Projets (${stats?.projects ?? '—'})` : `📋 Projects (${stats?.projects ?? '—'})` },
  ];

  const orgTypeKey = admin.orgType || 'government';

  const bannerEmoji =
    { government: '🏛️', ngo: '🤝', enterprise: '🏢', international_org: '🌍' }[orgTypeKey] || '🏛️';

  const dashboardTitle =
    {
      government: isFr ? 'Tableau de bord national' : 'National Dashboard',
      ngo: isFr ? 'Tableau de bord ONG' : 'NGO Dashboard',
      enterprise: isFr ? 'Tableau de bord entreprise' : 'Enterprise Dashboard',
      international_org: isFr ? 'Tableau de bord organisation internationale' : 'International Organization Dashboard',
    }[orgTypeKey] || (isFr ? 'Tableau de bord' : 'Dashboard');

  const openProjectForm = (patch) => {
    setActiveTab('projects');
    setTimeout(() => {
      setShowProjectForm(true);
      if (patch) setProjectForm((f) => ({ ...f, ...patch }));
    }, 100);
  };

  const quickActions =
    orgTypeKey === 'ngo' || orgTypeKey === 'international_org'
      ? [
          {
            icon: '📚',
            label: isFr ? 'Lancer un programme de formation' : 'Launch training program',
            action: () => openProjectForm({ projectType: 'training' }),
          },
          {
            icon: '🤝',
            label: isFr ? 'Programme de partenariat coopératives' : 'Cooperative partnership program',
            action: () => openProjectForm({ projectType: 'crop_program' }),
          },
          {
            icon: '🌍',
            label: isFr ? 'Initiative de liaison export' : 'Export liaison initiative',
            action: () => openProjectForm({ projectType: 'export_liaison' }),
          },
          {
            icon: '💰',
            label: isFr ? 'Engagement investisseurs diaspora' : 'Diaspora investor engagement',
            action: () => openProjectForm({ projectType: 'diaspora_initiative', targetAudience: ['diaspora'] }),
          },
        ]
      : orgTypeKey === 'enterprise'
        ? [
            {
              icon: '🌾',
              label: isFr ? 'Sourcer des commodités' : 'Source commodities',
              action: () => openProjectForm({ projectType: 'crop_program' }),
            },
            {
              icon: '🤝',
              label: isFr ? 'Connecter avec coopératives' : 'Connect with cooperatives',
              action: () => openProjectForm({ projectType: 'export_liaison' }),
            },
            {
              icon: '⭐',
              label: isFr ? 'Programme de certification partenaires' : 'Partner certification program',
              action: () => openProjectForm({ projectType: 'certification_push' }),
            },
            {
              icon: '📈',
              label: isFr ? "Développement chaîne d'approvisionnement" : 'Supply chain development',
              action: () => openProjectForm({ projectType: 'business_development' }),
            },
          ]
        : [
            {
              icon: '🌾',
              label: isFr ? 'Lancer un programme agricole' : 'Launch crop program',
              action: () => openProjectForm(),
            },
            {
              icon: '📚',
              label: isFr ? 'Organiser une formation' : 'Organize training',
              action: () => openProjectForm({ projectType: 'training' }),
            },
            {
              icon: '🌍',
              label: isFr ? 'Liaison export pays' : 'Country export liaison',
              action: () => openProjectForm({ projectType: 'export_liaison' }),
            },
            {
              icon: '💰',
              label: isFr ? 'Engager la diaspora' : 'Engage diaspora',
              action: () => openProjectForm({ projectType: 'diaspora_initiative', targetAudience: ['diaspora'] }),
            },
          ];

  return (
    <div style={{ background: '#f8f4e3', minHeight: '100vh' }}>
      <div style={{ background: '#1a3c2e' }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/sahel-logo.png" alt="SA" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <p className="text-white font-bold text-sm">Sahel AgriConnect</p>
            <p className="text-white/50 text-xs">
              {isFr ? 'Portail' : 'Portal'} — {admin.country}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{admin.name}</p>
            <p className="text-white/50 text-xs">{admin.organization}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition text-xs"
          >
            <LogOut className="w-4 h-4" />
            {isFr ? 'Déconnexion' : 'Logout'}
          </button>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #B5850A, #9a7109)' }} className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {bannerEmoji} {dashboardTitle} — {admin.country}
            </h1>
            <p className="text-white/70 text-sm">
              {isFr ? "Vue d'ensemble des acteurs agricoles et projets nationaux" : 'Agricultural actors overview and national projects'}
            </p>
          </div>
          {stats && (
            <div className="flex gap-4 text-center">
              {[
                { val: stats.farmers, label: isFr ? 'Agriculteurs' : 'Farmers' },
                { val: stats.cooperatives, label: isFr ? 'Coopératives' : 'Cooperatives' },
                { val: stats.processors, label: isFr ? 'Processeurs' : 'Processors' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center hidden sm:block">
                  <p className="text-2xl font-bold text-white font-mono">{val}</p>
                  <p className="text-white/60 text-xs">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex overflow-x-auto gap-1 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                activeTab === tab.key ? 'bg-[#1a3c2e] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading && activeTab !== 'overview' && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e] mx-auto" />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  icon: '👩‍🌾',
                  label: isFr ? 'Agriculteurs enregistrés' : 'Registered Farmers',
                  value: stats?.farmers ?? '—',
                  color: 'bg-green-50',
                  textColor: 'text-green-700',
                  action: () => setActiveTab('farmers'),
                },
                {
                  icon: '🤝',
                  label: isFr ? 'Coopératives actives' : 'Active Cooperatives',
                  value: stats?.cooperatives ?? '—',
                  color: 'bg-[#B5850A]/10',
                  textColor: 'text-[#B5850A]',
                  action: () => setActiveTab('cooperatives'),
                },
                {
                  icon: '⚙️',
                  label: isFr ? 'Centres de transformation' : 'Transformation Centers',
                  value: stats?.processors ?? '—',
                  color: 'bg-blue-50',
                  textColor: 'text-blue-700',
                  action: () => setActiveTab('processors'),
                },
                {
                  icon: '📋',
                  label: isFr ? 'Projets nationaux' : 'National Projects',
                  value: stats?.projects ?? '—',
                  color: 'bg-purple-50',
                  textColor: 'text-purple-700',
                  action: () => setActiveTab('projects'),
                },
                {
                  icon: '🚀',
                  label: isFr ? 'Projets actifs' : 'Active Projects',
                  value: stats?.activeProjects ?? '—',
                  color: 'bg-[#1a3c2e]/8',
                  textColor: 'text-[#1a3c2e]',
                  action: () => setActiveTab('projects'),
                },
                {
                  icon: '📬',
                  label: isFr ? 'Réponses reçues' : 'Responses Received',
                  value: stats?.totalResponses ?? '—',
                  color: 'bg-orange-50',
                  textColor: 'text-orange-700',
                  action: () => setActiveTab('projects'),
                },
              ].map(({ icon, label, value, color, textColor, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`rounded-2xl p-5 text-left border border-transparent hover:border-[#1a3c2e]/20 transition ${color}`}
                >
                  <span className="text-2xl">{icon}</span>
                  <p className={`text-3xl font-bold font-mono mt-2 ${textColor}`}>{value}</p>
                  <p className="text-sm text-gray-500 mt-1">{label}</p>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-[#1a3c2e] text-lg mb-4">⚡ {isFr ? 'Actions rapides' : 'Quick Actions'}</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map(({ icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#1a3c2e]/20 hover:border-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition text-center"
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-semibold text-[#1a3c2e]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: '#1a3c2e', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-[#B5850A] font-bold text-sm mb-2">🔒 {isFr ? 'Souveraineté des données' : 'Data Sovereignty'}</p>
              <p className="text-white/70 text-sm leading-relaxed">
                {isFr
                  ? `En tant qu'administrateur de ${admin.country}, vous n'avez accès qu'aux données de votre territoire. Aucune donnée d'autres pays n'est accessible. Toutes vos actions (projets, notifications, exports) sont limitées à ${admin.country}. Pour héberger les données dans votre propre centre de données national, contactez info@djiguicorporation.org.`
                  : `As ${admin.country} administrator, you only have access to data from your territory. No data from other countries is accessible. All your actions (projects, notifications, exports) are scoped to ${admin.country}. To host data in your own national data center, contact info@djiguicorporation.org.`}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'farmers' && !loading && (
          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1a3c2e]">
                {isFr ? `Agriculteurs — ${admin.country}` : `Farmers — ${admin.country}`}
              </h2>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 bg-white">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isFr ? 'Rechercher...' : 'Search...'}
                  className="py-2 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {farmers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">👩‍🌾</p>
                  <p className="text-gray-500">
                    {isFr ? 'Aucun agriculteur enregistré dans votre pays.' : 'No farmers registered in your country.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        isFr ? 'Nom' : 'Name',
                        isFr ? 'Cultures' : 'Crops',
                        isFr ? 'Superficie' : 'Area',
                        isFr ? 'Région' : 'Region',
                        isFr ? 'Coopérative' : 'Cooperative',
                        isFr ? 'Statut' : 'Status',
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {farmers
                      .filter((f) => !searchQuery || f.nom?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((f, i) => (
                        <tr key={f._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 font-medium text-[#1a3c2e]">{f.nom || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {Array.isArray(f.cultures) ? f.cultures.join(', ') : f.cultures || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-600">{f.superficie ? `${f.superficie} ha` : '—'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{f.region || f.zone || '—'}</td>
                          <td className="px-4 py-3 text-xs">
                            {f.nomCooperative ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#B5850A]/10 text-[#B5850A] font-medium">
                                🤝 {f.nomCooperative}
                              </span>
                            ) : (
                              <span className="text-gray-300">{isFr ? 'Indépendant' : 'Independent'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                f.statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {f.statut || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cooperatives' && !loading && (
          <div className="mt-2 space-y-4">
            <h2 className="text-xl font-bold text-[#1a3c2e]">
              {isFr ? `Coopératives — ${admin.country}` : `Cooperatives — ${admin.country}`}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {cooperatives.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <p className="text-4xl mb-3">🤝</p>
                  <p className="text-gray-500">
                    {isFr ? 'Aucune coopérative enregistrée dans votre pays.' : 'No cooperatives registered in your country.'}
                  </p>
                </div>
              ) : (
                cooperatives.map((coop) => (
                  <div key={coop._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-[#1a3c2e]">{coop.cooperativeName || coop.nomCooperative}</p>
                        <p className="text-xs text-gray-500">
                          🌍 {coop.regionCity || coop.region} · {coop.memberCount || 0} {isFr ? 'membres' : 'members'}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          coop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {coop.status || 'pending'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(coop.primaryCrops || []).map((c) => (
                        <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-[#1a3c2e]/8 text-[#1a3c2e]">
                          🌾 {c}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={`mailto:${coop.email}?subject=Message officiel — ${admin.country}&body=Bonjour ${
                          coop.leaderName || coop.nomResponsable
                        },%0A%0A`}
                        className="flex-1 text-center py-2 rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
                        style={{ background: '#1a3c2e' }}
                      >
                        📧 {isFr ? 'Contacter' : 'Contact'}
                      </a>
                      <button
                        onClick={() => {
                          setActiveTab('projects');
                          setTimeout(() => setShowProjectForm(true), 100);
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition"
                      >
                        📋 {isFr ? 'Projet' : 'Project'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'processors' && !loading && (
          <div className="mt-2 space-y-4">
            <h2 className="text-xl font-bold text-[#1a3c2e]">
              {isFr ? `Centres de transformation — ${admin.country}` : `Transformation Centers — ${admin.country}`}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processors.length === 0 ? (
                <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <p className="text-4xl mb-3">⚙️</p>
                  <p className="text-gray-500">
                    {isFr ? 'Aucun processeur enregistré dans votre pays.' : 'No processors registered in your country.'}
                  </p>
                </div>
              ) : (
                processors.map((p) => (
                  <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="font-bold text-[#1a3c2e]">{p.nom}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      🌍 {p.region} · {p.certifie ? (isFr ? 'Certifié' : 'Certified') : ''}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(Array.isArray(p.typesProduits) ? p.typesProduits : [p.typesProduits])
                        .filter(Boolean)
                        .map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            ⚙️ {t}
                          </span>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1a3c2e]">{isFr ? 'Projets nationaux' : 'National Projects'}</h2>
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: '#1a3c2e' }}
              >
                <Plus className="w-4 h-4" />
                {isFr ? 'Nouveau projet' : 'New Project'}
              </button>
            </div>

            {broadcastResult && (
              <div
                className={`rounded-xl p-3 text-sm font-semibold ${
                  broadcastResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {broadcastResult.success
                  ? `✅ ${
                      isFr ? `Diffusion envoyée à ${broadcastResult.count} destinataires.` : `Broadcast sent to ${broadcastResult.count} recipients.`
                    }`
                  : isFr
                    ? '❌ Erreur lors de la diffusion. Réessayez.'
                    : '❌ Broadcast error. Please retry.'}
              </div>
            )}

            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e] mx-auto" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                <p className="text-5xl mb-3">📋</p>
                <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">{isFr ? 'Aucun projet national' : 'No national projects yet'}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {isFr
                    ? 'Créez votre premier projet pour engager les acteurs agricoles de votre pays.'
                    : 'Create your first project to engage agricultural actors in your country.'}
                </p>
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm"
                  style={{ background: '#1a3c2e' }}
                >
                  + {isFr ? 'Créer le premier projet' : 'Create first project'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((proj) => {
                  const pt = PROJECT_TYPES.find((t) => t.key === proj.projectType);
                  return (
                    <div key={proj._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">{pt?.emoji || '📋'}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-bold text-[#1a3c2e]">{isFr && proj.titleFr ? proj.titleFr : proj.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[proj.priority]}`}>{proj.priority}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  proj.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : proj.status === 'draft'
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {proj.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{isFr && proj.descriptionFr ? proj.descriptionFr : proj.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-[#1a3c2e] font-mono">{proj.responses?.length || 0}</p>
                          <p className="text-xs text-gray-400">{isFr ? 'réponses' : 'responses'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(proj.targetAudience || []).map((a) => (
                          <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-[#1a3c2e]/8 text-[#1a3c2e]">
                            {{ farmers: '👩‍🌾', cooperatives: '🤝', processors: '⚙️', diaspora: '💰', all: '🌍' }[a] || '📋'} {a}
                          </span>
                        ))}
                        {proj.broadcastCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            ✓ {isFr ? `Diffusé à ${proj.broadcastCount}` : `Sent to ${proj.broadcastCount}`}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {proj.status === 'draft' && (
                          <button
                            onClick={() => broadcastProject(proj._id)}
                            disabled={broadcasting === proj._id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                            style={{ background: '#B5850A' }}
                          >
                            {broadcasting === proj._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isFr ? 'Diffuser maintenant' : 'Broadcast now'}
                          </button>
                        )}
                        {proj.status === 'active' && (
                          <button
                            onClick={() => broadcastProject(proj._id)}
                            disabled={broadcasting === proj._id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition disabled:opacity-50"
                          >
                            {broadcasting === proj._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isFr ? 'Re-diffuser' : 'Re-broadcast'}
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const newStatus = proj.status === 'active' ? 'paused' : proj.status === 'paused' ? 'active' : proj.status;
                            await fetch(`${API}/api/government/projects/${proj._id}`, {
                              method: 'PUT',
                              headers,
                              body: JSON.stringify({ status: newStatus }),
                            });
                            setProjects((prev) => prev.map((p) => (p._id === proj._id ? { ...p, status: newStatus } : p)));
                          }}
                          className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                        >
                          {proj.status === 'active' ? (isFr ? 'Mettre en pause' : 'Pause') : proj.status === 'paused' ? (isFr ? 'Reprendre' : 'Resume') : ''}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#1a3c2e] text-xl">{isFr ? 'Nouveau projet national' : 'New National Project'}</h3>
              <button onClick={() => setShowProjectForm(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Titre (EN)' : 'Title (EN)'} *</label>
                  <input
                    value={projectForm.title}
                    onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre (FR)</label>
                  <input
                    value={projectForm.titleFr}
                    onChange={(e) => setProjectForm((f) => ({ ...f, titleFr: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Type de projet' : 'Project Type'}</label>
                  <select
                    value={projectForm.projectType}
                    onChange={(e) => setProjectForm((f) => ({ ...f, projectType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  >
                    {PROJECT_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.emoji} {isFr ? t.fr : t.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Priorité' : 'Priority'}</label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  >
                    <option value="low">{isFr ? 'Faible' : 'Low'}</option>
                    <option value="medium">{isFr ? 'Moyen' : 'Medium'}</option>
                    <option value="high">{isFr ? 'Élevé' : 'High'}</option>
                    <option value="urgent">{isFr ? '🚨 Urgent' : '🚨 Urgent'}</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isFr ? 'Cible' : 'Target audience'}</label>
                  <div className="flex flex-wrap gap-2">
                    {['farmers', 'cooperatives', 'processors', 'diaspora', 'all'].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          setProjectForm((f) => {
                            const s = new Set(f.targetAudience);
                            if (s.has(a)) s.delete(a);
                            else s.add(a);
                            return { ...f, targetAudience: Array.from(s) };
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          projectForm.targetAudience.includes(a)
                            ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a3c2e]/40'
                        }`}
                      >
                        {{ farmers: '👩‍🌾 Farmers', cooperatives: '🤝 Coops', processors: '⚙️ Processors', diaspora: '💰 Diaspora', all: '🌍 All' }[a]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Description (EN)' : 'Description (EN)'} *</label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
                  <textarea
                    value={projectForm.descriptionFr}
                    onChange={(e) => setProjectForm((f) => ({ ...f, descriptionFr: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Saison' : 'Season'}</label>
                  <select
                    value={projectForm.season}
                    onChange={(e) => setProjectForm((f) => ({ ...f, season: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  >
                    <option value="rainy">{isFr ? '🌧️ Saison des pluies' : '🌧️ Rainy Season'}</option>
                    <option value="dry">{isFr ? '☀️ Saison sèche' : '☀️ Dry Season'}</option>
                    <option value="both">{isFr ? 'Les deux saisons' : 'Both seasons'}</option>
                    <option value="year_round">{isFr ? "Toute l'année" : 'Year round'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Partenaire externe (optionnel)' : 'External partner (optional)'}
                  </label>
                  <input
                    value={projectForm.externalPartner}
                    onChange={(e) => setProjectForm((f) => ({ ...f, externalPartner: e.target.value }))}
                    placeholder="FAO, WFP, ECOWAS..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Incitatifs pour les participants' : 'Incentives for participants'}</label>
                  <textarea
                    value={projectForm.incentives}
                    onChange={(e) => setProjectForm((f) => ({ ...f, incentives: e.target.value }))}
                    rows={2}
                    placeholder={
                      isFr
                        ? 'Ex: Accès aux semences subventionnées, formation gratuite, connexion exportateur...'
                        : 'Ex: Access to subsidized seeds, free training, exporter connection...'
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={createProject} className="flex-1 py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#1a3c2e' }}>
                  {isFr ? '💾 Créer le projet' : '💾 Create Project'}
                </button>
                <button onClick={() => setShowProjectForm(false)} className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm">
                  {isFr ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

