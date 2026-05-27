import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Wallet,
  TrendingUp,
  Newspaper,
  HelpCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowRight,
  Check,
  Lock,
  Star,
  X,
  Trash2,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { API_ENDPOINTS } from '../config/api';
import TransactionTracker from '../components/TransactionTracker';
import InvestorAccountStatus from '../components/InvestorAccountStatus';

const API = API_BASE_URL.replace(/\/$/, '');
const EUR_RATE = 0.92;

const COMMODITIES = [
  { key: 'shea', emoji: '🌿', price: 1.85, trend: 'up', demand: 'high' },
  { key: 'sesame', emoji: '🌾', price: 1.45, trend: 'stable', demand: 'high' },
  { key: 'cashew', emoji: '🥜', price: 3.2, trend: 'up', demand: 'medium' },
  { key: 'mango', emoji: '🥭', price: 4.1, trend: 'stable', demand: 'medium' },
];

const NEWS = [
  { key: 'n1', tag: 'market', date: 'May 2026', time: 2, premium: false },
  { key: 'n2', tag: 'price', date: 'April 2026', time: 2, premium: false },
  { key: 'n3', tag: 'goodToKnow', date: 'April 2026', time: 3, premium: true },
  { key: 'n4', tag: 'opportunity', date: 'March 2026', time: 2, premium: true },
  { key: 'n5', tag: 'action', date: 'March 2026', time: 4, premium: true },
];

const TAG_COLORS = {
  market: 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25',
  price: 'bg-[#B5850A]/15 text-[#B5850A] border border-[#B5850A]/25',
  goodToKnow: 'bg-white/10 text-[#F5F0E8]/90 border border-white/15',
  action: 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25',
  opportunity: 'bg-[#B5850A]/10 text-[#F5F0E8] border border-[#B5850A]/30',
};

const JOURNEY_STEPS = ['received', 'purchased', 'working', 'payout'];

const SPARKLINES = {
  shea: 'M0,40 L20,35 L40,30 L60,28 L80,20 L100,15',
  sesame: 'M0,30 L20,32 L40,28 L60,30 L80,29 L100,30',
  cashew: 'M0,45 L20,40 L40,35 L60,30 L80,25 L100,18',
  mango: 'M0,35 L20,33 L40,32 L60,30 L80,28 L100,25',
};

const COMMODITY_NAMES = {
  shea: { en: 'Shea Butter', fr: 'Beurre de Karité' },
  sesame: { en: 'Sesame', fr: 'Sésame' },
  cashew: { en: 'Cashew', fr: 'Noix de cajou' },
  mango: { en: 'Dried Mango', fr: 'Mangue séchée' },
};

function formatUSD(n) {
  return `$${Number(n).toLocaleString('en-US')}`;
}
function formatEUR(n) {
  return `€${Math.round(n * EUR_RATE).toLocaleString('en-US')}`;
}

function InvestmentPaymentNotice({ t }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
      <p className="text-amber-400 font-semibold text-sm mb-1">
        💳 {t('investorPortal.paymentProcessingTitle')}
      </p>
      <p className="text-white/60 text-xs leading-relaxed">
        {t('investorPortal.paymentProcessingBody')}
      </p>
      <p className="text-white/40 text-xs mt-2">{t('investorPortal.projectedReturnsNote')}</p>
      <p className="text-white/35 text-xs mt-2">{t('investorPortal.paymentWebOnly')}</p>
    </div>
  );
}

function formatMonthYear(d) {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getInitials(fullName) {
  return (fullName || 'IN')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ─── IDENTIFICATION SCREEN ─────────────────────────────────────────── */
function AccessScreen({ onAccess, t }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // email | code
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const sendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.VERIFY.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email: email.trim().toLowerCase(),
          role: 'investor',
          lang: isFr ? 'fr' : 'en',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Send failed');
      setVerificationId(data.verificationId || '');
      setStep('code');
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await fetch(API_ENDPOINTS.VERIFY.CONFIRM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email: email.trim().toLowerCase(),
          code,
          role: 'investor',
          verificationId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');
      if (!data.token) throw new Error(isFr ? 'Compte non activé.' : 'Account not active yet.');
      const investor = {
        email: data.user?.email || email.trim().toLowerCase(),
        fullName: data.user?.name || '',
        status: data.user?.status,
      };
      sessionStorage.setItem('afriyield_token', data.token);
      sessionStorage.setItem('afriyield_investor_email', investor.email);
      sessionStorage.setItem('afriyield_investor_name', investor.fullName || '');
      localStorage.setItem('afriyield_investor_email', investor.email);
      localStorage.setItem('afriyield_investor_name', investor.fullName || '');
      localStorage.removeItem('sac_user_email');
      localStorage.removeItem('sac_user_name');
      window.dispatchEvent(new Event('web_session_updated'));
      onAccess(investor);
    } catch (e2) {
      setError(e2.message || (isFr ? 'Échec de connexion' : 'Sign-in failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ip-root min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(160deg,#0d1f17 0%,#132a1e 60%,#1a3c2e 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ip-root .tabular-nums { font-family: 'Courier New', Courier, monospace; }
      `}</style>

      <div className="w-full max-w-[375px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img
              src="/sahel-logo.png"
              alt="Sahel AgriConnect"
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="text-[#B5850A] font-bold text-xl tracking-wide">AfriYield Exchange</span>
          </div>
          <h1 className="font-bold text-2xl leading-snug mb-2" style={{ color: '#F5F0E8' }}>
            {t('investorPortal.access.title')}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>
            {t('investorPortal.access.subtitle')}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {['🌱', '🌿', '🌾'].map((e, i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: 'rgba(181,133,10,0.15)',
                border: '1px solid rgba(181,133,10,0.3)',
              }}
            >
              {e}
            </div>
          ))}
        </div>

        {!notFound ? (
          step === 'email' ? (
            <form onSubmit={sendCode} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('investorPortal.access.placeholder')}
                className="w-full rounded-2xl px-5 py-4 text-gray-900 text-base outline-none focus:ring-2 focus:ring-[#B5850A] bg-[#F5F0E8]"
              />
              {error ? (
                <p className="text-xs rounded-xl px-3 py-2 border" style={{ color: '#FCA5A5', borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.10)' }}>
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl py-4 font-bold text-base transition"
                style={{
                  background: loading ? '#8a6508' : '#B5850A',
                  color: '#0d1f17',
                }}
              >
                {loading ? (isFr ? 'Envoi du code…' : 'Sending code…') : (isFr ? 'Recevoir mon code' : 'Send me a code')}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmCode} className="space-y-3">
              <p className="text-xs text-center" style={{ color: 'rgba(245,240,232,0.55)' }}>
                {isFr ? 'Code envoyé à ' : 'Code sent to '} <span style={{ color: '#F5F0E8', fontWeight: 700 }}>{email}</span>
              </p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={isFr ? 'Code (6 chiffres)' : '6-digit code'}
                className="w-full rounded-2xl px-5 py-4 text-gray-900 text-base outline-none focus:ring-2 focus:ring-[#B5850A] bg-[#F5F0E8] tracking-widest text-center font-mono"
              />
              {error ? (
                <p className="text-xs rounded-xl px-3 py-2 border" style={{ color: '#FCA5A5', borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.10)' }}>
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-2xl py-4 font-bold text-base transition disabled:opacity-60"
                style={{
                  background: loading ? '#8a6508' : '#B5850A',
                  color: '#0d1f17',
                }}
              >
                {loading ? (isFr ? 'Connexion…' : 'Signing in…') : (isFr ? 'Accéder à mon portail' : 'Access my portal')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="w-full text-xs hover:underline"
                style={{ color: 'rgba(245,240,232,0.55)' }}
              >
                {isFr ? '← Changer d’email' : '← Change email'}
              </button>
            </form>
          )
        ) : (
          <div
            className="rounded-2xl p-6 text-center space-y-4"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(181,133,10,0.25)',
            }}
          >
            <div className="text-4xl">🌱</div>
            <p className="font-semibold" style={{ color: '#F5F0E8' }}>
              {t('investorPortal.access.notFound')}
            </p>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>
              {t('investorPortal.access.notFoundSub')}
            </p>
            <Link
              to="/afri-yield/register"
              className="block w-full rounded-2xl py-3 font-bold"
              style={{ background: '#B5850A', color: '#0d1f17' }}
            >
              {t('investorPortal.access.startJourney')} →
            </Link>
            <button
              type="button"
              onClick={() => setNotFound(false)}
              className="text-sm transition"
              style={{ color: 'rgba(245,240,232,0.55)' }}
            >
              {t('investorPortal.access.tryAgain')}
            </button>
          </div>
        )}

        <div
          className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-center"
          style={{ color: 'rgba(245,240,232,0.45)' }}
        >
          <span>
            🔒 {t('investorPortal.trust.secure')}
          </span>
          <span>
            🌍 {t('investorPortal.trust.panAfrican')}
          </span>
          <span>
            💰 {t('investorPortal.trust.realReturns')}
          </span>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'rgba(245,240,232,0.45)' }}>
          {t('investorPortal.access.newHere')}{' '}
          <Link to="/afri-yield/register" className="text-[#B5850A] hover:underline font-medium">
            {t('investorPortal.access.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── HOME TAB ──────────────────────────────────────────────────────── */
function HomeTab({ investor, investments, notifications, kyc, t, navigate, onOpenNotifications }) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const firstName = (investor?.fullName || '').split(' ')[0];
  const hasInvestments = investments && investments.length > 0;
  const mainInv = hasInvestments ? investments[0] : null;
  const showStatusTracker = !hasInvestments || (kyc && (!kyc.paymentVerified || kyc.status !== 'approved'));
  const totalDeployed = (investments || []).reduce((s, i) => s + (Number(i.amountDeployed) || 0), 0);
  const activeCount = (investments || []).filter((i) => i.status === 'active').length;
  const completedCount = (investments || []).filter((i) => i.status === 'completed').length;

  const activity = [
    {
      dot: 'bg-[#22c55e]',
      text: t('investorPortal.home.profileVerified'),
      when: t('investorPortal.home.today'),
    },
    {
      dot: 'bg-[#B5850A]',
      text: t('investorPortal.home.harvestSeason'),
      when: 'May 2026',
    },
    {
      dot: 'bg-[#22c55e]',
      text: t('investorPortal.home.payoutComing'),
      when: t('investorPortal.home.comingUp'),
    },
  ];

  const unreadPreview = (notifications || []).filter((n) => !n.read).slice(0, 4);
  const previewList = (unreadPreview.length ? unreadPreview : (notifications || []).slice(0, 4)) || [];
  const nextPayout = mainInv?.payoutSchedule?.find((p) => p?.payoutDate)?.payoutDate;

  return (
    <div className="space-y-5 pb-24 md:pb-10">
      {/* Desktop: two columns */}
      <div className="md:grid md:grid-cols-10 md:gap-6">
        {/* Left column */}
        <div className="md:col-span-6 space-y-5">
          <div className="px-4 pt-6 md:px-6">
            <h1 className="font-bold text-2xl md:text-3xl" style={{ color: '#F5F0E8' }}>
              {t('investorPortal.home.greeting')}, {firstName} 👋
            </h1>
            <p className="text-sm mt-1 md:text-base" style={{ color: 'rgba(245,240,232,0.55)' }}>
              {t('investorPortal.home.subtitle')}
            </p>
          </div>

          {showStatusTracker && kyc ? (
            <InvestorAccountStatus kyc={kyc} hasInvestments={hasInvestments} isFr={isFr} />
          ) : null}

          {/* Main investment card — desktop wider with 1-row stats */}
          <div className="mx-4 md:mx-6 rounded-2xl p-5" style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.25)' }}>
            {mainInv ? (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-0">
                  {[
                    [isFr ? 'Capital déployé' : 'Capital deployed', formatUSD(totalDeployed)],
                    [isFr ? 'Deals actifs' : 'Active deals', String(activeCount)],
                    [isFr ? 'Complétés' : 'Completed', String(completedCount)],
                    [t('investorPortal.home.nextHarvest'), nextPayout ? formatMonthYear(nextPayout) : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="md:px-3 md:border-l md:first:border-l-0" style={{ borderColor: 'rgba(181,133,10,0.15)' }}>
                      <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(245,240,232,0.55)' }}>
                        {label}
                      </p>
                      <p className="tabular-nums text-[#B5850A] text-2xl md:text-3xl font-bold mt-1">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <p className="text-xs mb-2" style={{ color: 'rgba(245,240,232,0.55)' }}>
                    {t('investorPortal.home.journeyProgress')}
                  </p>
                  <div className="flex items-center gap-1">
                    {JOURNEY_STEPS.map((step, i) => {
                      const done = i <= 1;
                      const active = i === 2;
                      return (
                        <div key={step} className="flex items-center gap-1 flex-1">
                          <div
                            className={`flex-1 h-2 rounded-full transition-all ${
                              done || active ? 'bg-[#B5850A]' : 'bg-white/10'
                            } ${active ? 'animate-pulse' : ''}`}
                          />
                          {i < JOURNEY_STEPS.length - 1 && <div className="w-1 h-1 rounded-full bg-white/20" />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[#B5850A] text-xs mt-2">↳ {t('investorPortal.home.step3')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/afri-yield/opportunities')}
                  className="mt-4 text-[#B5850A] text-xs hover:underline text-left"
                >
                  {t('investorPortal.home.seeDetails')} →
                </button>
              </>
            ) : (
              <div className="rounded-2xl p-6" style={{ background: '#F5F0E8', borderTop: '4px solid #1a3c2e' }}>
                <div className="flex justify-center gap-3 mb-4 text-3xl">🌱 → 🌿 → 🌾</div>
                <h3 className="text-[#1a3c2e] font-bold text-lg text-center mb-2">{t('investorPortal.onboarding.title')}</h3>
                <div className="space-y-2 mb-4">
                  {['step1', 'step2', 'step3'].map((s, i) => (
                    <div key={s} className="flex items-start gap-2 text-sm text-[#1a3c2e]/85">
                      <span className="font-bold">{i + 1}.</span>
                      <span>{t(`investorPortal.onboarding.${s}`)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[#1a3c2e]/65 text-xs leading-relaxed mb-4">{t('investorPortal.onboarding.body')}</p>
                <button
                  type="button"
                  onClick={() => navigate('/afri-yield/opportunities')}
                  className="w-full rounded-2xl py-3 font-bold text-white text-sm"
                  style={{ background: '#1a3c2e' }}
                >
                  {t('investorPortal.onboarding.cta')} →
                </button>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="mx-4 md:mx-6">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(245,240,232,0.55)' }}>
              {t('investorPortal.home.activity')}
            </p>
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.dot}`} />
                  <p className="text-sm flex-1" style={{ color: 'rgba(245,240,232,0.85)' }}>
                    {a.text}
                  </p>
                  <span className="text-xs shrink-0" style={{ color: 'rgba(245,240,232,0.35)' }}>
                    {a.when}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-4 space-y-5">
          {/* Hot commodity */}
          <div className="mx-4 md:mx-6 rounded-2xl p-4 flex items-start gap-3" style={{ background: '#F5F0E8', border: '2px solid rgba(181,133,10,0.35)' }}>
            <span className="text-2xl animate-pulse" style={{ color: '#ef4444' }}>
              🔥
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#1a3c2e]">{t('investorPortal.hot.title')}</p>
              <p className="text-[#1a3c2e]/75 text-xs mt-1 leading-relaxed">{t('investorPortal.hot.body')}</p>
            </div>
            <button type="button" onClick={() => navigate('/afri-yield/opportunities')} className="text-xs font-bold text-[#B5850A] whitespace-nowrap shrink-0">
              {t('investorPortal.hot.cta')} →
            </button>
          </div>

          <div className="mx-4 md:mx-6">
            <InvestmentPaymentNotice t={t} />
          </div>

          {/* Quick actions */}
          <div className="mx-4 md:mx-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('/afri-yield/opportunities')}
              className="rounded-2xl p-4 text-left"
              style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.25)' }}
            >
              <div className="text-2xl mb-2">📈</div>
              <p className="font-semibold text-sm" style={{ color: '#F5F0E8' }}>
                {t('investorPortal.portfolio.chooseCta')}
              </p>
            </button>
            <a
              href={`mailto:info@djiguicorporation.org?subject=Free Intro Call Request - AfriYield Exchange&body=Name: ${encodeURIComponent(
                investor?.fullName || ''
              )}%0AEmail: ${encodeURIComponent(investor?.email || '')}%0AInterest: `}
              className="rounded-2xl p-4 text-left block"
              style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.25)' }}
            >
              <div className="text-2xl mb-1">📞</div>
              <p className="text-white font-semibold text-sm">{t('investorPortal.advisory.cta')}</p>
              <p className="text-green-400 text-xs mt-0.5">{t('investorPortal.advisory.firstCall')}</p>
            </a>
          </div>

          {/* Notifications preview */}
          <div className="mx-4 md:mx-6 rounded-2xl p-4" style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.25)' }}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: '#F5F0E8' }}>
                {t('investorPortal.notifications.title')}
              </p>
              <button type="button" onClick={onOpenNotifications} className="text-xs font-bold text-[#B5850A]">
                {unreadPreview.length ? `${unreadPreview.length} new →` : 'Open →'}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {previewList.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'rgba(245,240,232,0.45)' }}>
                  {t('investorPortal.notifications.empty')}
                </p>
              ) : (
                previewList.map((n, i) => (
                  <div key={n._id || i} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>
                      {n.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.5)' }}>
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MY PORTFOLIO TAB ─────────────────────────────────────────────── */
function PortfolioTab({ investments, investor, kyc, t, navigate }) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  if (!investments || investments.length === 0) {
    return (
      <div className="px-4 pt-8 pb-24 flex flex-col items-center text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="font-bold text-xl mb-2" style={{ color: '#F5F0E8' }}>
          {t('investorPortal.portfolio.empty')}
        </h2>
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {t('investorPortal.portfolio.emptySub')}
        </p>
        {kyc ? (
          <div className="w-full max-w-md mb-4 text-left">
            <InvestorAccountStatus kyc={kyc} hasInvestments={false} isFr={isFr} />
          </div>
        ) : null}
        <div className="max-w-md w-full mb-4">
          <InvestmentPaymentNotice t={t} />
        </div>
        <button
          type="button"
          onClick={() => navigate('/afri-yield/opportunities')}
          className="rounded-2xl px-6 py-3 font-bold"
          style={{ background: '#B5850A', color: '#0d1f17' }}
        >
          {t('investorPortal.portfolio.chooseCta')}
        </button>
      </div>
    );
  }

  const totalDeployed = investments.reduce((s, x) => s + (Number(x.amountDeployed) || 0), 0);
  const totalExpectedPerYear = investments.reduce(
    (s, x) => s + ((Number(x.amountDeployed) || 0) * (Number(x.expectedROIPercent ?? 8) / 100)),
    0
  );
  const activeCount = investments.filter((x) => (x.status || 'active') === 'active').length;
  const nextPayoutDate = (() => {
    const dates = [];
    for (const inv of investments) {
      for (const p of inv?.payoutSchedule || []) {
        if (p?.payoutDate) dates.push(new Date(p.payoutDate));
      }
    }
    const valid = dates.filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
    return valid[0] || null;
  })();

  return (
    <div className="px-4 pt-6 pb-24 md:pb-10 space-y-5 md:px-6">
      <div>
        <h2 className="font-bold text-xl md:text-2xl" style={{ color: '#F5F0E8' }}>
          {t('investorPortal.portfolio.title')}
        </h2>
        <p className="text-sm mt-1 md:text-base" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {t('investorPortal.portfolio.subtitle')}
        </p>
      </div>

      {/* Desktop summary stats bar */}
      <div className="hidden md:block rounded-2xl p-4" style={{ background: '#F5F0E8', border: '1px solid rgba(181,133,10,0.25)' }}>
        <div className="grid grid-cols-4 gap-0">
          {[
            ['Total Deployed', formatUSD(totalDeployed)],
            [
              i18n.language === 'fr' ? 'Rendement projeté total' : 'Total projected return',
              `${t('investorPortal.projectedReturnsNote')} · ${formatUSD(Math.round(totalExpectedPerYear))}/${t('investorPortal.portfolio.perYear')}`,
            ],
            ['Active Investments', String(activeCount)],
            ['Next Payout', nextPayoutDate ? formatMonthYear(nextPayoutDate) : '—'],
          ].map(([label, value], idx) => (
            <div key={label} className={`px-3 ${idx ? 'border-l' : ''}`} style={{ borderColor: 'rgba(181,133,10,0.2)' }}>
              <p className="text-xs uppercase tracking-widest text-[#1a3c2e]/70">{label}</p>
              <p className="tabular-nums text-[#B5850A] font-extrabold text-lg mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {investments.map((inv, idx) => {
          const currentStep = inv.status === 'active' ? 2 : inv.status === 'completed' ? 3 : 1;
          const trackShort = (inv.track || '').replace(/^Track\s+/i, '').trim() || '—';
          return (
            <div key={idx} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(181,133,10,0.25)' }}>
              <div className="p-4" style={{ background: '#132a1e' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[#B5850A] font-bold truncate">{inv.opportunityName || 'Cooperative'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>
                      {inv.commodity} · {trackShort}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                    {t(`investorPortal.portfolio.status.${inv.status || 'active'}`)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 gap-2" style={{ background: '#0d1f17' }}>
                {[
                  [t('investorPortal.portfolio.yourContribution'), formatUSD(inv.amountDeployed)],
                  [
                    t('investorPortal.portfolio.expectedReturn'),
                    `~${inv.expectedROIPercent ?? 8}% proj. ${t('investorPortal.portfolio.perYear')}`,
                  ],
                  [
                    t('investorPortal.portfolio.payoutDate'),
                    inv.payoutSchedule?.[0]?.payoutDate ? formatMonthYear(inv.payoutSchedule[0].payoutDate) : 'Jun 2026',
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="text-center">
                    <p className="tabular-nums text-[#B5850A] font-bold text-sm leading-tight">{value}</p>
                    <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(245,240,232,0.45)' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4" style={{ background: '#0a1912' }}>
                <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.45)' }}>
                  {t('investorPortal.home.journeyProgress')}
                </p>
                <div className="space-y-2">
                  {JOURNEY_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                          i < currentStep
                            ? 'bg-[#B5850A] text-[#0d1f17]'
                            : i === currentStep
                              ? 'bg-white/10 border-2 border-[#B5850A] text-[#B5850A]'
                              : 'bg-white/5 text-white/20'
                        }`}
                      >
                        {i < currentStep ? <Check className="w-3 h-3" /> : i === currentStep ? '●' : '○'}
                      </div>
                      <p className={`text-sm ${i <= currentStep ? 'text-[#F5F0E8]' : 'text-white/30'}`}>
                        {t(`investorPortal.portfolio.steps.${step}`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 p-4" style={{ background: '#132a1e' }}>
                <button
                  type="button"
                  onClick={() => navigate('/afri-yield/opportunities')}
                  className="flex-1 rounded-2xl py-2.5 text-sm font-bold"
                  style={{ border: '1px solid #B5850A', color: '#B5850A' }}
                >
                  {t('investorPortal.portfolio.addMore')}
                </button>
                <Link
                  to="/trace"
                  className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-center transition hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.85)' }}
                >
                  {t('investorPortal.portfolio.seeFarmers')} 🌾
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span>🔒</span>
          {i18n.language === 'fr' ? 'Mes transactions escrow' : 'My escrow transactions'}
        </h3>
        <TransactionTracker investorEmail={investor?.email} />
      </div>

      <InvestmentPaymentNotice t={t} />

      <button
        type="button"
        onClick={() => navigate('/afri-yield/opportunities')}
        className="w-full rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
        style={{ background: '#B5850A', color: '#0d1f17' }}
      >
        {t('investorPortal.portfolio.addInvestment')} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── PRICES TAB ────────────────────────────────────────────────────── */
function PricesTab({ onOpenPremium }) {
  const { t, i18n } = useTranslation();
  const [alerts, setAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('afriyield_price_alerts') || '{}');
    } catch {
      return {};
    }
  });

  /** fr, fr-FR, fr-CA etc. */
  const lang = /^fr\b/i.test(String(i18n.language || '').toLowerCase()) ? 'fr' : 'en';

  const commodityLabel = (ckey) =>
    COMMODITY_NAMES[ckey]?.[lang] ?? t(`investorPortal.prices.names.${ckey}`, { defaultValue: ckey });

  const toggleAlert = (key) => {
    const next = { ...alerts, [key]: !alerts[key] };
    setAlerts(next);
    localStorage.setItem('afriyield_price_alerts', JSON.stringify(next));
  };

  return (
    <div className="px-4 pt-6 pb-24 md:pb-10 space-y-5 md:px-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div>
        <h2 className="font-bold text-xl md:text-2xl" style={{ color: '#F5F0E8' }}>
          {t('investorPortal.prices.title')}
        </h2>
        <p className="text-sm mt-1 md:text-base" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {t('investorPortal.prices.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full min-w-0">
        {COMMODITIES.map(({ key, emoji, price, trend, demand }) => (
          <div
            key={key}
            className="rounded-2xl p-4 overflow-hidden flex flex-col min-h-0 md:p-3 max-w-full"
            style={{
              background: '#132a1e',
              border:
                demand === 'high'
                  ? '1px solid rgba(239,68,68,0.45)'
                  : '1px solid rgba(181,133,10,0.25)',
            }}
          >
            {/* Emoji + name on one row; HOT badge full-width below — avoids flex squeeze hiding the title */}
            <div className="mb-3 w-full min-w-0 flex flex-col gap-2">
              <div className="flex items-start gap-2 min-w-0 w-full">
                <span className="text-2xl shrink-0 leading-none pt-0.5" aria-hidden>
                  {emoji}
                </span>
                <span
                  className="min-w-0 flex-1 font-bold text-sm leading-snug break-words hyphens-auto"
                  style={{ color: '#F5F0E8' }}
                >
                  {commodityLabel(key)}
                </span>
              </div>
              {demand === 'high' && (
                <div className="w-full min-w-0 ps-10 sm:ps-10">
                  <span
                    className="inline-flex items-start gap-1.5 text-xs px-2 py-1 rounded-2xl font-bold animate-pulse max-w-full"
                    style={{ background: '#ef4444', color: 'white' }}
                  >
                    <span className="shrink-0" aria-hidden>
                      🔥
                    </span>
                    <span className="break-words min-w-0">{t('investorPortal.prices.demand.high')}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-end gap-2 mb-1">
              <span className="tabular-nums text-[#B5850A] text-3xl font-bold">${price}</span>
              <span className="text-xs mb-1" style={{ color: 'rgba(245,240,232,0.45)' }}>
                {t('investorPortal.prices.perKg')}
              </span>
            </div>
            <span className="tabular-nums text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>
              ≈ €{(price * EUR_RATE).toFixed(2)}
            </span>

            <div className="flex items-center gap-1 mt-2">
              <span
                className={
                  trend === 'up'
                    ? 'text-[#22c55e]'
                    : trend === 'down'
                      ? 'text-red-400'
                      : 'text-[#B5850A]'
                }
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </span>
              <span
                className={`text-xs ${
                  trend === 'up'
                    ? 'text-[#22c55e]'
                    : trend === 'down'
                      ? 'text-red-400'
                      : 'text-[#B5850A]'
                }`}
              >
                {t(`investorPortal.prices.trend.${trend}`)}
              </span>
            </div>

            {/* Sparkline — desktop has a clear trend preview */}
            <div className="mt-3 shrink-0">
              <p className="text-white/30 text-xs mb-1">
                {lang === 'fr' ? 'Tendance des prix (6 derniers mois)' : 'Price trend (last 6 months)'}
              </p>
              <svg viewBox="0 0 100 60" className="w-full max-w-full h-12 mt-1 shrink-0" preserveAspectRatio="none">
                <path d={SPARKLINES[key]} fill="none" stroke="#B5850A" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex-1 min-h-0 mt-2 overflow-hidden">
              <p className="text-white/40 text-xs leading-relaxed line-clamp-2 break-words">
                {t(`investorPortal.prices.context.${key}`)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleAlert(key)}
              className={`mt-3 w-full rounded-2xl py-2 text-xs font-semibold transition shrink-0 ${
                alerts[key]
                  ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/35'
                  : 'border border-white/10 hover:border-[#B5850A]/40'
              }`}
              style={!alerts[key] ? { color: 'rgba(245,240,232,0.55)' } : undefined}
            >
              {alerts[key] ? '✓ ' + t('investorPortal.prices.alertOn') : t('investorPortal.prices.alertOff')}
            </button>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ border: '1px solid rgba(181,133,10,0.4)', background: 'rgba(181,133,10,0.05)' }}
      >
        <p className="font-bold mb-2" style={{ color: '#F5F0E8' }}>
          ⭐ {t('investorPortal.prices.premiumTitle')}
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {t('investorPortal.prices.premiumBody')}
        </p>
        <p className="text-[#B5850A] font-bold text-sm mb-3">{t('investorPortal.prices.premiumPrice')}</p>
        <button
          type="button"
          onClick={onOpenPremium}
          className="rounded-2xl px-4 py-2 text-sm font-bold"
          style={{ background: '#B5850A', color: '#0d1f17' }}
        >
          {t('investorPortal.prices.premiumCta')}
        </button>
      </div>
    </div>
  );
}

/* ─── NEWS TAB ──────────────────────────────────────────────────────── */
function NewsTab({ t, onOpenPremium }) {
  const freeItems = NEWS.filter((x) => !x.premium);
  const premiumItems = NEWS.filter((x) => x.premium);

  return (
    <div className="px-4 pt-6 pb-24 md:pb-10 space-y-4 md:px-6">
      <div>
        <h2 className="font-bold text-xl md:text-2xl" style={{ color: '#F5F0E8' }}>
          {t('investorPortal.news.title')}
        </h2>
        <p className="text-sm mt-1 md:text-base" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {t('investorPortal.news.subtitle')}
        </p>
      </div>

      {/* Market Summary ticker */}
      <div className="rounded-2xl p-4 flex flex-wrap gap-x-4 gap-y-2 items-center" style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.2)' }}>
        {COMMODITIES.map((c, idx) => (
          <div key={c.key} className="flex items-center gap-2">
            <span className="text-lg">{c.emoji}</span>
            <span className="tabular-nums font-bold text-[#B5850A]">${c.price.toFixed(2)}</span>
            <span className={`text-sm ${c.trend === 'up' ? 'text-[#22c55e]' : c.trend === 'down' ? 'text-red-400' : 'text-[#B5850A]'}`}>
              {c.trend === 'up' ? '↑' : c.trend === 'down' ? '↓' : '→'}
            </span>
            {idx < COMMODITIES.length - 1 && <span style={{ color: 'rgba(245,240,232,0.2)' }}>|</span>}
          </div>
        ))}
      </div>

      <div className="md:grid md:grid-cols-12 md:gap-6 space-y-4 md:space-y-0">
        {/* Free articles (left) */}
        <div className="md:col-span-8 space-y-4">
          {freeItems.map(({ key, tag, date, time }) => (
            <div key={key} className="rounded-2xl overflow-hidden" style={{ background: '#132a1e', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-2xl font-medium ${TAG_COLORS[tag]}`}>
                    {t(`investorPortal.news.tags.${tag}`)}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: 'rgba(245,240,232,0.35)' }}>
                    {date} · {time} {t('investorPortal.news.readingTime')}
                  </span>
                </div>
                <p className="font-semibold text-base leading-snug" style={{ color: '#F5F0E8' }}>
                  {t(`investorPortal.news.items.${key}title`)}
                </p>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(245,240,232,0.65)' }}>
                  {t(`investorPortal.news.items.${key}body`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Premium list (right) */}
        <div className="md:col-span-4">
          <div className="rounded-2xl p-4" style={{ background: '#0a1912', border: '1px solid rgba(181,133,10,0.2)' }}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: '#F5F0E8' }}>
                {t('investorPortal.news.premiumLabel')}
              </p>
              <button type="button" onClick={onOpenPremium} className="text-xs font-bold text-[#B5850A]">
                {t('investorPortal.news.unlock')} →
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {premiumItems.map(({ key, tag, date, time }) => (
                <button
                  key={key}
                  type="button"
                  onClick={onOpenPremium}
                  className="w-full text-left rounded-2xl p-3 transition hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-2xl font-medium ${TAG_COLORS[tag]}`}>
                      {t(`investorPortal.news.tags.${tag}`)}
                    </span>
                    <Lock className="w-4 h-4 text-[#B5850A]" />
                  </div>
                  <p className="mt-2 text-sm font-semibold" style={{ color: '#F5F0E8' }}>
                    {t(`investorPortal.news.items.${key}title`)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.45)' }}>
                    {date} · {time} {t('investorPortal.news.readingTime')}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: 'rgba(245,240,232,0.55)' }}>
              {t('investorPortal.news.premiumUnlock')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── HELP TAB ──────────────────────────────────────────────────────── */
function HelpTab({ investor, t }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const [question, setQuestion] = useState('');
  const [sent, setSent] = useState(false);

  const faqs = ['q1', 'q2', 'q3', 'q4', 'q5'];

  const sendQuestion = async () => {
    if (!question.trim()) return;
    try {
      await fetch(`${API}/api/experts/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName: investor?.fullName,
          farmerEmail: investor?.email,
          problemDescription: question,
          source: 'direct',
        }),
      });
    } catch {
      /* non-blocking */
    }
    setSent(true);
  };

  return (
    <div className="px-4 pt-6 pb-24 md:pb-10 space-y-5 md:px-6">
      <div>
        <h2 className="font-bold text-xl md:text-2xl" style={{ color: '#F5F0E8' }}>
          {t('investorPortal.help.title')}
        </h2>
        <p className="text-sm mt-1 md:text-base" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {t('investorPortal.help.subtitle')}
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
        <p className="text-amber-400 font-semibold text-sm">{t('investorPortal.kycRequired')}</p>
        {['disclaimer1', 'disclaimer2', 'disclaimer3', 'disclaimer4', 'disclaimer5'].map((key) => (
          <p key={key} className="text-white/55 text-xs leading-relaxed">
            • {t(`investorPortal.${key}`)}
          </p>
        ))}
      </div>

      <InvestmentPaymentNotice t={t} />

      <div className="md:grid md:grid-cols-12 md:gap-6 space-y-5 md:space-y-0">
        {/* Left column: FAQ */}
        <div className="md:col-span-7 space-y-2">
          {faqs.map((q) => (
            <div key={q} className="rounded-2xl overflow-hidden" style={{ background: '#132a1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button type="button" onClick={() => setOpen(open === q ? null : q)} className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-medium text-sm pr-2 md:text-base" style={{ color: '#F5F0E8' }}>
                  {t(`investorPortal.help.questions.${q}`)}
                </span>
                {open === q ? (
                  <ChevronUp className="w-4 h-4 text-[#B5850A] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(245,240,232,0.35)' }} />
                )}
              </button>
              {open === q && (
                <div className="px-4 pb-4">
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: 'rgba(245,240,232,0.7)' }}>
                    {t(`investorPortal.help.answers.${q.replace('q', 'a')}`)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right column: question + contacts */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl p-4" style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.2)' }}>
            <p className="font-bold mb-3" style={{ color: '#F5F0E8' }}>
              {t('investorPortal.help.stillNeedHelp')}
            </p>
            {sent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-semibold text-sm text-[#22c55e]">{t('investorPortal.help.sent')}</p>
              </div>
            ) : (
              <>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  placeholder={t('investorPortal.help.questionPlaceholder')}
                  className="w-full rounded-2xl p-3 text-sm bg-white/5 border border-white/10 focus:border-[#B5850A] outline-none resize-none"
                  style={{ color: '#F5F0E8' }}
                />
                <button type="button" onClick={sendQuestion} className="mt-2 w-full rounded-2xl py-3 font-bold text-sm" style={{ background: '#B5850A', color: '#0d1f17' }}>
                  {t('investorPortal.help.send')}
                </button>
                <p className="text-xs text-center mt-2" style={{ color: 'rgba(245,240,232,0.35)' }}>
                  {t('investorPortal.help.responseTime')}
                </p>
              </>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(245,240,232,0.45)' }}>
              {t('investorPortal.help.contactTitle')}
            </p>
            <div className="space-y-2">
              {[
                {
                  icon: '💬',
                  label: t('investorPortal.help.whatsapp'),
                  href: `https://wa.me/?text=${encodeURIComponent(`Hello — AfriYield investor. Email: ${investor?.email || ''}`)}`,
                },
                {
                  icon: '📧',
                  label: t('investorPortal.help.email'),
                  href: `mailto:info@djiguicorporation.org?subject=${encodeURIComponent('Investor Question')}&body=${encodeURIComponent(`From: ${investor?.email || ''}`)}`,
                },
                {
                  icon: '📞',
                  label: t('investorPortal.advisory.cta'),
                  href: `mailto:info@djiguicorporation.org?subject=Free Intro Call Request - AfriYield Exchange&body=Hello! I would like to book my free 30-minute intro call.%0A%0AName: ${encodeURIComponent(
                    investor?.fullName || ''
                  )}%0AEmail: ${encodeURIComponent(investor?.email || '')}%0APreferred time (timezone): %0AInvestment interest: `,
                },
              ].map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl p-4 transition hover:bg-white/5"
                  style={{ background: '#132a1e', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-sm font-medium" style={{ color: 'rgba(245,240,232,0.85)' }}>
                    {c.label}
                  </span>
                  <ArrowUpRight className="w-4 h-4 ml-auto" style={{ color: 'rgba(245,240,232,0.35)' }} />
                </a>
              ))}
            </div>
            {investor?.email ? (
              <p className="text-xs text-center mt-3" style={{ color: 'rgba(245,240,232,0.35)' }}>
                {t('investorPortal.help.callInclude')}
              </p>
            ) : null}

            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-white/30 text-xs text-center mb-2">
                {i18n.language === 'fr' ? 'Gestion du compte' : 'Account management'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/delete-account?type=investor')}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition border border-red-400/10 hover:border-red-400/30 mt-4"
              >
                🗑️ {i18n.language === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory call booking card (full width) */}
      <div
        className="rounded-2xl p-5 mt-4"
        style={{
          background: 'linear-gradient(135deg, #132a1e, #1a3c2e)',
          border: '1px solid rgba(181,133,10,0.4)',
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">📞</span>
          <div className="flex-1">
            <p className="text-white font-bold text-base">{t('investorPortal.advisory.title')}</p>
            <div className="inline-flex items-center gap-1 mt-1 mb-2 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40">
              <span className="text-green-400 text-xs font-bold">✓ {t('investorPortal.advisory.firstCall')}</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-1">{t('investorPortal.advisory.firstCallDesc')}</p>
            <p className="text-white/30 text-xs mb-4">{t('investorPortal.advisory.followUp')}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`mailto:info@djiguicorporation.org?subject=Free Intro Call Request - AfriYield Exchange&body=Hello! I would like to book my free 30-minute intro call.%0A%0AName: %0AEmail: %0APreferred time (timezone): %0AInvestment interest: `}
                className="flex-1 rounded-xl py-3 font-bold text-center text-[#0d1f17] text-sm"
                style={{ background: '#B5850A' }}
              >
                📞 {t('investorPortal.advisory.cta')}
              </a>
              <a
                href={`mailto:info@djiguicorporation.org?subject=Follow-up Advisory Call - $99 - AfriYield Exchange&body=I would like to book a follow-up advisory call ($99).%0A%0AName: %0AEmail: %0APreferred time: `}
                className="flex-1 rounded-xl py-3 font-medium text-center text-white/60 text-sm hover:text-white transition"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {t('investorPortal.advisory.ctaFollowUp')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PREMIUM MODAL ─────────────────────────────────────────────────── */
function PremiumModal({ t, onClose }) {
  const { i18n } = useTranslation();
  const features = t('investorPortal.premium.features', { returnObjects: true });
  const [billing, setBilling] = useState('annual'); // 'monthly' or 'annual'
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-[520px] md:max-w-[680px] rounded-2xl p-5 md:p-7 max-h-[90vh] overflow-y-auto"
        style={{ background: '#132a1e', border: '1px solid rgba(181,133,10,0.4)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#B5850A]" />
            <span className="text-[#B5850A] font-bold text-xs tracking-widest">
              {t('investorPortal.premium.badge')}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" style={{ color: 'rgba(245,240,232,0.4)' }} />
          </button>
        </div>
        <h3 className="font-bold text-xl mb-2" style={{ color: '#F5F0E8' }}>
          {t('investorPortal.premium.title')}
        </h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.55)' }}>
          {t('investorPortal.premium.body')}
        </p>
        <div className="space-y-2 mb-5">
          {Array.isArray(features) &&
            features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(245,240,232,0.85)' }}>
                <Check className="w-4 h-4 text-[#B5850A] flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </div>
            ))}
        </div>

        {/* Billing toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`flex-1 py-2 text-sm font-medium transition ${
              billing === 'monthly' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t('investorPortal.premium.priceMonthly')}
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className={`flex-1 py-2 text-sm font-medium transition relative ${
              billing === 'annual' ? 'bg-[#B5850A] text-[#0d1f17]' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t('investorPortal.premium.priceAnnual')}
            {billing === 'annual' && (
              <span className="absolute -top-2 -right-1 text-xs bg-green-500 text-white px-1 rounded-full">
                -17%
              </span>
            )}
          </button>
        </div>

        {/* Price display */}
        <div className="mb-1">
          {billing === 'annual' ? (
            <div>
              <p className="text-[#B5850A] font-mono font-bold text-3xl">
                $299<span className="text-lg">/year</span>
              </p>
              <p className="text-green-400 text-xs mt-1">= $24.92/month — {t('investorPortal.premium.saveWithAnnual')}</p>
            </div>
          ) : (
            <p className="text-[#B5850A] font-mono font-bold text-3xl">
              $29.99<span className="text-lg">/month</span>
            </p>
          )}
        </div>
        <p className="text-white/30 text-xs mb-4">{t('investorPortal.premium.nofees')}</p>

        <a
          href={`mailto:info@djiguicorporation.org?subject=AfriYield Premium - ${
            billing === 'annual' ? 'Annual $299' : 'Monthly $29.99'
          }&body=I would like to subscribe to AfriYield Premium (${
            billing === 'annual' ? 'Annual plan - $299/year' : 'Monthly plan - $29.99/month'
          }).%0A%0AName: %0AEmail: `}
          className="block w-full rounded-xl py-3 font-bold text-center text-[#0d1f17]"
          style={{ background: '#B5850A' }}
        >
          {t('investorPortal.premium.cta')} — {billing === 'annual' ? '$299/yr' : '$29.99/mo'}
        </a>
        <p className="text-xs mt-2" style={{ color: 'rgba(245,240,232,0.45)' }}>
          {String(i18n.language || '').toLowerCase().startsWith('fr')
            ? "Pour l'instant, l'abonnement se fait par email. Les détails bancaires arrivent bientôt."
            : 'For now, Premium is activated via email. Banking details will be added soon.'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="block w-full text-center text-sm mt-3 hover:opacity-80"
          style={{ color: 'rgba(245,240,232,0.45)' }}
        >
          {t('investorPortal.premium.later')}
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN PORTAL ───────────────────────────────────────────────────── */
export default function InvestorPortal() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isFr = i18n.language === 'fr';
  const [investor, setInvestor] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [kyc, setKyc] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('afriyield_token');
    const email = sessionStorage.getItem('afriyield_investor_email');
    const name = sessionStorage.getItem('afriyield_investor_name');
    if (token && email) {
      setInvestor({ email, fullName: name || email });
      loadData(email);
    }
  }, []);

  const loadData = useCallback(async (email) => {
    try {
      const token = sessionStorage.getItem('afriyield_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [invRes, noteRes, kycRes] = await Promise.allSettled([
        fetch(`${API}/api/investments/investor/${encodeURIComponent(email)}`, { headers }),
        fetch(`${API}/api/investor-notifications/${encodeURIComponent(email)}`, { headers }),
        fetch(`${API}/api/kyc/status/${encodeURIComponent(email)}`),
      ]);
      if (invRes.status === 'fulfilled' && invRes.value.ok) {
        const d = await invRes.value.json();
        const list = Array.isArray(d) ? d : d?.investments;
        setInvestments(Array.isArray(list) ? list : []);
      }
      if (noteRes.status === 'fulfilled' && noteRes.value.ok) {
        const d = await noteRes.value.json();
        setNotifications(d?.notifications || []);
      }
      if (kycRes.status === 'fulfilled' && kycRes.value.ok) {
        const d = await kycRes.value.json();
        if (d.success) {
          setKyc({
            status: d.status,
            paymentVerified: d.paymentVerified,
            rejectionReason: d.rejectionReason,
            additionalDocsRequested: d.additionalDocsRequested,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleAccess = (inv) => {
    setInvestor(inv);
    loadData(inv.email);
  };

  const signOut = () => {
    sessionStorage.removeItem('afriyield_token');
    sessionStorage.removeItem('afriyield_investor_email');
    sessionStorage.removeItem('afriyield_investor_name');
    localStorage.removeItem('afriyield_investor_email');
    localStorage.removeItem('afriyield_investor_name');
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    window.dispatchEvent(new Event('sac_user_updated'));
    window.dispatchEvent(new Event('web_session_updated'));
    setInvestor(null);
    setInvestments([]);
    setNotifications([]);
  };

  const markAllNotificationsRead = async () => {
    if (!investor?.email) return;
    try {
      const token = sessionStorage.getItem('afriyield_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`${API}/api/investor-notifications/${encodeURIComponent(investor.email)}/read-all`, {
        method: 'PUT',
        headers,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const TABS = [
    { key: 'home', icon: Home, labelKey: 'home' },
    { key: 'portfolio', icon: Wallet, labelKey: 'myPortfolio' },
    { key: 'prices', icon: TrendingUp, labelKey: 'prices' },
    { key: 'news', icon: Newspaper, labelKey: 'news' },
    { key: 'help', icon: HelpCircle, labelKey: 'help' },
  ];

  if (!investor) return <AccessScreen onAccess={handleAccess} t={t} />;

  const initials = getInitials(investor?.fullName);
  const isPremium = false;
  const accountStatusLabel = (() => {
    if (!kyc) return t('investorPortal.premium.currentFree');
    if (kyc.status === 'rejected') return isFr ? 'KYC refusé' : 'KYC declined';
    if (kyc.status === 'approved' && kyc.paymentVerified) {
      return isFr ? 'Compte actif' : 'Active account';
    }
    if (['pending_review', 'pending_kyc', 'african_pending_review', 'additional_docs'].includes(kyc.status)) {
      return isFr ? 'KYC en cours' : 'KYC in review';
    }
    if (kyc.paymentVerified) return isFr ? 'Paiement reçu' : 'Payment received';
    return isFr ? 'En traitement' : 'Processing';
  })();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d1f17', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 h-full overflow-y-auto" style={{ background: '#0d1f17', borderRight: '1px solid rgba(181,133,10,0.2)' }}>
        <div className="px-4 py-5">
          <p className="text-[#B5850A] font-bold text-sm tracking-wide">AfriYield Exchange</p>
          <div className="mt-3">
            <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>
              {investor?.fullName || 'Investor'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>
              {investor?.email}
            </p>
          </div>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(181,133,10,0.12)', color: '#B5850A', border: '1px solid rgba(181,133,10,0.25)' }}>
              {accountStatusLabel}
            </span>
          </div>
        </div>

        <div className="px-3 space-y-1">
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === key
                  ? 'bg-[#B5850A]/10 text-[#B5850A] border-l-[3px] border-[#B5850A]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{t(`investorPortal.tabs.${labelKey}`)}</span>
              {key === 'prices' && (
                <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                  🔥
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-auto px-4 pb-5 pt-6">
          <button type="button" onClick={signOut} className="text-xs w-full text-left hover:opacity-80" style={{ color: 'rgba(245,240,232,0.55)' }}>
            {t('investorPortal.signOut')}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (main content only) */}
        <header className="flex-shrink-0 sticky top-0 z-40" style={{ background: 'rgba(13,31,23,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(181,133,10,0.15)' }}>
          <div className="h-16 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#B5850A] font-bold text-sm shrink-0">AfriYield Exchange</span>
              <span style={{ color: 'rgba(245,240,232,0.25)' }}>{'>'}</span>
              <span className="text-sm truncate" style={{ color: 'rgba(245,240,232,0.55)' }}>
                {t(`investorPortal.tabs.${activeTab === 'portfolio' ? 'myPortfolio' : activeTab}`)}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
                className="text-xs border rounded-full px-2 py-0.5 transition"
                style={{ color: 'rgba(245,240,232,0.45)', borderColor: 'rgba(245,240,232,0.15)' }}
              >
                {i18n.language === 'fr' ? 'EN' : 'FR'}
              </button>
              <button type="button" onClick={() => setShowNotifications(!showNotifications)} className="relative p-1" aria-label={t('investorPortal.notifications.title')}>
                <Bell className="w-5 h-5" style={{ color: 'rgba(245,240,232,0.55)' }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0d1f17]" style={{ background: '#B5850A' }}>
                  {initials}
                </div>
                <button type="button" onClick={signOut} className="text-xs transition hover:opacity-80" style={{ color: 'rgba(245,240,232,0.55)' }}>
                  {t('investorPortal.signOut')}
                </button>
              </div>
            </div>
          </div>
        </header>

      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowNotifications(false)}>
          <div
            className="w-full max-w-[420px] h-full overflow-y-auto shadow-2xl"
            style={{ background: '#0d1f17', borderLeft: '1px solid rgba(181,133,10,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4 gap-2"
              style={{ borderBottom: '1px solid rgba(245,240,232,0.1)' }}
            >
              <p className="font-bold truncate" style={{ color: '#F5F0E8' }}>
                {t('investorPortal.notifications.title')}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {notifications.length > 0 ? (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs text-[#B5850A] font-medium"
                  >
                    {t('investorPortal.notifications.markRead')}
                  </button>
                ) : null}
                <button type="button" onClick={() => setShowNotifications(false)} aria-label="Close">
                  <X className="w-5 h-5" style={{ color: 'rgba(245,240,232,0.4)' }} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'rgba(245,240,232,0.35)' }}>
                  {t('investorPortal.notifications.empty')}
                </p>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={n._id || i}
                    className={`rounded-2xl p-3 ${!n.read ? 'border-l-2 border-[#B5850A]' : ''}`}
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>
                      {n.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.5)' }}>
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="mx-auto w-full max-w-[375px] md:max-w-none min-w-0 overflow-x-hidden">
            {activeTab === 'home' && (
              <HomeTab
                investor={investor}
                investments={investments}
                notifications={notifications}
                kyc={kyc}
                t={t}
                navigate={navigate}
                onOpenNotifications={() => setShowNotifications(true)}
              />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioTab investments={investments} investor={investor} kyc={kyc} t={t} navigate={navigate} />
            )}
            {activeTab === 'prices' && <PricesTab onOpenPremium={() => setShowPremiumModal(true)} />}
            {activeTab === 'news' && <NewsTab t={t} onOpenPremium={() => setShowPremiumModal(true)} />}
            {activeTab === 'help' && <HelpTab investor={investor} t={t} />}
          </div>
        </main>

        {/* Bottom tabs — mobile only */}
        <nav
          className="flex md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[375px]"
          style={{
            background: 'rgba(13,31,23,0.97)',
            borderTop: '1px solid rgba(181,133,10,0.2)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {TABS.map(({ key, icon: Icon, labelKey }) => {
            const active = activeTab === key;
            return (
              <button key={key} type="button" onClick={() => setActiveTab(key)} className="flex-1 flex flex-col items-center gap-1 py-3 transition">
                <Icon className={`w-5 h-5 transition ${active ? 'text-[#B5850A]' : ''}`} style={!active ? { color: 'rgba(245,240,232,0.35)' } : undefined} />
                <span className={`text-xs transition ${active ? 'text-[#B5850A] font-semibold' : ''}`} style={!active ? { color: 'rgba(245,240,232,0.35)' } : undefined}>
                  {t(`investorPortal.tabs.${labelKey}`)}
                </span>
              </button>
            );
          })}
        </nav>

        {showPremiumModal && <PremiumModal t={t} onClose={() => setShowPremiumModal(false)} />}
      </div>
    </div>
  );
}
