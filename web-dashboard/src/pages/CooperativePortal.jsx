import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Loader2, Check, X, Plus, Lock, QrCode, Pencil } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import CooperativeFinanceForm from '../components/CooperativeFinanceForm';
import HarvestQrModal from '../components/HarvestQrModal';
import MarketPricesStrip from '../components/MarketPricesStrip';
import {
  ManualMembersPanel,
  DuesPaymentsPanel,
  PaymentStatusDot,
} from '../components/CoopMemberManagementPanels';
import ICSScorePanel from '../components/ICSScorePanel';
import { cropLabel } from '../lib/crops';

const API = import.meta.env.VITE_API_BASE_URL;

const INPUT_LIGHT =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

function growthEligibilityTip(isFr, verifiedCount = 0, declaredCount = 0) {
  const v = Number(verifiedCount) || 0;
  const d = Number(declaredCount) || 0;
  if (v < 10) {
    return isFr
      ? `Vous avez ${v} membres vérifiés. Atteignez 10 membres vérifiés + 51 déclarés, ou 51 vérifiés, pour débloquer le plan Croissance.`
      : `You have ${v} verified members. Reach 10 verified + 51 declared, or 51 verified, to unlock the Growth plan.`;
  }
  if (d < 51) {
    return isFr
      ? `Vous avez ${v} membres vérifiés. Déclarez 51 membres pour débloquer l’accès provisoire au plan Croissance.`
      : `You have ${v} verified members. Declare 51 members to unlock provisional Growth access.`;
  }
  return isFr
    ? `Vous êtes éligible au plan Croissance (accès provisoire ou complet).`
    : `You are eligible for the Growth plan (provisional or full access).`;
}

function isGrowthEligible(verifiedCount = 0, declaredCount = 0) {
  const v = Number(verifiedCount) || 0;
  const d = Number(declaredCount) || 0;
  return v >= 51 || (d >= 51 && v >= 10);
}

function GrowthUpgradeButton({
  isFr,
  navigate,
  verifiedCount = 0,
  declaredCount = 0,
  className = '',
  labelFr = 'Mettre à niveau',
  labelEn = 'Upgrade',
  showPrice = false,
}) {
  const ready = isGrowthEligible(verifiedCount, declaredCount);
  const label = showPrice
    ? isFr
      ? `${labelFr} — $199/an`
      : `${labelEn} — $199/year`
    : isFr
      ? labelFr
      : labelEn;
  const tip = growthEligibilityTip(isFr, verifiedCount, declaredCount);

  if (!ready) {
    return (
      <button
        type="button"
        disabled
        title={tip}
        aria-label={tip}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-300 text-gray-500 font-bold text-sm cursor-not-allowed opacity-80 ${className}`}
      >
        <Lock className="w-3.5 h-3.5" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/cooperative-upgrade')}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all ${className}`}
    >
      {label}
    </button>
  );
}

function GrowthLockedPanel({ isFr, navigate, verifiedCount = 0, declaredCount = 0 }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-200 px-6">
      <span className="text-4xl mb-4">🔒</span>
      <p className="text-[#1a3c2e] font-semibold mb-2">
        {isFr ? 'Disponible avec le plan Croissance' : 'Available on Growth Plan'}
      </p>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        {growthEligibilityTip(isFr, verifiedCount, declaredCount)}
      </p>
      <GrowthUpgradeButton
        isFr={isFr}
        navigate={navigate}
        verifiedCount={verifiedCount}
        declaredCount={declaredCount}
        showPrice
        className="px-6 py-3"
        labelFr="Mettre à niveau"
        labelEn="Upgrade"
      />
    </div>
  );
}

const COOP_TOKEN = 'sac_coop_token';
const COOP_DATA = 'sac_coop_data';

export default function CooperativePortal() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const coopTier = data?.cooperative?.tier || 'starter';
  const isGrowth = coopTier === 'growth';
  const coopStatus = data?.cooperative?.status || '';

  const [loginStep, setLoginStep] = useState('email'); // email | code
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [dossierBusy, setDossierBusy] = useState(false);
  const [dossierError, setDossierError] = useState('');

  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwState, setPwState] = useState({ loading: false, ok: false, err: '' });

  const [inviteForm, setInviteForm] = useState({
    inviteeName: '',
    inviteePhone: '',
    inviteeEmail: '',
    inviteeRegion: '',
    inviteeCrops: [],
    message: '',
  });
  const [inviteState, setInviteState] = useState({ loading: false, ok: false, err: '' });
  const [inviteLookup, setInviteLookup] = useState({ status: 'idle', found: null }); // idle|loading|done
  const [showInvite, setShowInvite] = useState(false);
  const [trainings, setTrainings] = useState([]);
  const [trainingsLoading, setTrainingsLoading] = useState(false);
  const [joinReviewBusy, setJoinReviewBusy] = useState(null);

  const [membersSubTab, setMembersSubTab] = useState('active'); // active | pending | payments | offline
  const [duesStatusByMember, setDuesStatusByMember] = useState({});
  const [duesPrefill, setDuesPrefill] = useState(null);
  const [editingDeclared, setEditingDeclared] = useState(false);
  const [declaredDraft, setDeclaredDraft] = useState('');
  const [declaredBusy, setDeclaredBusy] = useState(false);
  const [showProcessorModal, setShowProcessorModal] = useState(false);
  const [processors, setProcessors] = useState([]);
  const [processorsLoading, setProcessorsLoading] = useState(false);
  const [linkProcessorBusy, setLinkProcessorBusy] = useState(false);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [verifyToast, setVerifyToast] = useState('');
  const [harvestLogs, setHarvestLogs] = useState([]);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [harvestSubTab, setHarvestSubTab] = useState('pending'); // pending | verified
  const [harvestVerifyBusy, setHarvestVerifyBusy] = useState(null);
  const [harvestQrBatchId, setHarvestQrBatchId] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const declaredMembers = Number(
    data?.cooperative?.memberCount ?? data?.stats?.declaredMemberCount ?? 0
  );
  const linkedMemberCount = Number(data?.stats?.memberCount ?? 0);
  const verifiedMemberCount = Number(data?.stats?.verifiedMemberCount ?? 0);
  const progressMembers = verifiedMemberCount;
  const pendingJoinCount = (data?.joinRequests || []).length;
  const processorId = data?.cooperative?.processorId || null;
  const processorName = data?.cooperative?.processorName || '';
  const pendingEquipmentApps = Number(data?.stats?.pendingEquipmentApps ?? 0);
  const pendingCertifications = Number(data?.stats?.pendingCertifications ?? 0);
  const activeProduceCount = Number(
    data?.stats?.activeProduceListings ??
      (data?.produceListings || []).filter((l) => l.cooperativeApproved).length
  );
  const pendingHarvestCount = harvestLogs.filter((h) => !h.verifiedByCoop).length;
  const verifiedHarvestCount = harvestLogs.filter((h) => h.verifiedByCoop).length;
  const pendingFullVerification = Boolean(data?.cooperative?.pendingFullVerification);
  const afriyieldUnlocked =
    data?.cooperative?.afriyieldUnlocked != null
      ? Boolean(data.cooperative.afriyieldUnlocked)
      : isGrowth && !pendingFullVerification;
  const specialUnlocked = isGrowth && Boolean(processorId);
  const verificationStatus = data?.cooperative?.verificationStatus || 'unverified';
  const growthReady = isGrowthEligible(verifiedMemberCount, declaredMembers);

  const refreshPortal = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/api/cooperatives/my-portal`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token || !coop) return;
    refreshPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, coop]);

  useEffect(() => {
    if (!token || activeTab !== 'members') return;
    const now = new Date();
    fetch(
      `${API}/api/cooperatives/my-portal/dues-summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      { headers }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDuesStatusByMember(d.statusByMember || {});
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab, data?.memberFarmers?.length]);

  const loadHarvestLogs = () => {
    const coopId = data?.cooperative?._id;
    if (!token || !coopId) return;
    setHarvestLoading(true);
    fetch(API_ENDPOINTS.HARVEST_LOGS.COOPERATIVE(coopId), { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHarvestLogs(Array.isArray(d.harvestLogs) ? d.harvestLogs : []);
      })
      .catch(() => setHarvestLogs([]))
      .finally(() => setHarvestLoading(false));
  };

  useEffect(() => {
    if (activeTab !== 'produce') return;
    loadHarvestLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, data?.cooperative?._id, token]);

  const verifyHarvestLog = async (id) => {
    setHarvestVerifyBusy(id);
    try {
      const r = await fetch(API_ENDPOINTS.HARVEST_LOGS.VERIFY(id), {
        method: 'PATCH',
        headers,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Verify failed');
      setHarvestLogs((prev) =>
        prev.map((h) => (h._id === id ? { ...h, ...d.harvestLog, verifiedByCoop: true } : h))
      );
      setHarvestSubTab('verified');
    } catch (e) {
      alert(e.message || (isFr ? 'Échec de la vérification' : 'Verification failed'));
    } finally {
      setHarvestVerifyBusy(null);
    }
  };

  // Email verification from registration link ?verify=<token>
  useEffect(() => {
    const verifyToken = searchParams.get('verify');
    if (!verifyToken) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API}/api/cooperatives/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: verifyToken }),
        });
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (r.ok && d.success) {
          setVerifyToast(isFr ? 'Email vérifié' : 'Email verified');
        } else {
          setVerifyToast(d.error || (isFr ? 'Lien de vérification invalide' : 'Invalid verification link'));
        }
      } catch {
        if (!cancelled) setVerifyToast(isFr ? 'Échec de la vérification' : 'Verification failed');
      } finally {
        const next = new URLSearchParams(searchParams);
        next.delete('verify');
        setSearchParams(next, { replace: true });
        setTimeout(() => setVerifyToast(''), 5000);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== 'formations' || !token || !isGrowth) return;
    setTrainingsLoading(true);
    fetch(`${API}/api/trainings`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTrainings(d.trainings || []);
        else setTrainings([]);
      })
      .catch(() => setTrainings([]))
      .finally(() => setTrainingsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, isGrowth]);

  const reviewJoinRequest = async (requestId, action) => {
    const coopId = data?.cooperative?.id;
    if (!coopId || !requestId) return;
    setJoinReviewBusy(requestId);
    try {
      const r = await fetch(
        `${API}/api/cooperatives/${coopId}/join-requests/${requestId}/review`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ action }),
        }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Review failed');
      refreshPortal();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Error');
    } finally {
      setJoinReviewBusy(null);
    }
  };

  const openQuickPay = (member) => {
    setMembersSubTab('payments');
    setDuesPrefill(member);
  };

  const saveDeclaredCount = async () => {
    const n = Number(declaredDraft);
    if (!Number.isInteger(n) || n < 0) {
      alert(isFr ? 'Entrez un nombre entier ≥ 0.' : 'Enter a whole number ≥ 0.');
      return;
    }
    setDeclaredBusy(true);
    try {
      const r = await fetch(`${API}/api/cooperatives/my-portal/update-count`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ memberCount: n }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setEditingDeclared(false);
      refreshPortal();
    } catch (err) {
      alert(err.message || 'Error');
    } finally {
      setDeclaredBusy(false);
    }
  };

  const openProcessorModal = async () => {
    setShowProcessorModal(true);
    setProcessorsLoading(true);
    try {
      const r = await fetch(`${API}/api/cooperatives/my-portal/processors`, { headers });
      const d = await r.json().catch(() => ({}));
      setProcessors(d.processors || []);
    } catch {
      setProcessors([]);
    } finally {
      setProcessorsLoading(false);
    }
  };

  const linkProcessor = async (id) => {
    setLinkProcessorBusy(true);
    try {
      const r = await fetch(`${API}/api/cooperatives/my-portal/link-processor`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ processorId: id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Link failed');
      setShowProcessorModal(false);
      refreshPortal();
    } catch (err) {
      alert(err.message || 'Error');
    } finally {
      setLinkProcessorBusy(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const r = await fetch(API_ENDPOINTS.VERIFY.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email: loginEmail.trim().toLowerCase(),
          role: 'cooperative',
          lang: isFr ? 'fr' : 'en',
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Send failed');
      setVerificationId(d.verificationId || '');
      setLoginStep('code');
    } catch (err) {
      setLoginError(err.message);
    }
    setLoggingIn(false);
  };

  const confirmLoginCode = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const r = await fetch(API_ENDPOINTS.VERIFY.CONFIRM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email: loginEmail.trim().toLowerCase(),
          code: loginCode,
          role: 'cooperative',
          verificationId,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Login failed');
      if (!d.token) throw new Error(isFr ? 'Compte non activé.' : 'Account not active yet.');
      const coopObj = d.user ? { email: d.user.email, cooperativeName: d.user.name } : null;
      sessionStorage.setItem(COOP_TOKEN, d.token);
      if (coopObj) sessionStorage.setItem(COOP_DATA, JSON.stringify(coopObj));
      setToken(d.token);
      setCoop(coopObj);
      if (d.user?.email) localStorage.setItem('sac_coop_email', d.user.email);
      if (d.user?.name) localStorage.setItem('sac_coop_name', d.user.name);
      localStorage.setItem('auth_token_cooperative', d.token);
      localStorage.setItem('auth_role', 'cooperative');
      window.dispatchEvent(new Event('sac_user_updated'));
      window.dispatchEvent(new Event('web_session_updated'));
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
    setLoginStep('email');
    setLoginEmail('');
    setLoginCode('');
    setVerificationId('');
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

  const lookupFarmerContact = async (field) => {
    const email = inviteForm.inviteeEmail.trim().toLowerCase();
    const phone = inviteForm.inviteePhone.trim();
    if (field === 'email' && !email) return;
    if (field === 'phone' && !phone) return;
    if (!token) return;

    setInviteLookup({ status: 'loading', found: null });
    try {
      const qs = field === 'email' ? `email=${encodeURIComponent(email)}` : `phone=${encodeURIComponent(phone)}`;
      const r = await fetch(`${API}/api/farmers/lookup?${qs}`, { headers });
      const d = await r.json().catch(() => ({}));
      if (d.found) {
        setInviteForm((f) => ({
          ...f,
          inviteeName: d.farmerName || f.inviteeName,
          inviteeRegion: d.region || f.inviteeRegion,
          inviteeCrops: Array.isArray(d.primaryCrops) ? d.primaryCrops : [],
        }));
        setInviteLookup({ status: 'done', found: true });
      } else {
        setInviteLookup({ status: 'done', found: false });
      }
    } catch {
      setInviteLookup({ status: 'done', found: false });
    }
  };

  const sendInvite = async () => {
    setInviteState({ loading: true, ok: false, err: '' });
    try {
      const cropsNote =
        inviteForm.inviteeCrops?.length > 0
          ? `\n[${isFr ? 'Cultures' : 'Crops'}: ${inviteForm.inviteeCrops.join(', ')}]`
          : '';
      const r = await fetch(`${API}/api/cooperatives/my-portal/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inviteeName: inviteForm.inviteeName,
          inviteePhone: inviteForm.inviteePhone,
          inviteeEmail: inviteForm.inviteeEmail,
          inviteeRegion: inviteForm.inviteeRegion,
          message: `${inviteForm.message || ''}${cropsNote}`.trim(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setInviteState({ loading: false, ok: true, err: '' });
      setInviteForm({
        inviteeName: '',
        inviteePhone: '',
        inviteeEmail: '',
        inviteeRegion: '',
        inviteeCrops: [],
        message: '',
      });
      setInviteLookup({ status: 'idle', found: null });
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
              {isFr ? 'Connexion par code' : 'Sign in with code'}
            </h2>
            {loginStep === 'email' ? (
              <form onSubmit={login} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Email de la coopérative' : 'Cooperative email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
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
                      <Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Envoi...' : 'Sending...'}
                    </span>
                  ) : isFr ? (
                    'Recevoir mon code'
                  ) : (
                    'Send me a code'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={confirmLoginCode} className="space-y-4">
                <p className="text-xs text-gray-500 text-center">
                  {isFr ? 'Code envoyé à ' : 'Code sent to '} <span className="text-gray-900 font-semibold">{loginEmail}</span>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Code (6 chiffres)' : 'Code (6 digits)'}
                  </label>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 tracking-widest text-center font-mono"
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
                      <Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Connexion...' : 'Signing in...'}
                    </span>
                  ) : isFr ? (
                    'Se connecter'
                  ) : (
                    'Sign in'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('email');
                    setLoginCode('');
                    setLoginError('');
                  }}
                  className="w-full text-xs text-gray-400 hover:text-gray-700"
                >
                  {isFr ? '← Changer d’email' : '← Change email'}
                </button>
              </form>
            )}
            <div className="mt-4 text-center space-y-2">
              <p className="text-xs text-gray-400">
                {isFr
                  ? "Aucun mot de passe — connexion sécurisée par code email."
                  : 'No password — secure sign-in via email code.'}
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
      label: isFr
        ? `🌾 Productions (${harvestLogs.length || data?.produceListings?.length || 0})`
        : `🌾 Produce (${harvestLogs.length || data?.produceListings?.length || 0})`,
    },
    {
      key: 'ics',
      label: isFr ? '📊 Score ICS' : '📊 ICS Score',
    },
    {
      key: 'certification',
      label: isFr ? `🏅 Certification${isGrowth ? '' : ' 🔒'}` : `🏅 Certification${isGrowth ? '' : ' 🔒'}`,
    },
    {
      key: 'afriyield',
      label: `🌍 AfriYield${afriyieldUnlocked ? '' : ' 🔒'}`,
      title: !afriyieldUnlocked
        ? isFr
          ? isGrowth && pendingFullVerification
            ? `Disponible à 25 membres vérifiés (actuellement ${verifiedMemberCount}/25)`
            : 'Disponible avec le plan Croissance'
          : isGrowth && pendingFullVerification
            ? `Available at 25 verified members (currently ${verifiedMemberCount}/25)`
            : 'Available on Growth Plan'
        : undefined,
    },
    {
      key: 'export',
      label: isFr ? `📦 Export${isGrowth ? '' : ' 🔒'}` : `📦 Export${isGrowth ? '' : ' 🔒'}`,
    },
    {
      key: 'projects',
      label: isFr
        ? `📋 Projets nationaux (${data?.nationalProjects?.length ?? '—'})`
        : `📋 National projects (${data?.nationalProjects?.length ?? '—'})`,
    },
    {
      key: 'invitations',
      label: isFr
        ? `📨 Invitations (${data?.invitations?.length ?? '—'})${pendingJoinCount ? ` · ${pendingJoinCount} demandes` : ''}`
        : `📨 Invitations (${data?.invitations?.length ?? '—'})${pendingJoinCount ? ` · ${pendingJoinCount} requests` : ''}`,
    },
    {
      key: 'formations',
      label: isFr
        ? `🎓 Formations${isGrowth ? '' : ' 🔒'}`
        : `🎓 Training${isGrowth ? '' : ' 🔒'}`,
    },
  ];

  return (
    <div style={{ background: '#f8f4e3', minHeight: '100vh' }}>
      <div style={{ background: '#1a3c2e' }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/sahel-logo.png" alt="SA" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-sm">{coop.cooperativeName}</p>
              {verificationStatus === 'verified' ? (
                <span className="inline-flex items-center rounded-full bg-green-400/20 text-green-300 text-[10px] font-bold px-2 py-0.5">
                  ✓ {isFr ? 'Coopérative Vérifiée' : 'Verified Cooperative'}
                </span>
              ) : null}
            </div>
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

      {isGrowth && pendingFullVerification ? (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 font-semibold">
            {isFr
              ? `⏳ Accès provisoire — Atteignez 25 membres vérifiés pour débloquer AfriYield. ${verifiedMemberCount} / 25 membres vérifiés actuellement.`
              : `⏳ Provisional Access — Reach 25 verified members to unlock AfriYield. ${verifiedMemberCount} / 25 verified members currently.`}
          </div>
        </div>
      ) : null}

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {verificationStatus === 'flagged' ? (
          <div className="mb-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {isFr
              ? 'Votre compte est en cours de révision — contactez support@sahelagriconnect.com'
              : 'Your account is under review — contact support@sahelagriconnect.com'}
          </div>
        ) : null}
        {!isGrowth ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white mb-2 shadow-sm">
            <span className="text-2xl">🌱</span>
            <div className="flex-1 min-w-0">
              <p className="text-[#1a3c2e] font-semibold text-sm">
                {isFr ? 'Plan Démarrage — Gratuit' : 'Starter Plan — Free'}
              </p>
              <p className="text-gray-500 text-xs">
                {isFr
                  ? 'Certification & export : 51 vérifiés, ou 10 vérifiés + 51 déclarés (AfriYield à 25 vérifiés en accès provisoire). Plan Croissance $199/an.'
                  : 'Certification & export: 51 verified, or 10 verified + 51 declared (AfriYield at 25 verified on provisional access). Growth $199/year.'}
              </p>
            </div>
            <GrowthUpgradeButton
              isFr={isFr}
              navigate={navigate}
              verifiedCount={verifiedMemberCount}
              declaredCount={declaredMembers}
              className="px-4 py-2 text-xs shrink-0"
              labelFr="Mettre à niveau"
              labelEn="Upgrade"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-teal-500/40 bg-teal-50 mb-2">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="text-teal-700 font-semibold text-sm">
                {isFr ? 'Plan Croissance — Actif' : 'Growth Plan — Active'}
              </p>
              <p className="text-teal-700/70 text-xs">
                {isFr
                  ? 'Certification, AfriYield Exchange et export diaspora débloqués'
                  : 'Certification, AfriYield Exchange & diaspora export unlocked'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex overflow-x-auto gap-1 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              title={tab.title || undefined}
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
          <div className="space-y-5">
            {verifyToast ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                ✓ {verifyToast}
              </div>
            ) : null}

            {/* Member Progress Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-[#1a3c2e] text-lg">
                    {isFr ? 'Progression des membres' : 'Member progress'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-1">
                    <span>
                      {isFr
                        ? `${verifiedMemberCount} membres vérifiés sur la plateforme`
                        : `${verifiedMemberCount} verified members on the platform`}
                    </span>
                    <span>·</span>
                    {editingDeclared ? (
                      <span className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={declaredDraft}
                          onChange={(e) => setDeclaredDraft(e.target.value)}
                          className="w-20 rounded-lg border border-gray-300 px-2 py-0.5 text-sm text-gray-900"
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={declaredBusy}
                          onClick={saveDeclaredCount}
                          className="text-xs font-bold text-green-700 hover:underline disabled:opacity-50"
                        >
                          {declaredBusy ? '...' : isFr ? 'OK' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDeclared(false)}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          {isFr ? 'Annuler' : 'Cancel'}
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {declaredMembers} {isFr ? 'déclarés' : 'declared'}
                        <button
                          type="button"
                          onClick={() => {
                            setDeclaredDraft(String(declaredMembers || 0));
                            setEditingDeclared(true);
                          }}
                          className="p-0.5 rounded text-gray-400 hover:text-[#1a3c2e] hover:bg-gray-100"
                          aria-label={isFr ? 'Modifier le nombre déclaré' : 'Edit declared count'}
                          title={isFr ? 'Modifier le nombre déclaré' : 'Edit declared count'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                    {linkedMemberCount ? (
                      <span>
                        · {linkedMemberCount} {isFr ? 'liés' : 'linked'}
                      </span>
                    ) : null}
                  </p>
                </div>
                {isGrowth && coopStatus === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5">
                    ✓ {isFr ? 'Plan Croissance actif' : 'Growth Plan active'}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5">
                    {isFr ? 'Plan Démarrage' : 'Starter Plan'}
                  </span>
                )}
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: pendingFullVerification
                      ? `${Math.min(100, (progressMembers / 25) * 100)}%`
                      : `${Math.min(100, (progressMembers / 51) * 100)}%`,
                    background: pendingFullVerification
                      ? '#d97706'
                      : progressMembers >= 51
                        ? '#16a34a'
                        : '#1a3c2e',
                  }}
                />
              </div>
              <p
                className={`text-xs mb-3 font-semibold ${
                  pendingFullVerification
                    ? 'text-amber-700'
                    : isGrowth && progressMembers >= 51
                      ? 'text-green-700'
                      : 'text-gray-600'
                }`}
              >
                {pendingFullVerification
                  ? isFr
                    ? `${progressMembers} membres vérifiés · ${declaredMembers} déclarés — Accès provisoire actif`
                    : `${progressMembers} verified members · ${declaredMembers} declared — Provisional access active`
                  : isGrowth && progressMembers >= 51
                    ? isFr
                      ? `${progressMembers} membres vérifiés — Accès complet`
                      : `${progressMembers} verified members — Full access`
                    : isFr
                      ? `${Math.min(progressMembers, 51)} / 51 vérifiés · ou 10 vérifiés + 51 déclarés pour le plan Croissance`
                      : `${Math.min(progressMembers, 51)} / 51 verified · or 10 verified + 51 declared for Growth`}
              </p>
              {coopTier === 'starter' ? (
                <div
                  className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    growthReady
                      ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      growthReady ? 'text-amber-900' : 'text-gray-600'
                    }`}
                  >
                    {growthReady
                      ? isFr
                        ? progressMembers >= 51
                          ? 'Vous avez atteint 51 membres vérifiés — passez au plan Croissance pour tout débloquer'
                          : 'Éligible à l’accès provisoire Croissance (AfriYield à 25 vérifiés)'
                        : progressMembers >= 51
                          ? "You've reached 51 verified members — upgrade to unlock everything"
                          : 'Eligible for provisional Growth access (AfriYield at 25 verified)'
                      : growthEligibilityTip(isFr, progressMembers, declaredMembers)}
                  </p>
                  <GrowthUpgradeButton
                    isFr={isFr}
                    navigate={navigate}
                    verifiedCount={progressMembers}
                    declaredCount={declaredMembers}
                    className="shrink-0 px-4 py-2.5"
                    labelFr="Mettre à niveau"
                    labelEn="Upgrade"
                  />
                </div>
              ) : null}
            </div>

            <MarketPricesStrip isFr={isFr} />

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: isFr ? 'Membres' : 'Members', value: linkedMemberCount, icon: '👩‍🌾' },
                { label: isFr ? 'Demandes en attente' : 'Pending requests', value: pendingJoinCount, icon: '📨' },
                { label: isFr ? 'Productions actives' : 'Active produce', value: activeProduceCount, icon: '🌾' },
                {
                  label: isFr ? 'Certifications en cours' : 'Pending certifications',
                  value: pendingCertifications,
                  icon: '🏅',
                },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    {s.icon} {s.label}
                  </p>
                  <p className="text-2xl font-extrabold text-[#1a3c2e]">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Feature Preview Grid */}
            <div>
              <h3 className="font-bold text-[#1a3c2e] mb-3">
                {isFr ? 'Fonctionnalités' : 'Features'}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    key: 'formations',
                    icon: '🎓',
                    title: isFr ? 'Formations' : 'Training',
                    desc: isFr
                      ? 'Programmes de formation pour vos membres'
                      : 'Training programs for your members',
                    locked: !isGrowth,
                    action: () => setActiveTab('formations'),
                    actionLabel: isFr ? 'Voir' : 'Open',
                  },
                  {
                    key: 'certification',
                    icon: '🏅',
                    title: isFr ? 'Certification' : 'Certification',
                    desc: isFr ? 'Qualifiez vos productions pour les marchés' : 'Qualify produce for markets',
                    locked: !isGrowth,
                    action: () => setActiveTab('certification'),
                    actionLabel: isFr ? 'Voir' : 'Open',
                  },
                  {
                    key: 'afriyield',
                    icon: '🌍',
                    title: 'AfriYield Exchange',
                    desc: isFr ? 'Connectez-vous aux investisseurs diaspora' : 'Connect with diaspora investors',
                    locked: !afriyieldUnlocked,
                    action: () =>
                      afriyieldUnlocked
                        ? window.open('/afri-yield/opportunities', '_blank')
                        : setActiveTab('afriyield'),
                    actionLabel: isFr ? 'Ouvrir' : 'Open',
                  },
                  {
                    key: 'export',
                    icon: '📦',
                    title: isFr ? 'Export International' : 'International Export',
                    desc: isFr ? 'Préparez vos produits pour l’export' : 'Prepare products for export',
                    locked: !isGrowth,
                    action: () => setActiveTab('export'),
                    actionLabel: isFr ? 'Voir' : 'Open',
                  },
                  {
                    key: 'financing',
                    icon: '💰',
                    title: isFr ? 'Financement' : 'Financing',
                    desc: isFr
                      ? `Fonds équipements${pendingEquipmentApps ? ` · ${pendingEquipmentApps} en cours` : ''}`
                      : `Equipment fund${pendingEquipmentApps ? ` · ${pendingEquipmentApps} pending` : ''}`,
                    locked: false,
                    action: () => setShowFinanceForm(true),
                    secondary: () => navigate('/equipment-fund'),
                    secondaryLabel: isFr ? 'Fonds équipements' : 'Equipment fund',
                    actionLabel: isFr ? 'Demander' : 'Apply',
                  },
                  {
                    key: 'processor',
                    icon: '🏭',
                    title: isFr ? 'Centre de Transformation' : 'Transformation Center',
                    desc: processorId
                      ? processorName || (isFr ? 'Centre associé' : 'Linked center')
                      : isFr
                        ? 'Associez un centre pour l’export transformé'
                        : 'Link a center for processed export',
                    locked: false,
                    action: openProcessorModal,
                    actionLabel: processorId
                      ? isFr
                        ? 'Changer'
                        : 'Change'
                      : isFr
                        ? 'Associer un centre'
                        : 'Link a center',
                    directory: () => navigate('/centres-transformation'),
                  },
                ].map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-2xl border p-4 flex flex-col ${
                      card.locked
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-2xl ${card.locked ? 'grayscale' : ''}`}>{card.icon}</span>
                      {card.locked ? <Lock className="w-4 h-4 text-gray-400 shrink-0" /> : null}
                    </div>
                    <h4 className={`font-bold text-sm mb-1 ${card.locked ? 'text-gray-500' : 'text-[#1a3c2e]'}`}>
                      {card.title}
                    </h4>
                    <p className="text-xs text-gray-500 flex-1 mb-3">{card.desc}</p>
                    {card.locked ? (
                      <p className="text-[11px] text-gray-400 leading-snug">
                        {isFr
                          ? 'Disponible avec 51+ membres et Plan Croissance'
                          : 'Available with 51+ members and Growth Plan'}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={card.action}
                          className="text-xs font-bold px-3 py-2 rounded-lg text-white"
                          style={{ background: '#1a3c2e' }}
                        >
                          {card.actionLabel}
                        </button>
                        {card.secondary ? (
                          <button
                            type="button"
                            onClick={card.secondary}
                            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            {card.secondaryLabel}
                          </button>
                        ) : null}
                        {card.directory ? (
                          <button
                            type="button"
                            onClick={card.directory}
                            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            {isFr ? 'Annuaire' : 'Directory'}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Special Opportunities */}
            <div>
              <h3 className="font-bold text-[#1a3c2e] mb-3">
                {isFr ? 'Opportunités spéciales' : 'Special Opportunities'}
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  {
                    icon: '🎓',
                    title: isFr ? 'Formation aux États-Unis' : 'US Training Program',
                    desc: isFr
                      ? 'Accès aux programmes de formation agricole aux États-Unis pour les leaders de coopératives'
                      : 'Access to US agricultural training programs for cooperative leaders',
                    lock: isFr ? '51+ membres requis' : '51+ members required',
                    unlockCond: isGrowth,
                  },
                  {
                    icon: '🏆',
                    title: isFr ? 'Certification USDA/UE' : 'USDA/EU Certification',
                    desc: isFr
                      ? "Certifiez vos productions pour l'export vers les marchés américains et européens"
                      : 'Certify your production for export to US and European markets',
                    lock: isFr ? 'Plan Croissance requis' : 'Growth Plan required',
                    unlockCond: isGrowth,
                  },
                  {
                    icon: '🌍',
                    title: isFr ? 'Export Produits Transformés' : 'Processed Products Export',
                    desc: isFr
                      ? 'Exportez vos produits transformés, pas comme matière première'
                      : 'Export your processed products, not as raw materials',
                    lock: isFr
                      ? 'Partenariat centre de transformation requis'
                      : 'Transformation center partnership required',
                    unlockCond: Boolean(processorId),
                  },
                ].map((op) => {
                  const unlocked = specialUnlocked && op.unlockCond;
                  return (
                    <div
                      key={op.title}
                      className={`rounded-2xl border p-4 ${
                        unlocked ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-2xl ${unlocked ? '' : 'grayscale opacity-70'}`}>{op.icon}</span>
                        {!unlocked ? <Lock className="w-4 h-4 text-gray-400" /> : null}
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${unlocked ? 'text-[#1a3c2e]' : 'text-gray-500'}`}>
                        {op.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{op.desc}</p>
                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `mailto:support@woneapp.com?subject=${encodeURIComponent(op.title)}`,
                              '_blank'
                            )
                          }
                          className="text-xs font-bold px-3 py-2 rounded-lg text-white"
                          style={{ background: '#B5850A' }}
                        >
                          {isFr ? 'Postuler' : 'Apply'}
                        </button>
                      ) : (
                        <p className="text-[11px] text-gray-400">{op.lock}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {!specialUnlocked ? (
                <p className="text-xs text-gray-400 mt-2">
                  {isFr
                    ? 'Débloquez les 3 opportunités avec Plan Croissance, 51+ membres et un centre de transformation associé.'
                    : 'Unlock all 3 with Growth Plan, 51+ members, and a linked transformation center.'}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'farmers' && !loading && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-[#1a3c2e]">👩‍🌾 {isFr ? 'Gestion des membres' : 'Member management'}</h3>
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

              <div className="px-4 pt-3 flex flex-wrap gap-2 border-b border-gray-100">
                {[
                  { key: 'active', label: isFr ? 'Membres actifs' : 'Active Members' },
                  {
                    key: 'pending',
                    label: `${isFr ? 'Demandes en attente' : 'Pending Requests'}${
                      pendingJoinCount ? ` (${pendingJoinCount})` : ''
                    }`,
                  },
                  {
                    key: 'offline',
                    label: isFr ? 'Membres hors-plateforme' : 'Offline members',
                  },
                  { key: 'payments', label: isFr ? 'Paiements membres' : 'Member Payments' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setMembersSubTab(t.key)}
                    className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 ${
                      membersSubTab === t.key
                        ? 'border-[#1a3c2e] text-[#1a3c2e]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {membersSubTab === 'active' && (
                <>
                  {(data?.memberFarmers || []).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3">👩‍🌾</p>
                      <p className="text-gray-500 text-sm">
                        {isFr
                          ? 'Aucun membre pour le moment. Invitez des agriculteurs.'
                          : 'No members yet. Invite farmers.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {[
                              isFr ? 'Nom' : 'Name',
                              isFr ? 'Cultures' : 'Crops',
                              isFr ? 'Superficie' : 'Area',
                              isFr ? 'Région' : 'Region',
                              isFr ? 'Vérifié' : 'Verified',
                              isFr ? 'Paiement' : 'Payment',
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.memberFarmers || []).map((f, i) => (
                            <tr key={f._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="px-4 py-3 font-medium text-[#1a3c2e]">{f.nom || '—'}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">
                                {Array.isArray(f.cultures) ? f.cultures.join(', ') : '—'}
                              </td>
                              <td className="px-4 py-3 font-mono">
                                {f.superficie ? `${f.superficie} ha` : '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{f.region || '—'}</td>
                              <td className="px-4 py-3">
                                {f.emailVerified ? (
                                  <span className="text-green-600 text-xs font-semibold">
                                    ✓ {isFr ? 'Vérifié' : 'Verified'}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">
                                    {isFr ? 'Non vérifié' : 'Unverified'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <PaymentStatusDot
                                    status={duesStatusByMember[String(f._id)] || 'none'}
                                    title={
                                      duesStatusByMember[String(f._id)] === 'paid'
                                        ? isFr
                                          ? 'Payé ce mois'
                                          : 'Paid this month'
                                        : duesStatusByMember[String(f._id)] === 'late'
                                          ? isFr
                                            ? 'Payé le mois dernier'
                                            : 'Paid last month'
                                          : isFr
                                            ? 'Aucun paiement'
                                            : 'No payment'
                                    }
                                    onClick={() =>
                                      openQuickPay({
                                        memberType: 'platform',
                                        memberId: String(f._id),
                                        memberName: f.nom || '',
                                      })
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openQuickPay({
                                        memberType: 'platform',
                                        memberId: String(f._id),
                                        memberName: f.nom || '',
                                      })
                                    }
                                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-[#1a3c2e]/30 text-[#1a3c2e] hover:bg-[#1a3c2e]/5"
                                  >
                                    {isFr ? 'Payer' : 'Pay'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {membersSubTab === 'pending' && (
                <div className="p-4 space-y-3">
                  {pendingJoinCount === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-10">
                      {isFr ? 'Aucune demande en attente.' : 'No pending join requests.'}
                    </p>
                  ) : (
                    (data.joinRequests || []).map((jr) => (
                      <div
                        key={jr._id}
                        className="rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-[#1a3c2e] text-sm">{jr.farmerName || '—'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {jr.farmerRegion || '—'}
                            {' · '}
                            {(jr.farmerCropTypes || []).slice(0, 3).join(', ') || '—'}
                          </p>
                          {jr.message ? (
                            <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{jr.message}&rdquo;</p>
                          ) : null}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={joinReviewBusy === jr._id}
                            onClick={() => reviewJoinRequest(jr._id, 'approve')}
                            className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {isFr ? 'Approuver' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={joinReviewBusy === jr._id}
                            onClick={() => reviewJoinRequest(jr._id, 'decline')}
                            className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {isFr ? 'Refuser' : 'Decline'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {membersSubTab === 'offline' && token ? (
                <ManualMembersPanel
                  API={API}
                  headers={headers}
                  isFr={isFr}
                  onChanged={refreshPortal}
                />
              ) : null}

              {membersSubTab === 'payments' && token ? (
                <DuesPaymentsPanel
                  API={API}
                  headers={headers}
                  isFr={isFr}
                  platformMembers={data?.memberFarmers || []}
                  suggestedAmount=""
                  prefillMember={duesPrefill}
                  onPrefillConsumed={() => setDuesPrefill(null)}
                  onStatusChange={setDuesStatusByMember}
                />
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'ics' && !loading && token ? (
          <ICSScorePanel API={API} headers={headers} isFr={isFr} />
        ) : null}

        {activeTab === 'certification' && !loading && (
          isGrowth ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <div>
                <h3 className="font-bold text-[#1a3c2e] mb-2">🏅 {isFr ? 'Certification' : 'Certification'}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {isFr
                    ? 'Votre plan Croissance débloque le workflow de certification et le parcours USDA (partenariat DSU).'
                    : 'Your Growth plan unlocks the certification workflow and USDA pathway (DSU partnership).'}
                </p>
                <Link
                  to="/farmer-certification"
                  className="inline-flex px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#1a3c2e' }}
                >
                  {isFr ? 'Ouvrir le programme de certification →' : 'Open certification program →'}
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h4 className="font-bold text-[#1a3c2e] text-sm mb-2">
                  {isFr ? 'Dossier de certification ICS' : 'ICS certification dossier'}
                </h4>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 mb-4">
                  {isFr
                    ? 'Ce dossier est généré automatiquement à partir des données de votre coopérative. Il peut être soumis directement à Ecocert, Control Union ou tout autre organisme certificateur.'
                    : 'This dossier is automatically generated from your cooperative data. It can be submitted directly to Ecocert, Control Union or any other certification body.'}
                </div>
                {dossierError ? (
                  <p className="text-sm text-red-600 mb-3">{dossierError}</p>
                ) : null}
                <button
                  type="button"
                  disabled={dossierBusy || !token}
                  onClick={async () => {
                    setDossierBusy(true);
                    setDossierError('');
                    try {
                      const lang = String(i18n.language || 'fr').toLowerCase().startsWith('en')
                        ? 'en'
                        : 'fr';
                      const r = await fetch(
                        `${API}/api/certification-dossier/generate?lang=${lang}`,
                        { headers }
                      );
                      if (!r.ok) {
                        throw new Error(
                          isFr
                            ? 'Erreur lors de la génération du dossier. Veuillez réessayer.'
                            : 'Error generating dossier. Please try again.'
                        );
                      }
                      const blob = await r.blob();
                      const cd = r.headers.get('Content-Disposition') || '';
                      const match = cd.match(/filename="?([^"]+)"?/i);
                      const filename =
                        match?.[1] ||
                        `dossier-certification-${lang}-${new Date().toISOString().slice(0, 10)}.pdf`;
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch {
                      setDossierError(
                        isFr
                          ? 'Erreur lors de la génération du dossier. Veuillez réessayer.'
                          : 'Error generating dossier. Please try again.'
                      );
                    } finally {
                      setDossierBusy(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: '#1a3c2e' }}
                >
                  {dossierBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {dossierBusy
                    ? isFr
                      ? 'Génération…'
                      : 'Generating…'
                    : isFr
                      ? 'Générer le dossier'
                      : 'Generate Dossier'}
                </button>
              </div>
            </div>
          ) : (
            <GrowthLockedPanel
              isFr={isFr}
              navigate={navigate}
              verifiedCount={verifiedMemberCount}
              declaredCount={declaredMembers}
            />
          )
        )}

        {activeTab === 'afriyield' && !loading && (
          afriyieldUnlocked ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-[#1a3c2e] mb-2">🌍 AfriYield Exchange</h3>
              <p className="text-gray-600 text-sm mb-4">
                {isFr
                  ? 'Listez vos productions certifiées et connectez-vous aux investisseurs diaspora.'
                  : 'List certified produce and connect with diaspora investors.'}
              </p>
              <a
                href="/afri-yield/opportunities"
                target="_blank"
                rel="noreferrer"
                className="inline-flex px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: '#B5850A' }}
              >
                {isFr ? 'Ouvrir AfriYield →' : 'Open AfriYield →'}
              </a>
            </div>
          ) : isGrowth && pendingFullVerification ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-amber-200 px-6">
              <span className="text-4xl mb-4">🔒</span>
              <p className="text-[#1a3c2e] font-semibold mb-2">
                {isFr ? 'AfriYield — Accès provisoire' : 'AfriYield — Provisional access'}
              </p>
              <p className="text-amber-800 text-sm mb-4 max-w-sm font-semibold">
                {isFr
                  ? `Disponible à 25 membres vérifiés (actuellement ${verifiedMemberCount}/25)`
                  : `Available at 25 verified members (currently ${verifiedMemberCount}/25)`}
              </p>
              <div className="w-full max-w-xs h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((verifiedMemberCount / 25) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <GrowthLockedPanel
              isFr={isFr}
              navigate={navigate}
              verifiedCount={verifiedMemberCount}
              declaredCount={declaredMembers}
            />
          )
        )}

        {activeTab === 'export' && !loading && (
          isGrowth ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-[#1a3c2e] mb-2">📦 {isFr ? 'Export diaspora' : 'Diaspora export'}</h3>
              <p className="text-gray-600 text-sm">
                {isFr
                  ? 'Outils de préparation à l\'export vers les marchés USA et Europe — débloqués sur le plan Croissance.'
                  : 'Export readiness tools for USA and Europe markets — unlocked on the Growth plan.'}
              </p>
            </div>
          ) : (
            <GrowthLockedPanel
              isFr={isFr}
              navigate={navigate}
              verifiedCount={verifiedMemberCount}
              declaredCount={declaredMembers}
            />
          )
        )}

        {activeTab === 'produce' && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-xl font-bold text-[#1a3c2e]">
                🌾 {isFr ? 'Récoltes des membres' : 'Member harvests'}
              </h3>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHarvestSubTab('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    harvestSubTab === 'pending'
                      ? 'bg-white text-[#1a3c2e] shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {isFr ? `À vérifier (${pendingHarvestCount})` : `To verify (${pendingHarvestCount})`}
                </button>
                <button
                  type="button"
                  onClick={() => setHarvestSubTab('verified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    harvestSubTab === 'verified'
                      ? 'bg-white text-[#1a3c2e] shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {isFr ? `Vérifiés (${verifiedHarvestCount})` : `Verified (${verifiedHarvestCount})`}
                </button>
              </div>
            </div>

            {harvestLoading ? (
              <div className="flex justify-center py-14">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e]" />
              </div>
            ) : (
              (() => {
                const list = harvestLogs.filter((h) =>
                  harvestSubTab === 'verified' ? h.verifiedByCoop : !h.verifiedByCoop
                );
                if (list.length === 0) {
                  return (
                    <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                      <p className="text-5xl mb-3">🌾</p>
                      <p className="text-gray-500 text-sm">
                        {harvestSubTab === 'verified'
                          ? isFr
                            ? 'Aucun lot vérifié pour le moment.'
                            : 'No verified batches yet.'
                          : isFr
                            ? 'Aucun lot en attente de vérification.'
                            : 'No batches waiting for verification.'}
                      </p>
                    </div>
                  );
                }
                return list.map((h) => (
                  <div
                    key={h._id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-[#1a3c2e] text-lg">
                        {cropLabel(h.cropType, isFr)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {h.farmerName || h.farmer?.nom || (isFr ? 'Agriculteur' : 'Farmer')}
                        {h.farmerRegion || h.farmer?.region
                          ? ` · ${h.farmerRegion || h.farmer.region}`
                          : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {h.quantityKg != null ? `${Number(h.quantityKg).toLocaleString()} kg` : ''}
                        {h.qualityGrade
                          ? ` · ${
                              h.qualityGrade === 'ungraded'
                                ? isFr
                                  ? 'Non classé'
                                  : 'Ungraded'
                                : h.qualityGrade
                            }`
                          : ''}
                        {h.harvestDate
                          ? ` · ${new Date(h.harvestDate).toLocaleDateString()}`
                          : ''}
                      </p>
                      <p className="text-xs font-mono text-[#B5850A] mt-2">{h.batchId}</p>
                      {h.verifiedByCoop ? (
                        <span className="inline-flex mt-2 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                          ✓ {isFr ? 'Vérifié' : 'Verified'}
                          {h.verifiedAt
                            ? ` · ${new Date(h.verifiedAt).toLocaleDateString()}`
                            : ''}
                        </span>
                      ) : (
                        <span className="inline-flex mt-2 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {isFr ? 'En attente' : 'Pending'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {h.verifiedByCoop ? (
                        <button
                          type="button"
                          onClick={() => setHarvestQrBatchId(h.batchId)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#c9962a]/40 bg-[#c9962a]/10 px-3 py-2.5 text-sm font-bold text-[#854d0e] hover:bg-[#c9962a]/20"
                          title="QR"
                          aria-label="QR"
                        >
                          <QrCode className="w-4 h-4" />
                          QR
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={harvestVerifyBusy === h._id}
                          onClick={() => verifyHarvestLog(h._id)}
                          className="text-sm font-bold px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
                          style={{ background: '#1a3c2e' }}
                        >
                          {harvestVerifyBusy === h._id
                            ? '…'
                            : isFr
                              ? 'Vérifier ce lot'
                              : 'Verify this batch'}
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()
            )}

            {harvestQrBatchId ? (
              <HarvestQrModal
                batchId={harvestQrBatchId}
                isFr={isFr}
                onClose={() => setHarvestQrBatchId('')}
              />
            ) : null}
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

            {/* Incoming join requests */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-[#1a3c2e] mb-3 uppercase tracking-wide">
                {isFr ? 'Demandes d\'adhésion' : 'Join requests'}
                {pendingJoinCount > 0 ? (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-xs font-bold">
                    {pendingJoinCount}
                  </span>
                ) : null}
              </h4>
              {pendingJoinCount === 0 ? (
                <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 px-4 py-6 text-center">
                  {isFr ? 'Aucune demande en attente.' : 'No pending join requests.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {(data.joinRequests || []).map((jr) => (
                    <div
                      key={jr._id}
                      className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-[#1a3c2e] text-sm">{jr.farmerName || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {jr.farmerRegion || '—'}
                          {' · '}
                          {(jr.farmerCropTypes || []).slice(0, 3).join(', ') || '—'}
                        </p>
                        {jr.message ? (
                          <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{jr.message}&rdquo;</p>
                        ) : null}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {jr.requestedAt ? new Date(jr.requestedAt).toLocaleString() : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={joinReviewBusy === jr._id}
                          onClick={() => reviewJoinRequest(jr._id, 'approve')}
                          className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold disabled:opacity-50"
                        >
                          {isFr ? 'Approuver' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={joinReviewBusy === jr._id}
                          onClick={() => reviewJoinRequest(jr._id, 'decline')}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                        >
                          {isFr ? 'Refuser' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#1a3c2e] uppercase tracking-wide">
                {isFr ? 'Invitations envoyées' : 'Sent invitations'}
              </h4>
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

        {activeTab === 'formations' && (
          <div>
            {!isGrowth ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-200 px-6">
                <span className="text-4xl mb-4">🔒</span>
                <p className="text-[#1a3c2e] font-semibold mb-2 max-w-md">
                  {growthEligibilityTip(isFr, progressMembers, declaredMembers)}
                </p>
                <p className="text-amber-700 font-bold text-lg mb-2">
                  {progressMembers} {isFr ? 'vérifiés' : 'verified'} · {declaredMembers}{' '}
                  {isFr ? 'déclarés' : 'declared'}
                </p>
                <GrowthUpgradeButton
                  isFr={isFr}
                  navigate={navigate}
                  verifiedCount={progressMembers}
                  declaredCount={declaredMembers}
                  className="px-6 py-3"
                  labelFr="Passer au plan Croissance"
                  labelEn="Upgrade to Growth"
                />
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-[#1a3c2e] mb-4">
                  🎓 {isFr ? 'Formations disponibles' : 'Available training'}
                </h3>
                {trainingsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e]" />
                  </div>
                ) : trainings.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-200">
                    {isFr ? 'Aucune formation planifiée pour le moment.' : 'No trainings scheduled yet.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {trainings.map((t) => (
                      <div
                        key={t._id}
                        className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-[#1a3c2e]">{t.titre || t.sujet || 'Formation'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[t.region, t.niveau, t.format].filter(Boolean).join(' · ')}
                          </p>
                          {t.description ? (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>
                          ) : null}
                        </div>
                        <a
                          href={`mailto:support@sahelagriconnect.com?subject=${encodeURIComponent(
                            `Inscription formation: ${t.titre || t.sujet || ''}`
                          )}`}
                          className="shrink-0 px-4 py-2 rounded-lg text-white text-xs font-bold text-center"
                          style={{ background: '#1a3c2e' }}
                        >
                          {isFr ? 'S\'inscrire' : 'Register'}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
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
                <p className="text-xs text-gray-500">
                  {isFr
                    ? 'Entrez un email ou un téléphone — nous recherchons le profil automatiquement.'
                    : 'Enter an email or phone — we look up the profile automatically.'}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Téléphone (WhatsApp)' : 'Phone (WhatsApp)'}
                  </label>
                  <input
                    value={inviteForm.inviteePhone}
                    onChange={(e) => {
                      setInviteLookup({ status: 'idle', found: null });
                      setInviteForm((f) => ({ ...f, inviteePhone: e.target.value }));
                    }}
                    onBlur={() => lookupFarmerContact('phone')}
                    className={INPUT_LIGHT}
                    placeholder="+223 …"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteForm.inviteeEmail}
                    onChange={(e) => {
                      setInviteLookup({ status: 'idle', found: null });
                      setInviteForm((f) => ({ ...f, inviteeEmail: e.target.value }));
                    }}
                    onBlur={() => lookupFarmerContact('email')}
                    className={INPUT_LIGHT}
                    placeholder="farmer@…"
                  />
                </div>
                {inviteLookup.status === 'loading' ? (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isFr ? 'Recherche…' : 'Looking up…'}
                  </p>
                ) : null}
                {inviteLookup.status === 'done' && inviteLookup.found === true ? (
                  <p className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    ✓ {isFr ? 'Profil trouvé' : 'Profile found'}
                    {inviteForm.inviteeCrops?.length
                      ? ` · ${inviteForm.inviteeCrops.slice(0, 4).join(', ')}`
                      : ''}
                  </p>
                ) : null}
                {inviteLookup.status === 'done' && inviteLookup.found === false ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {isFr
                      ? 'Pas encore inscrit — une invitation sera envoyée'
                      : 'Not yet registered — an invitation will be sent'}
                  </p>
                ) : null}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? "Nom de l'agriculteur" : 'Farmer name'}
                  </label>
                  <input
                    value={inviteForm.inviteeName}
                    onChange={(e) => setInviteForm((f) => ({ ...f, inviteeName: e.target.value }))}
                    className={INPUT_LIGHT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Région' : 'Region'}
                  </label>
                  <input
                    value={inviteForm.inviteeRegion}
                    onChange={(e) => setInviteForm((f) => ({ ...f, inviteeRegion: e.target.value }))}
                    className={INPUT_LIGHT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Message personnel' : 'Personal message'}
                  </label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm((f) => ({ ...f, message: e.target.value }))}
                    rows={2}
                    placeholder={
                      isFr
                        ? 'Ex: Nous cherchons des producteurs de karité dans votre zone...'
                        : 'Ex: We are looking for shea producers in your area...'
                    }
                    className={`${INPUT_LIGHT} resize-none`}
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

      {showProcessorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1a3c2e] text-lg">
                🏭 {isFr ? 'Associer un centre' : 'Link a center'}
              </h3>
              <button type="button" onClick={() => setShowProcessorModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {processorsLoading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3c2e] mx-auto" />
              </div>
            ) : processors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">
                  {isFr
                    ? 'Aucun centre actif dans votre pays pour le moment.'
                    : 'No active centers in your country yet.'}
                </p>
                <Link
                  to="/centres-transformation"
                  className="text-sm font-bold text-[#1a3c2e] underline"
                  onClick={() => setShowProcessorModal(false)}
                >
                  {isFr ? 'Voir l’annuaire' : 'Browse directory'}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {processors.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={linkProcessorBusy}
                    onClick={() => linkProcessor(p.id)}
                    className="w-full text-left rounded-xl border border-gray-200 px-4 py-3 hover:border-[#1a3c2e] hover:bg-[#1a3c2e]/5 disabled:opacity-50"
                  >
                    <p className="font-semibold text-sm text-[#1a3c2e]">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.regionCity || '—'}
                      {p.processingTypes?.length ? ` · ${p.processingTypes.slice(0, 3).join(', ')}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showFinanceForm ? (
        <CooperativeFinanceForm
          cooperativeId={data?.cooperative?.id}
          onClose={() => setShowFinanceForm(false)}
          onSubmit={() => {
            setShowFinanceForm(false);
            refreshPortal();
          }}
        />
      ) : null}

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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 mb-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
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
