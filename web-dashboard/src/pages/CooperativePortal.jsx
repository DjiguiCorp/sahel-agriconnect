import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Loader2, Check, X, Plus } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const COOP_TOKEN = 'sac_coop_token';
const COOP_DATA = 'sac_coop_data';

export default function CooperativePortal() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [token, setToken] = useState(() => sessionStorage.getItem(COOP_TOKEN));
  const [coop, setCoop] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(COOP_DATA));
    } catch {
      return null;
    }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwState, setPwState] = useState({ loading: false, ok: false, err: '' });

  const [inviteForm, setInviteForm] = useState({
    inviteeName: '',
    inviteePhone: '',
    inviteeEmail: '',
    inviteeRegion: '',
    message: '',
  });
  const [inviteState, setInviteState] = useState({ loading: false, ok: false, err: '' });
  const [showInvite, setShowInvite] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !coop) return;
    setLoading(true);
    fetch(`${API}/api/cooperatives/my-portal`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, coop]);

  const login = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const r = await fetch(`${API}/api/cooperatives/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Login failed');
      sessionStorage.setItem(COOP_TOKEN, d.token);
      sessionStorage.setItem(COOP_DATA, JSON.stringify(d.cooperative));
      setToken(d.token);
      setCoop(d.cooperative);
    } catch (err) {
      setLoginError(err.message);
    }
    setLoggingIn(false);
  };

  const logout = () => {
    sessionStorage.removeItem(COOP_TOKEN);
    sessionStorage.removeItem(COOP_DATA);
    setToken(null);
    setCoop(null);
    setData(null);
  };

  const changePassword = async () => {
    if (!newPw || newPw.length < 8) {
      setPwState({ loading: false, ok: false, err: isFr ? 'Min 8 caractères' : 'Min 8 characters' });
      return;
    }
    setPwState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(`${API}/api/cooperatives/set-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ newPassword: newPw }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setPwState({ loading: false, ok: true, err: '' });
      setTimeout(() => setShowChangePw(false), 1500);
    } catch (e) {
      setPwState({ loading: false, ok: false, err: e.message });
    }
  };

  const approveListing = async (listingId) => {
    await fetch(`${API}/api/cooperatives/my-portal/approve-listing/${listingId}`, { method: 'PUT', headers });
    setData((prev) => ({
      ...prev,
      produceListings: prev.produceListings.map((l) =>
        l._id === listingId ? { ...l, cooperativeApproved: true } : l
      ),
    }));
  };

  const respondProject = async (projectId, response) => {
    await fetch(`${API}/api/cooperatives/my-portal/respond-project/${projectId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ response }),
    });
    setData((prev) => ({
      ...prev,
      nationalProjects: prev.nationalProjects.map((p) =>
        p._id === projectId ? { ...p, myResponse: response } : p
      ),
    }));
  };

  const sendInvite = async () => {
    setInviteState({ loading: true, ok: false, err: '' });
    try {
      const r = await fetch(`${API}/api/cooperatives/my-portal/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify(inviteForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setInviteState({ loading: false, ok: true, err: '' });
      setInviteForm({ inviteeName: '', inviteePhone: '', inviteeEmail: '', inviteeRegion: '', message: '' });
      setTimeout(() => setShowInvite(false), 1500);
    } catch (e) {
      setInviteState({ loading: false, ok: false, err: e.message });
    }
  };

  if (!token || !coop)
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
      >
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/sahel-logo.png" alt="SA" className="w-14 h-14 rounded-xl mx-auto mb-3 object-cover" />
            <h1 className="text-xl font-bold text-white">Sahel AgriConnect</h1>
            <p className="text-white/50 text-sm mt-1">🤝 {isFr ? 'Portail Coopérative' : 'Cooperative Portal'}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <h2 className="font-bold text-[#1a3c2e] text-lg mb-5 text-center">
              {isFr ? 'Connexion coopérative' : 'Cooperative login'}
            </h2>
            <form onSubmit={login} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Email de la coopérative' : 'Cooperative email'}
                </label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Mot de passe' : 'Password'}</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                />
              </div>
              {loginError && <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">{loginError}</p>}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ background: '#1a3c2e' }}
              >
                {loggingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Connexion...' : 'Logging in...'}
                  </span>
                ) : isFr ? (
                  'Se connecter'
                ) : (
                  'Log in'
                )}
              </button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <p className="text-xs text-gray-400">
                {isFr
                  ? "Votre mot de passe vous a été envoyé par email lors de l'activation."
                  : 'Your password was emailed when your account was activated.'}
              </p>
              <p className="text-xs text-gray-400">
                {isFr ? 'Pas encore inscrit ?' : 'Not registered yet?'}{' '}
                <Link to="/cooperative-registration" className="text-[#1a3c2e] font-semibold hover:underline">
                  {isFr ? 'Inscrire ma coopérative' : 'Register my cooperative'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );

  const tabs = [
    { key: 'overview', label: isFr ? '🏠 Aperçu' : '🏠 Overview' },
    {
      key: 'farmers',
      label: isFr ? `👩‍🌾 Membres (${data?.stats?.memberCount ?? '—'})` : `👩‍🌾 Members (${data?.stats?.memberCount ?? '—'})`,
    },
    {
      key: 'produce',
      label: isFr ? `🌾 Productions (${data?.produceListings?.length ?? '—'})` : `🌾 Produce (${data?.produceListings?.length ?? '—'})`,
    },
    {
      key: 'projects',
      label: isFr
        ? `📋 Projets nationaux (${data?.nationalProjects?.length ?? '—'})`
        : `📋 National projects (${data?.nationalProjects?.length ?? '—'})`,
    },
    {
      key: 'invitations',
      label: isFr ? `📨 Invitations (${data?.invitations?.length ?? '—'})` : `📨 Invitations (${data?.invitations?.length ?? '—'})`,
    },
  ];

  return (
    <div style={{ background: '#f8f4e3', minHeight: '100vh' }}>
      <div style={{ background: '#1a3c2e' }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/sahel-logo.png" alt="SA" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <p className="text-white font-bold text-sm">{coop.cooperativeName}</p>
            <p className="text-white/50 text-xs">
              🌍 {coop.country} · {isFr ? 'Portail coopérative' : 'Cooperative portal'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowChangePw(true)} className="text-white/50 hover:text-white text-xs transition">
            {isFr ? '🔑 Changer MDP' : '🔑 Change password'}
          </button>
          <button type="button" onClick={logout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition">
            <LogOut className="w-4 h-4" />
            {isFr ? 'Déconnexion' : 'Logout'}
          </button>
        </div>
      </div>

      {data?.stats && (
        <div style={{ background: '#B5850A' }} className="px-6 py-3">
          <div className="max-w-5xl mx-auto flex flex-wrap gap-6">
            {[
              { val: data.stats.memberCount, label: isFr ? 'Membres' : 'Members' },
              { val: `${(data.stats.totalAreaHa || 0).toFixed(0)} ha`, label: isFr ? 'Superficie' : 'Total area' },
              { val: data.stats.pendingListings, label: isFr ? 'En attente' : 'Pending' },
              { val: data.stats.promotedListings, label: 'AfriYield' },
              { val: data.stats.activeProjects, label: isFr ? 'Projets gov.' : 'Gov. projects' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-white font-bold text-lg font-mono">{val}</p>
                <p className="text-white/70 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex overflow-x-auto gap-1 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
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

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {loading && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e] mx-auto" />
          </div>
        )}

        {activeTab === 'overview' && !loading && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-[#1a3c2e] mb-3">
                  🌾 {isFr ? "Productions en attente d'approbation" : 'Produce awaiting approval'}
                </h3>
                {(data?.produceListings?.filter((l) => !l.cooperativeApproved) || []).length === 0 ? (
                  <p className="text-gray-400 text-sm">{isFr ? 'Aucune production en attente.' : 'No pending produce.'}</p>
                ) : (
                  (data?.produceListings?.filter((l) => !l.cooperativeApproved) || [])
                    .slice(0, 3)
                    .map((l) => (
                      <div key={l._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-[#1a3c2e]">{l.commodity}</p>
                          <p className="text-xs text-gray-400">
                            {l.quantityKg ? `${l.quantityKg} kg` : ''} · {l.farmerName || '—'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => approveListing(l._id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                          style={{ background: '#1a3c2e' }}
                        >
                          ✓ {isFr ? 'Approuver' : 'Approve'}
                        </button>
                      </div>
                    ))
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-[#1a3c2e] mb-3">
                  📋 {isFr ? 'Projets gouvernementaux actifs' : 'Active government projects'}
                </h3>
                {(data?.nationalProjects || []).length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    {isFr ? 'Aucun projet national pour votre pays.' : 'No national projects for your country.'}
                  </p>
                ) : (
                  (data?.nationalProjects || []).slice(0, 3).map((p) => (
                    <div key={p._id} className="py-2 border-b border-gray-50 last:border-0">
                      <p className="text-sm font-medium text-[#1a3c2e]">{isFr && p.titleFr ? p.titleFr : p.title}</p>
                      <p className="text-xs text-gray-400">{p.organization}</p>
                      {p.myResponse ? (
                        <span className="text-xs text-green-600 font-semibold">✓ {p.myResponse}</span>
                      ) : (
                        <div className="flex gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={() => respondProject(p._id, 'interested')}
                            className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          >
                            👍 {isFr ? 'Intéressé' : 'Interested'}
                          </button>
                          <button
                            type="button"
                            onClick={() => respondProject(p._id, 'declined')}
                            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                          >
                            {isFr ? 'Décliner' : 'Decline'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-[#1a3c2e] mb-4">⚡ {isFr ? 'Actions rapides' : 'Quick actions'}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: '📨',
                    label: isFr ? 'Inviter un agriculteur' : 'Invite a farmer',
                    action: () => {
                      setActiveTab('invitations');
                      setShowInvite(true);
                    },
                  },
                  { icon: '🌾', label: isFr ? 'Voir les productions' : 'View produce', action: () => setActiveTab('produce') },
                  { icon: '📋', label: isFr ? 'Projets nationaux' : 'National projects', action: () => setActiveTab('projects') },
                  { icon: '🌍', label: 'AfriYield Exchange', action: () => window.open('/afri-yield/opportunities', '_blank') },
                ].map(({ icon, label, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#1a3c2e]/20 hover:border-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition text-center"
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-semibold text-[#1a3c2e]">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'farmers' && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#1a3c2e]">👩‍🌾 {isFr ? 'Agriculteurs membres' : 'Member farmers'}</h3>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('invitations');
                  setShowInvite(true);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-white px-3 py-2 rounded-xl"
                style={{ background: '#1a3c2e' }}
              >
                <Plus className="w-4 h-4" /> {isFr ? 'Inviter' : 'Invite'}
              </button>
            </div>
            {(data?.memberFarmers || []).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">👩‍🌾</p>
                <p className="text-gray-500 text-sm">
                  {isFr ? 'Aucun membre pour le moment. Invitez des agriculteurs.' : 'No members yet. Invite farmers.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[isFr ? 'Nom' : 'Name', isFr ? 'Cultures' : 'Crops', isFr ? 'Superficie' : 'Area', isFr ? 'Région' : 'Region', isFr ? 'Vérifié' : 'Verified'].map(
                      (h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(data?.memberFarmers || []).map((f, i) => (
                    <tr key={f._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-medium text-[#1a3c2e]">{f.nom || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{Array.isArray(f.cultures) ? f.cultures.join(', ') : '—'}</td>
                      <td className="px-4 py-3 font-mono">{f.superficie ? `${f.superficie} ha` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{f.region || '—'}</td>
                      <td className="px-4 py-3">
                        {f.emailVerified ? (
                          <span className="text-green-600 text-xs font-semibold">✓ {isFr ? 'Vérifié' : 'Verified'}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">{isFr ? 'Non vérifié' : 'Unverified'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'produce' && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1a3c2e]">🌾 {isFr ? 'Productions déclarées' : 'Declared produce'}</h3>
            </div>
            {(data?.produceListings || []).length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                <p className="text-5xl mb-3">🌾</p>
                <p className="text-gray-500 text-sm">
                  {isFr ? 'Aucune production déclarée par vos membres.' : 'No produce declared by your members yet.'}
                </p>
              </div>
            ) : (
              (data?.produceListings || []).map((l) => (
                <div key={l._id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-[#1a3c2e]">{l.commodity}</p>
                    <p className="text-sm text-gray-500">
                      {l.quantityKg ? `${l.quantityKg} kg` : ''}
                      {l.pricePerKgUSD != null ? ` · $${l.pricePerKgUSD}/kg` : ''} ·{' '}
                      {l.farmerName || (isFr ? 'Agriculteur' : 'Farmer')}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          l.cooperativeApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {l.cooperativeApproved ? (isFr ? '✓ Approuvé' : '✓ Approved') : isFr ? '⏳ En attente' : '⏳ Pending'}
                      </span>
                      {l.promotedToMarketplace && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">🌍 AfriYield</span>
                      )}
                    </div>
                  </div>
                  {!l.cooperativeApproved && (
                    <button
                      type="button"
                      onClick={() => approveListing(l._id)}
                      className="flex-shrink-0 text-sm font-bold px-4 py-2 rounded-xl text-white"
                      style={{ background: '#1a3c2e' }}
                    >
                      ✓ {isFr ? 'Approuver' : 'Approve'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'projects' && !loading && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#1a3c2e]">
              📋 {isFr ? 'Projets nationaux — Votre pays' : 'National projects — Your country'}
            </h3>
            {(data?.nationalProjects || []).length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                <p className="text-5xl mb-3">📋</p>
                <p className="text-gray-500 text-sm">
                  {isFr ? 'Aucun projet national actif pour votre pays.' : 'No active national projects for your country.'}
                </p>
              </div>
            ) : (
              (data?.nationalProjects || []).map((p) => (
                <div key={p._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-[#1a3c2e] text-lg">{isFr && p.titleFr ? p.titleFr : p.title}</p>
                      <p className="text-xs text-gray-500">
                        {p.organization} · {p.createdByName}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        p.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : p.priority === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {p.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">{isFr && p.descriptionFr ? p.descriptionFr : p.description}</p>
                  {p.incentives && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">🎁 {isFr ? 'Incitatifs :' : 'Incentives:'}</p>
                      <p className="text-xs text-green-600">{p.incentives}</p>
                    </div>
                  )}
                  {p.myResponse ? (
                    <span
                      className={`text-sm font-bold ${
                        p.myResponse === 'interested' || p.myResponse === 'committed' ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      ✓ {isFr ? 'Votre réponse :' : 'Your response:'} {p.myResponse}
                    </span>
                  ) : (
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => respondProject(p._id, 'committed')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white text-sm"
                        style={{ background: '#1a3c2e' }}
                      >
                        <Check className="w-4 h-4" /> {isFr ? "S'engager" : 'Commit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => respondProject(p._id, 'interested')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e]"
                      >
                        👍 {isFr ? 'Intéressé' : 'Interested'}
                      </button>
                      <button
                        type="button"
                        onClick={() => respondProject(p._id, 'declined')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-gray-200 text-gray-500"
                      >
                        {isFr ? 'Décliner' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'invitations' && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1a3c2e]">📨 {isFr ? 'Invitations agriculteurs' : 'Farmer invitations'}</h3>
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: '#1a3c2e' }}
              >
                <Plus className="w-4 h-4" /> {isFr ? 'Inviter' : 'Invite'}
              </button>
            </div>

            {(data?.invitations || []).length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                <p className="text-5xl mb-3">📨</p>
                <p className="text-gray-500 text-sm mb-4">{isFr ? 'Aucune invitation envoyée.' : 'No invitations sent yet.'}</p>
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                  style={{ background: '#1a3c2e' }}
                >
                  {isFr ? 'Envoyer la première invitation' : 'Send first invitation'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[isFr ? 'Agriculteur' : 'Farmer', isFr ? 'Contact' : 'Contact', isFr ? 'Code' : 'Code', isFr ? 'Statut' : 'Status', isFr ? 'Date' : 'Date'].map(
                        (h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.invitations || []).map((inv, i) => (
                      <tr key={inv._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3 font-medium text-[#1a3c2e]">{inv.inviteeName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{inv.inviteePhone || inv.inviteeEmail || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs">{inv.inviteCode}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              inv.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : inv.status === 'declined'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1a3c2e] text-lg">📨 {isFr ? 'Inviter un agriculteur' : 'Invite a farmer'}</h3>
              <button type="button" onClick={() => setShowInvite(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {inviteState.ok ? (
              <div className="text-center py-6">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-[#1a3c2e]">{isFr ? 'Invitation envoyée !' : 'Invitation sent!'}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {isFr ? "L'agriculteur recevra un email avec le lien d'invitation." : 'The farmer will receive an email with the invitation link.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'inviteeName', label: isFr ? "Nom de l'agriculteur" : 'Farmer name' },
                  { key: 'inviteePhone', label: isFr ? 'Téléphone (WhatsApp)' : 'Phone (WhatsApp)' },
                  { key: 'inviteeEmail', label: 'Email' },
                  { key: 'inviteeRegion', label: isFr ? 'Région' : 'Region' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      value={inviteForm[key]}
                      onChange={(e) => setInviteForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Message personnel' : 'Personal message'}</label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm((f) => ({ ...f, message: e.target.value }))}
                    rows={2}
                    placeholder={
                      isFr
                        ? 'Ex: Nous cherchons des producteurs de karité dans votre zone...'
                        : 'Ex: We are looking for shea producers in your area...'
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                  />
                </div>
                {inviteState.err && <p className="text-red-500 text-xs">{inviteState.err}</p>}
                <button
                  type="button"
                  onClick={sendInvite}
                  disabled={inviteState.loading || (!inviteForm.inviteePhone && !inviteForm.inviteeEmail)}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                  style={{ background: '#1a3c2e' }}
                >
                  {inviteState.loading ? '...' : isFr ? "Envoyer l'invitation" : 'Send invitation'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showChangePw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-[#1a3c2e] text-lg mb-4">🔑 {isFr ? 'Changer le mot de passe' : 'Change password'}</h3>
            {pwState.ok ? (
              <div className="text-center py-4">
                <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-700">{isFr ? 'Mot de passe mis à jour !' : 'Password updated!'}</p>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder={isFr ? 'Nouveau mot de passe (min 8 caractères)' : 'New password (min 8 chars)'}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                />
                {pwState.err && <p className="text-red-500 text-xs mb-3">{pwState.err}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={changePassword}
                    disabled={pwState.loading}
                    className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm"
                    style={{ background: '#1a3c2e' }}
                  >
                    {pwState.loading ? '...' : isFr ? 'Confirmer' : 'Confirm'}
                  </button>
                  <button type="button" onClick={() => setShowChangePw(false)} className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm">
                    {isFr ? 'Annuler' : 'Cancel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
