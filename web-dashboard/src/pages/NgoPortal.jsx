import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  HeartHandshake,
  Users,
  FileBarChart2,
  UserCircle,
  LogOut,
  Loader2,
  Plus,
  X,
  Download,
  ChevronRight,
  Globe,
  ClipboardList,
  UserPlus,
  Network,
  TrendingUp,
  Building2,
  Info,
  CheckCircle2,
  FileText,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const BG = '#0a1a0f';
const SURFACE = '#0d2a18';
const SURFACE2 = '#071510';
const ACCENT = '#2ECC71';
const GOLD = '#B5850A';
const BLUE = '#3B82F6';
const PURPLE = '#7B61FF';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED = 'rgba(255,255,255,0.6)';

const PROGRAM_TYPES = [
  { key: 'value_chain', en: 'Value Chain', fr: 'Chaîne de valeur' },
  { key: 'empowerment', en: 'Empowerment', fr: 'Autonomisation' },
  { key: 'training', en: 'Training', fr: 'Formation' },
  { key: 'food_security', en: 'Food Security', fr: 'Sécurité alimentaire' },
  { key: 'climate', en: 'Climate Adaptation', fr: 'Adaptation climatique' },
  { key: 'finance', en: 'Rural Finance', fr: 'Finance rurale' },
];

const REPORT_TYPES = [
  {
    type: 'beneficiary',
    icon: Users,
    color: ACCENT,
    titleEn: 'Beneficiary Report',
    titleFr: 'Rapport bénéficiaires',
    descEn:
      'Complete list of registered beneficiaries, broken down by program, gender, and region. Downloadable PDF format.',
    descFr:
      'Liste complète des bénéficiaires enregistrés, répartis par programme, genre et région. Format PDF téléchargeable.',
  },
  {
    type: 'program',
    icon: HeartHandshake,
    color: GOLD,
    titleEn: 'Program Report',
    titleFr: 'Rapport programmes',
    descEn:
      'Progress of all active programs: beneficiaries reached, budget consumed, objectives achieved.',
    descFr:
      'Avancement de tous les programmes actifs : bénéficiaires atteints, budget consommé, objectifs accomplis.',
  },
  {
    type: 'cooperative',
    icon: Network,
    color: BLUE,
    titleEn: 'Cooperative Network Report',
    titleFr: 'Rapport réseau coopératives',
    descEn:
      'Data on your partner cooperatives: members, declared production, performance.',
    descFr:
      'Données sur vos coopératives partenaires : membres, production déclarée, performance.',
  },
  {
    type: 'impact',
    icon: TrendingUp,
    color: PURPLE,
    titleEn: 'Impact & KPI Report',
    titleFr: 'Rapport impact & indicateurs',
    descEn:
      'Key indicators: coverage rate, social return on investment, SDG goal progression.',
    descFr:
      'Indicateurs clés : taux de couverture, retour sur investissement social, progression vers les objectifs ODD.',
  },
];

const TABS = [
  { id: 'home', icon: Home, labelEn: 'Home', labelFr: 'Accueil' },
  { id: 'programs', icon: HeartHandshake, labelEn: 'Programs', labelFr: 'Programmes' },
  { id: 'network', icon: Users, labelEn: 'Network', labelFr: 'Réseau' },
  { id: 'reports', icon: FileBarChart2, labelEn: 'Reports', labelFr: 'Rapports' },
  { id: 'account', icon: UserCircle, labelEn: 'Account', labelFr: 'Compte' },
];

function tryParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getStoredAuth() {
  const ngoToken = localStorage.getItem('ngo_token');
  const ngoAdmin = tryParse(localStorage.getItem('ngo_admin'));
  if (ngoToken && ngoAdmin) return { token: ngoToken, admin: ngoAdmin };

  const govToken = localStorage.getItem('gov_token');
  const govAdmin = tryParse(localStorage.getItem('gov_admin'));
  if (govToken && govAdmin && ['ngo', 'international_org'].includes(govAdmin.orgType)) {
    return { token: govToken, admin: govAdmin };
  }
  return { token: null, admin: null };
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function programTypeLabel(type, isFr) {
  const found = PROGRAM_TYPES.find((t) => t.key === type);
  if (!found) return type || '—';
  return isFr ? found.fr : found.en;
}

function statusLabel(status, isFr) {
  if (status === 'active') return isFr ? 'Actif' : 'Active';
  if (status === 'planning') return isFr ? 'Planification' : 'Planning';
  return status || '—';
}

function cardClass(extra = '') {
  return `rounded-2xl border p-4 md:p-5 ${extra}`.trim();
}

function ProgressBar({ value, color = ACCENT, className = '' }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded bg-white/10 ${className}`}>
      <div
        className="h-full rounded transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function LoginScreen({ onLogin, isFr }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [step, setStep] = useState('email'); // email | code
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API_ENDPOINTS.VERIFY.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email: email.trim().toLowerCase(),
          role: 'ngo',
          lang: isFr ? 'fr' : 'en',
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Send failed');
      setVerificationId(d.verificationId || '');
      setStep('code');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API_ENDPOINTS.VERIFY.CONFIRM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'login',
          email: email.trim().toLowerCase(),
          code,
          role: 'ngo',
          verificationId,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Login failed');
      if (!d.token) throw new Error(isFr ? 'Compte non activé.' : 'Account not active yet.');
      const admin = { ...(d.user || {}), orgType: 'ngo' };
      localStorage.setItem('ngo_token', d.token);
      localStorage.setItem('ngo_admin', JSON.stringify(admin));
      localStorage.setItem('auth_token_ngo', d.token);
      localStorage.setItem('auth_role', 'ngo');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('web_session_updated'));
      onLogin(d.token, admin);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, ${SURFACE} 0%, #1a4a2e 50%, ${SURFACE} 100%)` }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden ring-2 ring-[#2ECC71]/30">
            <img src="/sahel-logo.png" alt="Sahel AgriConnect" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sahel AgriConnect</h1>
          <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1">
            <HeartHandshake className="w-4 h-4 text-[#2ECC71]" />
            {isFr ? 'Portail ONG & Partenaires' : 'NGO & Partners Portal'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="font-bold text-[#0a1a0f] text-lg mb-5 text-center">
            {isFr ? 'Connexion par code' : 'Sign in with code'}
          </h2>
          {step === 'email' ? (
            <form onSubmit={submitEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Email officiel' : 'Official email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2ECC71]"
                />
              </div>
              {error && <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3.5 font-bold text-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: ACCENT }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isFr ? 'Envoi...' : 'Sending...'}
                  </>
                ) : isFr ? (
                  'Recevoir mon code'
                ) : (
                  'Send me a code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4">
              <p className="text-gray-500 text-xs text-center">
                {isFr ? 'Code envoyé à ' : 'Code sent to '} <span className="text-gray-900 font-semibold">{email}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Code (6 chiffres)' : 'Code (6 digits)'}
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2ECC71] tracking-widest text-center font-mono"
                />
              </div>
              {error && <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3.5 font-bold text-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: ACCENT }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isFr ? 'Connexion...' : 'Signing in...'}
                  </>
                ) : isFr ? (
                  'Se connecter'
                ) : (
                  'Sign in'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-800"
              >
                {isFr ? '← Changer d’email' : '← Change email'}
              </button>
            </form>
          )}
          <div className="mt-6 bg-[#0a1a0f]/5 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-xs text-center mb-3">
              {isFr
                ? 'Première connexion? Votre mot de passe vous a été envoyé par notre équipe.'
                : 'First time? Your password was sent by our team.'}
            </p>
            <Link
              to="/platform-licensing?type=ngo"
              className="block text-center py-2 rounded-lg text-xs font-semibold text-[#0a1a0f]/70 hover:text-[#0a1a0f] border border-gray-200 hover:border-[#2ECC71]/30 transition"
            >
              {isFr ? 'Demander accès ONG' : 'Request NGO access'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalHeader({ stats, isFr }) {
  return (
    <header
      className="relative overflow-hidden shrink-0"
      style={{
        background: `linear-gradient(135deg, ${SURFACE} 0%, #1a4a2e 50%, ${SURFACE} 100%)`,
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: `${ACCENT}10` }}
      />
      <div className="relative px-5 pt-5 pb-4 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-white/65 text-xs font-semibold tracking-wide flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-[#2ECC71]" />
              {isFr ? 'Portail ONG & Partenaires' : 'NGO & Partners Portal'}
            </p>
            <h1 className="text-white text-xl md:text-2xl font-bold tracking-tight mt-1">
              {isFr ? 'Impact & programmes' : 'Impact & Programs'}
            </h1>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/90 text-xs border border-white/20 bg-white/10 hover:bg-white/15 transition"
          >
            <Home className="w-3.5 h-3.5" />
            {isFr ? 'Accueil' : 'Home'}
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              value: stats?.beneficiaries ?? 0,
              label: isFr ? 'Bénéficiaires' : 'Beneficiaries',
              icon: Users,
            },
            {
              value: stats?.activePrograms ?? 0,
              label: isFr ? 'Programmes actifs' : 'Active Programs',
              icon: HeartHandshake,
            },
            {
              value: stats?.cooperatives ?? 0,
              label: isFr ? 'Coopératives' : 'Cooperatives',
              icon: Network,
            },
          ].map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl px-2.5 py-2.5 border border-white/12 bg-white/8"
            >
              <Icon className="w-4 h-4 text-[#2ECC71] mb-1" />
              <p className="text-[#2ECC71] font-bold text-sm">{value}</p>
              <p className="text-white/55 text-[9px] leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

function InsightBar({ label, value, color, isFr, suffix = '%' }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-white text-xs font-semibold">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {value}
          {suffix}
        </span>
      </div>
      <ProgressBar value={parseFloat(value) || 0} color={color} />
    </div>
  );
}

function HomeTab({ portal, isFr, onTabChange }) {
  const insights = portal?.insights || {};
  const programs = (portal?.programs || []).filter((p) => p.status === 'active').slice(0, 3);
  const gender = insights.genderBreakdown || {};
  const totalGender =
    (gender.female || 0) + (gender.male || 0) + (gender.other || 0) + (gender.unspecified || 0);
  const femalePct = totalGender > 0 ? Math.round(((gender.female || 0) / totalGender) * 100) : 0;

  const quickActions = [
    {
      icon: ClipboardList,
      color: ACCENT,
      title: isFr ? 'Créer un programme' : 'Create Program',
      sub: isFr ? 'Définir objectifs & budget' : 'Define goals & budget',
      tab: 'programs',
      openModal: 'program',
    },
    {
      icon: UserPlus,
      color: GOLD,
      title: isFr ? 'Ajouter bénéficiaire' : 'Add Beneficiary',
      sub: isFr ? 'Enregistrement direct' : 'Direct registration',
      tab: 'network',
      openModal: 'beneficiary',
    },
    {
      icon: FileBarChart2,
      color: BLUE,
      title: isFr ? 'Générer rapport' : 'Generate Report',
      sub: isFr ? 'Rapport PDF immédiat' : 'Immediate PDF report',
      tab: 'reports',
    },
    {
      icon: Network,
      color: PURPLE,
      title: isFr ? 'Voir le réseau' : 'View Network',
      sub: isFr ? 'Réseau de partenaires' : 'Partner network',
      tab: 'network',
    },
  ];

  return (
    <div className="space-y-5 pb-4">
      <div
        className={cardClass()}
        style={{ background: `linear-gradient(135deg, ${ACCENT}20, ${ACCENT}08)`, borderColor: `${ACCENT}40` }}
      >
        <Globe className="w-7 h-7 text-[#2ECC71] mb-2" />
        <h3 className="text-white font-bold text-base mb-3">
          {isFr ? 'Impact de votre organisation' : "Your Organization's Impact"}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: portal?.stats?.beneficiaries ?? 0, lbl: isFr ? 'Bénéficiaires' : 'Beneficiaries', col: ACCENT },
            { val: portal?.stats?.activePrograms ?? 0, lbl: isFr ? 'Programmes actifs' : 'Active Programs', col: GOLD },
            { val: portal?.stats?.cooperatives ?? 0, lbl: isFr ? 'Coopératives' : 'Cooperatives', col: BLUE },
          ].map(({ val, lbl, col }) => (
            <div
              key={lbl}
              className="rounded-xl p-2 text-center"
              style={{ background: `${col}18` }}
            >
              <p className="font-bold text-lg" style={{ color: col }}>
                {val}
              </p>
              <p className="text-[9px] text-white/60 leading-tight">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold text-base mb-3">
          {isFr ? 'Indicateurs clés' : 'Key insights'}
        </h3>
        <div className={cardClass()} style={{ background: `linear-gradient(180deg, ${SURFACE}, ${SURFACE2})`, borderColor: BORDER }}>
          <InsightBar
            label={isFr ? 'Taux de couverture' : 'Coverage rate'}
            value={insights.coverageRate ?? 0}
            color={ACCENT}
            isFr={isFr}
          />
          <InsightBar
            label={isFr ? 'Utilisation du budget' : 'Budget utilization'}
            value={insights.budgetUtilization ?? 0}
            color={GOLD}
            isFr={isFr}
          />
          <InsightBar
            label={isFr ? 'Participation féminine' : 'Female participation'}
            value={femalePct}
            color={PURPLE}
            isFr={isFr}
          />
          {totalGender > 0 && (
            <p className="text-white/45 text-[10px] mt-2">
              {isFr ? 'Répartition genre : ' : 'Gender breakdown: '}
              {gender.female || 0} {isFr ? 'femmes' : 'female'} · {gender.male || 0}{' '}
              {isFr ? 'hommes' : 'male'} · {gender.other || 0} {isFr ? 'autre' : 'other'}
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold text-base mb-3">
          {isFr ? 'Actions rapides' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map(({ icon: Icon, color, title, sub, tab, openModal }) => (
            <button
              key={title}
              type="button"
              onClick={() => onTabChange(tab, openModal)}
              className={`${cardClass('text-left hover:scale-[1.02] transition-transform')}`}
              style={{
                background: `linear-gradient(180deg, ${SURFACE}, ${SURFACE2})`,
                borderColor: `${color}40`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${color}25` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-xs font-bold" style={{ color }}>
                {title}
              </p>
              <p className="text-white/50 text-[10px] mt-0.5 leading-snug">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-base">
            {isFr ? 'Programmes en cours' : 'Ongoing Programs'}
          </h3>
          <button
            type="button"
            onClick={() => onTabChange('programs')}
            className="text-xs font-semibold flex items-center gap-0.5"
            style={{ color: GOLD }}
          >
            {isFr ? 'Tout voir' : 'See all'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {programs.length === 0 ? (
          <div className={cardClass('text-center')} style={{ background: SURFACE, borderColor: BORDER }}>
            <p className="text-white/50 text-sm">
              {isFr ? 'Aucun programme actif.' : 'No active programs yet.'}
            </p>
          </div>
        ) : (
          programs.map((p) => <ProgramCard key={p.id} program={p} isFr={isFr} compact />)
        )}
      </div>
    </div>
  );
}

function ProgramCard({ program: p, isFr, compact = false }) {
  const target = Number(p.target) || 1;
  const benPct = Math.round(((Number(p.beneficiaries) || 0) / target) * 100);
  const budget = Number(p.budget) || 0;
  const spent = Number(p.spent) || 0;
  const budgetPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const isActive = p.status === 'active';

  return (
    <div
      className={`${cardClass('mb-3')} ${compact ? '' : ''}`}
      style={{ background: `linear-gradient(180deg, ${SURFACE}, ${SURFACE2})`, borderColor: BORDER }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}20` }}
          >
            <HeartHandshake className="w-5 h-5 text-[#2ECC71]" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{p.name}</p>
            <p className="text-white/50 text-xs">
              {p.region} · {programTypeLabel(p.type, isFr)}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0"
          style={{
            background: `${isActive ? ACCENT : GOLD}25`,
            color: isActive ? ACCENT : GOLD,
          }}
        >
          {statusLabel(p.status, isFr)}
        </span>
      </div>
      {!compact && (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-white/50 mb-1">
              <span>{isFr ? 'Bénéficiaires' : 'Beneficiaries'}</span>
              <span className="text-[#2ECC71] font-bold">
                {p.beneficiaries}/{p.target}
              </span>
            </div>
            <ProgressBar value={benPct} color={ACCENT} />
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-white/50 mb-1">
              <span>{isFr ? 'Budget utilisé' : 'Budget used'}</span>
              <span className="font-bold" style={{ color: GOLD }}>
                {formatMoney(spent)} / {formatMoney(budget)}
              </span>
            </div>
            <ProgressBar value={budgetPct} color={GOLD} />
          </div>
        </>
      )}
      {compact && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1">
            <ProgressBar value={benPct} color={ACCENT} />
          </div>
          <span className="text-[#2ECC71] text-xs font-bold shrink-0">
            {p.beneficiaries}/{p.target}
          </span>
        </div>
      )}
      <p className="text-white/45 text-[10px] mt-2">
        {p.startDate} → {p.endDate}
        {!compact && ` · ${isFr ? 'Budget' : 'Budget'}: ${formatMoney(p.budget)}`}
      </p>
    </div>
  );
}

function ProgramsTab({ programs, isFr, token, onRefresh, showCreate, onCloseCreate }) {
  const [form, setForm] = useState({
    name: '',
    objectives: '',
    region: '',
    type: 'value_chain',
    target: '',
    budget: '',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createProgram = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(isFr ? 'Nom du programme requis' : 'Program name required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/ngo/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          objectives: form.objectives,
          region: form.region,
          type: form.type,
          status: 'planning',
          target: Number(form.target) || 0,
          budget: Number(form.budget) || 0,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setForm({
        name: '',
        objectives: '',
        region: '',
        type: 'value_chain',
        target: '',
        budget: '',
        startDate: '',
        endDate: '',
      });
      onCloseCreate();
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 pb-4">
      {!showCreate && (
        <button
          type="button"
          onClick={() => onCloseCreate(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-black text-sm"
          style={{ background: ACCENT }}
        >
          <Plus className="w-5 h-5" />
          {isFr ? 'Créer un nouveau programme' : 'Create New Program'}
        </button>
      )}

      {showCreate && (
        <div className={cardClass()} style={{ background: SURFACE, borderColor: BORDER }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">
              {isFr ? 'Créer un programme' : 'Create Program'}
            </h3>
            <button type="button" onClick={() => onCloseCreate(false)} className="text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={createProgram} className="space-y-3">
            <label className="block">
              <span className="text-white/60 text-xs">{isFr ? 'Nom du programme *' : 'Program name *'}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-[#2ECC71]"
                required
              />
            </label>
            <label className="block">
              <span className="text-white/60 text-xs">{isFr ? 'Type' : 'Type'}</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
              >
                {PROGRAM_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {isFr ? t.fr : t.en}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-white/60 text-xs">{isFr ? 'Objectifs' : 'Objectives'}</span>
              <textarea
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none focus:border-[#2ECC71]"
              />
            </label>
            <label className="block">
              <span className="text-white/60 text-xs">{isFr ? 'Région' : 'Region'}</span>
              <input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-white/60 text-xs">{isFr ? 'Cible bénéficiaires' : 'Target beneficiaries'}</span>
                <input
                  type="number"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="text-white/60 text-xs">{isFr ? 'Budget (USD)' : 'Budget (USD)'}</span>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-white/60 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {isFr ? 'Date début' : 'Start date'}
                </span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="text-white/60 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {isFr ? 'Date fin' : 'End date'}
                </span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                />
              </label>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: ACCENT }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isFr ? 'Lancer le programme' : 'Launch Program'}
            </button>
          </form>
        </div>
      )}

      <h3 className="text-white font-bold">
        {isFr ? 'Tous les programmes' : 'All Programs'} ({programs.length})
      </h3>
      {programs.length === 0 ? (
        <div className={cardClass('text-center py-8')} style={{ background: SURFACE, borderColor: BORDER }}>
          <ClipboardList className="w-10 h-10 text-white/30 mx-auto mb-2" />
          <p className="text-white/50 text-sm">{isFr ? 'Aucun programme.' : 'No programs yet.'}</p>
        </div>
      ) : (
        programs.map((p) => <ProgramCard key={p.id} program={p} isFr={isFr} />)
      )}
    </div>
  );
}

function NetworkTab({
  network,
  beneficiaries,
  programs,
  isFr,
  token,
  onRefresh,
  showBeneficiary,
  onCloseBeneficiary,
}) {
  const [view, setView] = useState('cooperatives');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    region: '',
    mainCrop: '',
    programId: '',
    gender: 'female',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitBeneficiary = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError(isFr ? 'Nom et téléphone requis' : 'Name and phone required');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const r = await fetch(`${API}/api/ngo/beneficiaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          region: form.region,
          mainCrop: form.mainCrop,
          programId: form.programId || undefined,
          gender: form.gender,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setForm({ name: '', phone: '', region: '', mainCrop: '', programId: '', gender: 'female' });
      setSuccess(
        isFr
          ? 'Bénéficiaire enregistré et synchronisé avec le registre national.'
          : 'Beneficiary registered and synced with national registry.'
      );
      onCloseBeneficiary(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex rounded-xl p-1" style={{ background: SURFACE }}>
        {[
          { id: 'cooperatives', label: isFr ? 'Coopératives' : 'Cooperatives' },
          { id: 'beneficiaries', label: isFr ? 'Bénéficiaires' : 'Beneficiaries' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition"
            style={{
              background: view === id ? ACCENT : 'transparent',
              color: view === id ? '#000' : MUTED,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'cooperatives' && (
        <>
          <div
            className="rounded-xl p-3.5 flex gap-2.5 border"
            style={{ background: `${BLUE}12`, borderColor: `${BLUE}35` }}
          >
            <Info className="w-5 h-5 shrink-0" style={{ color: BLUE }} />
            <p className="text-xs leading-relaxed" style={{ color: BLUE }}>
              {isFr
                ? 'Contactez les coopératives pour atteindre leurs membres agriculteurs. Les coopératives servent de point de contact principal pour leurs membres.'
                : 'Contact cooperatives to reach their farmer members. Cooperatives serve as the main point of contact for their members.'}
            </p>
          </div>
          <h3 className="text-white font-bold">
            {isFr ? 'Réseau de coopératives partenaires' : 'Partner Cooperative Network'}
          </h3>
          {network.length === 0 ? (
            <div className={cardClass('text-center py-8')} style={{ background: SURFACE, borderColor: BORDER }}>
              <Network className="w-10 h-10 text-white/30 mx-auto mb-2" />
              <p className="text-white/50 text-sm">
                {isFr ? 'Aucune coopérative dans votre pays.' : 'No cooperatives in your country yet.'}
              </p>
            </div>
          ) : (
            network.map((c) => (
              <div
                key={c.id}
                className={cardClass('mb-3')}
                style={{ background: `linear-gradient(180deg, ${SURFACE}, ${SURFACE2})`, borderColor: BORDER }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${ACCENT}20` }}
                  >
                    <Users className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm">{c.name}</p>
                    <p className="text-white/50 text-xs">
                      {c.members} {isFr ? 'membres' : 'members'} · {c.region}
                    </p>
                    {c.contact && (
                      <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {c.contact}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {view === 'beneficiaries' && (
        <>
          {!showBeneficiary && (
            <button
              type="button"
              onClick={() => onCloseBeneficiary(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-black text-sm"
              style={{ background: ACCENT }}
            >
              <UserPlus className="w-5 h-5" />
              {isFr ? 'Enregistrer un bénéficiaire' : 'Register Beneficiary'}
            </button>
          )}

          {showBeneficiary && (
            <div className={cardClass()} style={{ background: SURFACE, borderColor: BORDER }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">
                  {isFr ? 'Nouveau bénéficiaire' : 'New Beneficiary'}
                </h3>
                <button type="button" onClick={() => onCloseBeneficiary(false)} className="text-white/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={submitBeneficiary} className="space-y-3">
                <label className="block">
                  <span className="text-white/60 text-xs">{isFr ? 'Nom complet *' : 'Full name *'}</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-white/60 text-xs">{isFr ? 'Genre' : 'Gender'}</span>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm"
                  >
                    <option value="female">{isFr ? 'Femme' : 'Female'}</option>
                    <option value="male">{isFr ? 'Homme' : 'Male'}</option>
                    <option value="other">{isFr ? 'Autre' : 'Other'}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-white/60 text-xs">{isFr ? 'Téléphone *' : 'Phone *'}</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-white/60 text-xs">{isFr ? 'Région' : 'Region'}</span>
                  <input
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-white/60 text-xs">{isFr ? 'Culture principale' : 'Main crop'}</span>
                  <input
                    value={form.mainCrop}
                    onChange={(e) => setForm({ ...form, mainCrop: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-white/60 text-xs">{isFr ? 'Programme' : 'Program'}</span>
                  <select
                    value={form.programId}
                    onChange={(e) => setForm({ ...form, programId: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-[#0a1a0f] border border-white/15 px-3 py-2.5 text-white text-sm"
                  >
                    <option value="">{isFr ? '— Optionnel —' : '— Optional —'}</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2"
                  style={{ background: ACCENT }}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isFr ? 'Enregistrer' : 'Register'}
                </button>
              </form>
            </div>
          )}

          {success && (
            <p className="text-sm flex items-center gap-2" style={{ color: ACCENT }}>
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </p>
          )}

          <h3 className="text-white font-bold">
            {isFr ? 'Bénéficiaires enregistrés' : 'Registered Beneficiaries'} ({beneficiaries.length})
          </h3>
          {beneficiaries.length === 0 ? (
            <div className={cardClass('text-center py-8')} style={{ background: SURFACE, borderColor: BORDER }}>
              <UserPlus className="w-10 h-10 text-white/30 mx-auto mb-2" />
              <p className="text-white/50 text-sm">
                {isFr ? 'Aucun bénéficiaire enregistré.' : 'No beneficiaries registered yet.'}
              </p>
            </div>
          ) : (
            beneficiaries.map((b) => (
              <div
                key={b.id}
                className={`${cardClass('mb-2 flex items-center gap-3')}`}
                style={{ background: SURFACE, borderColor: BORDER }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{ background: `${ACCENT}20`, color: ACCENT }}
                >
                  {(b.name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm truncate">{b.name}</p>
                  <p className="text-white/50 text-xs truncate">
                    {b.region} · {b.program || '—'}
                  </p>
                </div>
                {b.syncedWithRegistry && (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2ECC71]" title={isFr ? 'Synchronisé' : 'Synced'} />
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

function ReportsTab({ reports, programs, isFr, token, onRefresh }) {
  const [generating, setGenerating] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const downloadReport = async (reportId, fileName) => {
    const r = await fetch(`${API}/api/ngo/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'Download failed');
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = async (type) => {
    if (type === 'impact' && programs.length === 0) {
      setError(
        isFr
          ? 'Ajoutez au moins un programme avant le rapport impact.'
          : 'Add at least one program before generating the impact report.'
      );
      return;
    }
    setGenerating(type);
    setError('');
    setMessage('');
    try {
      const lang = isFr ? 'fr' : 'en';
      const r = await fetch(`${API}/api/ngo/reports/${type}/generate?lang=${lang}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Generation failed');
      await downloadReport(d.report.id, d.report.fileName);
      setMessage(
        isFr
          ? `Rapport "${d.report.title}" généré et téléchargé.`
          : `Report "${d.report.title}" generated and downloaded.`
      );
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
    setGenerating(null);
  };

  return (
    <div className="space-y-5 pb-4">
      <div
        className="rounded-xl p-3.5 border"
        style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}35` }}
      >
        <p className="text-[#2ECC71] font-bold text-sm flex items-center gap-2 mb-2">
          <Download className="w-4 h-4" />
          {isFr ? 'Comment fonctionnent les rapports ?' : 'How do reports work?'}
        </p>
        <p className="text-white/60 text-xs leading-relaxed whitespace-pre-line">
          {isFr
            ? '1. Cliquez sur « Générer PDF » pour créer le rapport.\n2. Le PDF est téléchargé immédiatement.\n3. Il apparaît aussi dans « Mes rapports générés » ci-dessous.'
            : '1. Click "Generate PDF" to create the report.\n2. The PDF downloads immediately.\n3. It also appears in "My Generated Reports" below.'}
        </p>
      </div>

      {error && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg">{error}</p>}
      {message && (
        <p className="text-xs flex items-center gap-2 p-2 rounded-lg" style={{ color: ACCENT, background: `${ACCENT}15` }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message}
        </p>
      )}

      <h3 className="text-white font-bold">{isFr ? 'Rapports disponibles' : 'Available Reports'}</h3>
      {REPORT_TYPES.map(({ type, icon: Icon, color, titleEn, titleFr, descEn, descFr }) => (
        <div
          key={type}
          className={cardClass('mb-3')}
          style={{ background: `linear-gradient(180deg, ${SURFACE}, ${SURFACE2})`, borderColor: `${color}35` }}
        >
          <div className="flex items-start gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{isFr ? titleFr : titleEn}</p>
              <p className="text-white/45 text-[10px]">
                {isFr ? 'Format PDF · Données en temps réel' : 'PDF Format · Real-time data'}
              </p>
            </div>
          </div>
          <p className="text-white/55 text-xs leading-relaxed mb-3">{isFr ? descFr : descEn}</p>
          <button
            type="button"
            disabled={generating === type}
            onClick={() => generateReport(type)}
            className="w-full py-2.5 rounded-lg font-bold text-black text-xs flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: color }}
          >
            {generating === type ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {generating === type
              ? isFr
                ? 'Génération...'
                : 'Generating...'
              : isFr
                ? 'Générer le rapport PDF'
                : 'Generate PDF'}
          </button>
        </div>
      ))}

      <h3 className="text-white font-bold">{isFr ? 'Mes rapports générés' : 'My Generated Reports'}</h3>
      {reports.length === 0 ? (
        <div className={cardClass('text-center py-8')} style={{ background: SURFACE, borderColor: BORDER }}>
          <FileText className="w-10 h-10 text-white/30 mx-auto mb-2" />
          <p className="text-white/50 text-sm">
            {isFr ? 'Aucun rapport généré.' : 'No reports generated yet.'}
          </p>
          <p className="text-white/35 text-xs mt-1">
            {isFr ? 'Générez votre premier rapport ci-dessus.' : 'Generate your first report above.'}
          </p>
        </div>
      ) : (
        reports.map((r) => (
          <div
            key={r.id}
            className={`${cardClass('mb-2 flex items-center justify-between gap-3')}`}
            style={{ background: SURFACE, borderColor: BORDER }}
          >
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{r.title}</p>
              <p className="text-white/45 text-xs">
                {formatDate(r.generatedAt)}
                {r.fileSize ? ` · ${Math.round(r.fileSize / 1024)} KB` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadReport(r.id, r.fileName).catch((e) => setError(e.message))}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black"
              style={{ background: ACCENT }}
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function AccountTab({ admin, isFr, onLogout, onTabChange }) {
  const name = admin?.name || admin?.organization || (isFr ? 'Organisation' : 'Organization');
  const initial = (name[0] || 'O').toUpperCase();

  return (
    <div className="space-y-4 pb-4">
      <div
        className="rounded-2xl p-5 border"
        style={{
          background: `linear-gradient(135deg, ${SURFACE}, #1a4a2e)`,
          borderColor: BORDER,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #1a8a4a)` }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-lg truncate">{name}</p>
            <p className="text-white/50 text-sm truncate flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {admin?.email}
            </p>
            <span
              className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
              style={{ color: ACCENT, borderColor: `${ACCENT}50`, background: `${ACCENT}18` }}
            >
              {isFr ? 'ONG & Partenaire' : 'NGO & Partner'}
            </span>
          </div>
        </div>
      </div>

      <div className={cardClass()} style={{ background: SURFACE, borderColor: BORDER }}>
        <h4 className="text-white/50 text-[10px] font-bold tracking-wider mb-3">
          {isFr ? 'ORGANISATION' : 'ORGANIZATION'}
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
            <div>
              <p className="text-white/50 text-xs">{isFr ? 'Organisation' : 'Organization'}</p>
              <p className="text-white">{admin?.organization || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
            <div>
              <p className="text-white/50 text-xs">{isFr ? 'Pays' : 'Country'}</p>
              <p className="text-white">{admin?.country || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <Link
        to="/platform-licensing?type=ngo"
        className={`${cardClass('flex items-center justify-between hover:bg-white/5 transition')}`}
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#2ECC71]" />
          <div>
            <p className="text-white font-semibold text-sm">
              {isFr ? 'Licence plateforme' : 'Platform licensing'}
            </p>
            <p className="text-white/45 text-xs">
              {isFr ? 'Gérer ou renouveler votre accès' : 'Manage or renew your access'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/30" />
      </Link>

      <button
        type="button"
        onClick={() => onTabChange('home')}
        className={`${cardClass('w-full flex items-center gap-3 text-left')}`}
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <Home className="w-5 h-5 text-[#2ECC71]" />
        <span className="text-white text-sm">{isFr ? 'Tableau de bord' : 'Dashboard'}</span>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/10 transition"
      >
        <LogOut className="w-4 h-4" />
        {isFr ? 'Se déconnecter' : 'Sign out'}
      </button>

      <p className="text-center text-white/25 text-xs pt-2">
        Sahel AgriConnect — NGO Portal v1.1.0
      </p>
    </div>
  );
}

function SideNav({ activeTab, isFr, onTabChange }) {
  return (
    <nav
      className="hidden md:flex flex-col w-52 shrink-0 border-r py-6 px-3 gap-1"
      style={{ borderColor: BORDER, background: '#060e09' }}
    >
      {TABS.map(({ id, icon: Icon, labelEn, labelFr }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition w-full text-left"
          style={{
            background: activeTab === id ? `${ACCENT}22` : 'transparent',
            color: activeTab === id ? ACCENT : MUTED,
          }}
        >
          <Icon className="w-5 h-5 shrink-0" />
          {isFr ? labelFr : labelEn}
        </button>
      ))}
    </nav>
  );
}

function BottomNav({ activeTab, isFr, onTabChange }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t safe-area-pb"
      style={{ background: '#060e09', borderColor: BORDER }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {TABS.map(({ id, icon: Icon, labelEn, labelFr }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5"
            style={{ color: activeTab === id ? ACCENT : MUTED }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{isFr ? labelFr : labelEn}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function NgoPortal() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const initial = getStoredAuth();
  const [token, setToken] = useState(initial.token);
  const [admin, setAdmin] = useState(initial.admin);
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);

  const fetchPortal = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFetchError('');
    try {
      const r = await fetch(`${API}/api/ngo/portal`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load portal');
      setPortal(d);
      if (d.admin) setAdmin(d.admin);
    } catch (err) {
      setFetchError(err.message);
      if (err.message?.includes('expired') || err.message?.includes('Invalid')) {
        localStorage.removeItem('ngo_token');
        localStorage.removeItem('ngo_admin');
        setToken(null);
        setAdmin(null);
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) fetchPortal();
  }, [token, fetchPortal]);

  const handleLogin = (newToken, newAdmin) => {
    setToken(newToken);
    setAdmin(newAdmin);
  };

  const handleLogout = () => {
    localStorage.removeItem('ngo_token');
    localStorage.removeItem('ngo_admin');
    setToken(null);
    setAdmin(null);
    setPortal(null);
    setActiveTab('home');
  };

  const handleTabChange = (tab, openModal) => {
    setActiveTab(tab);
    if (openModal === 'program') {
      setShowProgramForm(true);
      setShowBeneficiaryForm(false);
    } else if (openModal === 'beneficiary') {
      setShowBeneficiaryForm(true);
      setShowProgramForm(false);
    } else {
      setShowProgramForm(false);
      setShowBeneficiaryForm(false);
    }
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} isFr={isFr} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, color: '#fff' }}>
      <PortalHeader stats={portal?.stats} isFr={isFr} />

      <div className="flex flex-1 max-w-6xl w-full mx-auto min-h-0">
        <SideNav activeTab={activeTab} isFr={isFr} onTabChange={handleTabChange} />

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-24 md:pb-6 min-h-0">
          {loading && !portal && (
            <div className="flex items-center justify-center py-20 gap-2 text-white/50">
              <Loader2 className="w-6 h-6 animate-spin text-[#2ECC71]" />
              {isFr ? 'Chargement...' : 'Loading...'}
            </div>
          )}
          {fetchError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-4 text-red-300 text-sm">
              {fetchError}
              <button type="button" onClick={fetchPortal} className="ml-2 underline">
                {isFr ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}
          {portal && (
            <>
              {activeTab === 'home' && (
                <HomeTab portal={portal} isFr={isFr} onTabChange={handleTabChange} />
              )}
              {activeTab === 'programs' && (
                <ProgramsTab
                  programs={portal.programs || []}
                  isFr={isFr}
                  token={token}
                  onRefresh={fetchPortal}
                  showCreate={showProgramForm}
                  onCloseCreate={(open) => setShowProgramForm(!!open)}
                />
              )}
              {activeTab === 'network' && (
                <NetworkTab
                  network={portal.network || []}
                  beneficiaries={portal.beneficiaries || []}
                  programs={portal.programs || []}
                  isFr={isFr}
                  token={token}
                  onRefresh={fetchPortal}
                  showBeneficiary={showBeneficiaryForm}
                  onCloseBeneficiary={(open) => setShowBeneficiaryForm(!!open)}
                />
              )}
              {activeTab === 'reports' && (
                <ReportsTab
                  reports={portal.reports || []}
                  programs={portal.programs || []}
                  isFr={isFr}
                  token={token}
                  onRefresh={fetchPortal}
                />
              )}
              {activeTab === 'account' && (
                <AccountTab
                  admin={admin}
                  isFr={isFr}
                  onLogout={handleLogout}
                  onTabChange={handleTabChange}
                />
              )}
            </>
          )}
        </main>
      </div>

      <BottomNav activeTab={activeTab} isFr={isFr} onTabChange={handleTabChange} />
    </div>
  );
}
