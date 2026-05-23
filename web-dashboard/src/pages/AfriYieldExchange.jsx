import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, TrendingUp, Globe, ChevronRight, ArrowRight, Check, Star, Lock } from 'lucide-react';
import { INVESTOR_RESIDENCE_OPTIONS } from '../data/investorResidenceCountries';
import { useInvestorKYCStatus } from '../hooks/useInvestorKYCStatus';

const API = import.meta.env.VITE_API_BASE_URL;

/* ——— Scroll reveal ——— */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ScrollReveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const { ref, visible } = useScrollReveal();
  return (
    <Tag
      ref={ref}
      className={`ayx-reveal ${visible ? 'ayx-reveal--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ——— Count-up (requestAnimationFrame) ——— */
function useCountUp(target, active, { duration = 1400 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target == null || Number.isNaN(target)) return undefined;
    const end = Number(target);
    const hasDecimal = end % 1 !== 0;
    if (end === 0) {
      setValue(0);
      return undefined;
    }
    let startTs = null;
    let frame = 0;
    const tick = (ts) => {
      if (startTs == null) startTs = ts;
      const t = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      const raw = end * eased;
      setValue(hasDecimal ? Math.round(raw * 10) / 10 : Math.round(raw));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}

function CountUpNumber({ end, active, format = (n) => String(n) }) {
  const n = useCountUp(end, active);
  return <>{format(n)}</>;
}

function SectionLabel({ children }) {
  return (
    <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-[#B5850A]/70">
      {children}
    </p>
  );
}

function SectionDivider() {
  return (
    <div
      className="mx-auto h-px max-w-4xl"
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, rgba(181,133,10,0.45) 50%, transparent 100%)',
      }}
      aria-hidden
    />
  );
}

export default function AfriYieldExchange() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const kycState = useInvestorKYCStatus();
  const [stats, setStats] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [email, setEmail] = useState('');
  const [emailDone, setEmailDone] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [kycData, setKycData] = useState({
    fullName: '',
    country: '',
    idNumber: '',
    notUSPerson: false,
    acceptRisk: false,
    idType: 'passport',
  });
  const [kycLoading, setKycLoading] = useState(false);

  const heroStatsReveal = useScrollReveal(0.2);
  const whyStatsReveal = useScrollReveal(0.15);

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycData.notUSPerson || !kycData.acceptRisk) {
      alert(
        isFr
          ? 'Vous devez cocher toutes les déclarations pour continuer.'
          : 'You must check all declarations to continue.',
      );
      return;
    }
    setKycLoading(true);
    try {
      const res = await fetch(`${API}/api/investors/kyc-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycData),
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        /* non-JSON */
      }
      const status = data?.status;
      if (status === 'approved' || status === 'pending_review') {
        setKycOpen(false);
        navigate('/afri-yield/opportunities');
        return;
      }
      setKycOpen(false);
      navigate('/afri-yield/opportunities');
    } catch {
      setKycOpen(false);
      navigate('/afri-yield/opportunities');
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API}/api/opportunities/public-stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
    fetch(`${API}/api/opportunities?featured=true`)
      .then((r) => r.json())
      .then((d) => setOpportunities(d.opportunities?.slice(0, 3) || []))
      .catch(() => {});
  }, []);

  const tracks = [
    {
      id: 'A',
      color: '#1a3c2e',
      glow: 'rgba(26,60,46,0.55)',
      bg: '#f0fdf4',
      icon: '🚢',
      title: isFr ? 'Track A — Commerce direct' : 'Track A — Direct Trade',
      desc: isFr
        ? 'Vous avez des acheteurs. Nous avons les producteurs certifiés. Sourcez directement via notre réseau.'
        : 'You have buyers. We have certified producers. Source directly through our network.',
      tag: isFr ? 'Pour acheteurs diaspora' : 'For diaspora buyers',
      min: '$2,500',
      timeline: isFr ? '60–120 jours' : '60–120 days',
    },
    {
      id: 'B',
      color: '#B5850A',
      glow: 'rgba(181,133,10,0.5)',
      bg: '#fff7df',
      icon: '📈',
      title: isFr ? 'Track B — Capital de travail' : 'Track B — Working Capital',
      desc: isFr
        ? 'Investissez dans un cycle de production. Recevez votre capital + quote-part des revenus à la fin du cycle.'
        : 'Invest in a production cycle. Receive your capital + revenue share at cycle end.',
      tag: isFr ? 'Pour investisseurs' : 'For investors',
      min: '$1,000',
      timeline: isFr ? '90–180 jours' : '90–180 days',
      roi: '~12–30% proj.',
    },
    {
      id: 'C',
      color: '#3b82f6',
      glow: 'rgba(59,130,246,0.45)',
      bg: '#eff6ff',
      icon: '⭐',
      title: isFr ? 'Track C — Sourcing premium vérifié' : 'Track C — Premium Verified Sourcing',
      desc: isFr
        ? 'Membres premium vérifiés. Trouvez un produit, notre équipe vette le fournisseur sous 72h, transaction sécurisée.'
        : 'Verified premium members. Find a product, our team vets the supplier in 72h, secured transaction.',
      tag: isFr ? 'Membres premium' : 'Premium members',
      min: '$500',
      timeline: isFr ? '30–90 jours' : '30–90 days',
    },
  ];

  const trustPillars = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: isFr ? 'Escrow sécurisé' : 'Secured Escrow',
      desc: isFr
        ? "Vos fonds sont détenus par un agent d'escrow agréé — jamais directement par AfriYield"
        : 'Your funds held by licensed escrow agent — never directly by AfriYield',
    },
    {
      icon: <Check className="w-6 h-6" />,
      title: isFr ? 'Jalons vérifiés' : 'Verified Milestones',
      desc: isFr
        ? 'Les fonds sont libérés en 3 tranches sur vérification indépendante de chaque jalon'
        : 'Funds released in 3 tranches upon independent milestone verification',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: isFr ? 'Score AfriYield' : 'AfriYield Score',
      desc: isFr
        ? "Chaque coopérative et processeur a un score de réputation basé sur l'historique réel des transactions"
        : 'Each cooperative and processor has a reputation score based on real transaction history',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: isFr ? 'Conformité OHADA' : 'OHADA Compliance',
      desc: isFr
        ? 'Tous les accords respectent le droit commercial OHADA et sont opposables dans 17 pays africains'
        : 'All agreements comply with OHADA commercial law, enforceable in 17 African countries',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: isFr ? 'Vérification KYC' : 'KYC Verification',
      desc: isFr
        ? "Toutes les parties sont vérifiées: pièce d'identité, activité agricole, historique bancaire"
        : 'All parties verified: identity, agricultural activity, banking history',
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: isFr ? 'Fonds de réserve' : 'Reserve Fund',
      desc: isFr
        ? '0,5% de chaque transaction alimente le fonds de réserve AfriYield pour la résolution des litiges'
        : '0.5% of every transaction feeds the AfriYield reserve fund for dispute resolution',
    },
  ];

  const whyStats = [
    {
      value: '$100B+',
      numericEnd: null,
      label: isFr
        ? 'envoyés par la diaspora africaine chaque année via Western Union, Wave, MoneyGram'
        : 'sent by African diaspora every year via Western Union, Wave, MoneyGram',
    },
    {
      value: '0%',
      numericEnd: 0,
      label: isFr
        ? 'de ces transferts vont au développement agricole — AfriYield change ça'
        : 'of those transfers go to agricultural development — AfriYield changes that',
    },
    {
      value: '7.5%',
      numericEnd: 7.5,
      suffix: '%',
      label: isFr
        ? 'frais total AfriYield sur les transactions réussies — zéro frais sur les transactions échouées'
        : 'total AfriYield fee on successful transactions — zero fee on failed transactions',
    },
    {
      value: '90',
      numericEnd: 90,
      label: isFr
        ? 'jours en moyenne pour le premier retour sur un investissement Track B'
        : 'average days to first return on a Track B investment',
    },
  ];

  const heroStatItems = [
    {
      key: 'total',
      label: isFr ? 'Opportunités actives' : 'Active Opportunities',
      numeric: stats?.total != null ? Number(stats.total) : null,
      format: (n) => (stats?.total != null ? String(n) : '—'),
    },
    {
      key: 'raised',
      label: isFr ? 'Capital facilité' : 'Capital Facilitated',
      numeric: stats?.totalRaised != null ? Number(stats.totalRaised) : null,
      format: (n) =>
        stats?.totalRaised != null ? `$${n.toLocaleString()}` : '—',
    },
    {
      key: 'fee',
      label: isFr ? 'Frais total (succès)' : 'Total Fee (on success)',
      numeric: 7.5,
      format: (n) => `${n}%`,
    },
    {
      key: 'milestones',
      label: isFr ? 'Jalons escrow vérifiés' : 'Verified Escrow Milestones',
      numeric: 3,
      format: (n) => String(n),
    },
  ];

  return (
    <div className="ayx-page" style={{ background: '#0d1f17', minHeight: '100vh' }}>
      <style>{`
        .ayx-page {
          --ayx-gold: #B5850A;
          --ayx-green: #1a3c2e;
        }
        @keyframes ayx-hero-in {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ayx-shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes ayx-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.08); opacity: 0.55; }
        }
        @keyframes ayx-scan {
          0% { top: -2px; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ayx-grain-shift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2%, 1%); }
          50% { transform: translate(1%, -2%); }
          75% { transform: translate(2%, 2%); }
        }
        .ayx-hero-badge { animation: ayx-hero-in 0.7s ease-out both; }
        .ayx-hero-title { animation: ayx-hero-in 0.85s ease-out 0.1s both; }
        .ayx-hero-sub { animation: ayx-hero-in 0.85s ease-out 0.2s both; }
        .ayx-hero-meta { animation: ayx-hero-in 0.85s ease-out 0.28s both; }
        .ayx-hero-cta { animation: ayx-hero-in 0.9s ease-out 0.45s both; }
        .ayx-shimmer-gold {
          background: linear-gradient(
            105deg,
            #c9a227 0%,
            #f5e6a8 25%,
            #B5850A 45%,
            #f5e6a8 65%,
            #8a6410 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: ayx-shimmer 4s linear infinite;
        }
        .ayx-grain {
          pointer-events: none;
          position: absolute;
          inset: 0;
          opacity: 0.07;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: ayx-grain-shift 8s steps(4) infinite;
        }
        .ayx-pulse-ring {
          position: absolute;
          left: 50%;
          top: 42%;
          width: min(90vw, 720px);
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid rgba(181,133,10,0.25);
          box-shadow: 0 0 80px rgba(181,133,10,0.12), inset 0 0 60px rgba(29,158,117,0.08);
          animation: ayx-pulse-ring 4s ease-in-out infinite;
        }
        .ayx-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(181,133,10,0.35), transparent);
          animation: ayx-scan 6s linear infinite;
          pointer-events: none;
        }
        .ayx-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.75s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ayx-reveal--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .ayx-track-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .ayx-track-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* === HERO === */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            'linear-gradient(165deg, #0a1812 0%, #1a3c2e 45%, #0d1f17 85%, #0a1410 100%)',
        }}
      >
        <div className="ayx-grain" aria-hidden />
        <div className="ayx-pulse-ring" aria-hidden />
        <div className="ayx-scanline" aria-hidden />

        <div className="section-container relative z-10 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="ayx-hero-badge mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{
                background: 'rgba(181,133,10,0.12)',
                color: '#B5850A',
                borderColor: 'rgba(181,133,10,0.35)',
              }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B5850A]" />
              {isFr
                ? 'Plateforme de trade et investissement agricole africain'
                : 'African agricultural trade & investment platform'}
            </div>

            <h1
              className="ayx-hero-title mb-6 font-bold tracking-tight"
              style={{
                fontSize: 'clamp(2.75rem, 8vw, 4.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <span className="text-white">AfriYield</span>
              <span className="ayx-shimmer-gold"> Exchange</span>
            </h1>

            <p className="ayx-hero-sub mx-auto mb-4 max-w-3xl text-lg leading-relaxed text-white/70 md:text-2xl">
              {isFr
                ? "Transformez vos transferts diaspora en capital agricole productif. Connectez-vous directement aux coopératives et processeurs certifiés d'Afrique de l'Ouest."
                : 'Transform your diaspora transfers into productive agricultural capital. Connect directly to certified cooperatives and processors across West Africa.'}
            </p>
            <p className="ayx-hero-meta mb-12 text-[11px] uppercase tracking-[0.25em] text-white/35">
              {isFr
                ? 'Facilité par Djigui Corporation · Conforme OHADA · Escrow sécurisé'
                : 'Facilitated by Djigui Corporation · OHADA Compliant · Secured Escrow'}
            </p>

            <div
              ref={heroStatsReveal.ref}
              className="mx-auto mb-12 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {heroStatItems.map(({ key, label, numeric, format }) => (
                <div
                  key={key}
                  className={`rounded-2xl border p-4 text-center backdrop-blur-sm transition-all duration-700 ${
                    heroStatsReveal.visible
                      ? 'border-white/15 bg-white/[0.08] opacity-100'
                      : 'border-transparent bg-white/[0.03] opacity-60'
                  }`}
                >
                  <p className="text-2xl font-bold tabular-nums" style={{ color: '#B5850A' }}>
                    {numeric != null && heroStatsReveal.visible ? (
                      <CountUpNumber end={numeric} active={heroStatsReveal.visible} format={format} />
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{label}</p>
                </div>
              ))}
            </div>

            <div className="ayx-hero-cta flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/afri-yield/opportunities"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-[#1a3c2e] transition hover:opacity-90"
                style={{ background: '#B5850A' }}
              >
                {isFr ? 'Voir les opportunités' : 'Browse Opportunities'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/afri-yield/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 px-8 py-4 text-lg font-bold text-white transition hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.3)' }}
              >
                {isFr ? "M'inscrire comme investisseur" : 'Register as Investor'}
              </Link>
            </div>
          </div>
        </div>

        <SectionDivider />
      </section>

      {kycState.isRegistered && !kycState.loading && (
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3"
            style={{
              background: kycState.canInvest
                ? 'rgba(29,158,117,0.08)'
                : kycState.kycUnderReview
                  ? 'rgba(59,130,246,0.08)'
                  : 'rgba(245,158,11,0.08)',
              borderColor: kycState.canInvest
                ? 'rgba(29,158,117,0.3)'
                : kycState.kycUnderReview
                  ? 'rgba(59,130,246,0.3)'
                  : 'rgba(245,158,11,0.3)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {kycState.canInvest ? '✅' : kycState.kycUnderReview ? '⏳' : '⚠️'}
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: kycState.canInvest ? '#1D9E75' : kycState.kycUnderReview ? '#60a5fa' : '#B5850A',
                  }}
                >
                  {isFr ? `Bonjour, ${kycState.name}` : `Hello, ${kycState.name}`}
                  {' · '}
                  {kycState.canInvest
                    ? isFr
                      ? 'KYC approuvé ✓'
                      : 'KYC approved ✓'
                    : kycState.kycUnderReview
                      ? isFr
                        ? 'KYC en cours de révision'
                        : 'KYC under review'
                      : isFr
                        ? 'KYC requis pour investir'
                        : 'KYC required to invest'}
                </p>
                {kycState.kycUnderReview && (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {isFr
                      ? 'Vous serez notifié par email dès validation.'
                      : 'You will be notified by email once validated.'}
                  </p>
                )}
              </div>
            </div>
            {kycState.needsKYC && (
              <Link
                to="/afri-yield/register?step=kyc"
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold text-black"
                style={{ backgroundColor: '#B5850A' }}
              >
                {isFr ? 'Compléter KYC →' : 'Complete KYC →'}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* === WHY STATS === */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(180deg, #0d1f17 0%, #111e17 50%, #0d1f17 100%)',
        }}
      >
        <div className="section-container">
          <SectionLabel>
            {isFr ? 'Pourquoi AfriYield change tout' : 'Why AfriYield changes everything'}
          </SectionLabel>
          <div ref={whyStatsReveal.ref} className="grid gap-6 md:grid-cols-4">
            {whyStats.map(({ value, numericEnd, suffix, label }, i) => (
              <div
                key={value}
                className={`text-center transition-all duration-700 ${
                  whyStatsReveal.visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-6 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="mb-3 text-4xl font-bold tabular-nums" style={{ color: '#B5850A' }}>
                  {numericEnd != null && whyStatsReveal.visible ? (
                    <WhyStatValue end={numericEnd} active={whyStatsReveal.visible} suffix={suffix} />
                  ) : (
                    value
                  )}
                </p>
                <p className="text-sm leading-relaxed text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12">
          <SectionDivider />
        </div>
      </section>

      {/* === TRACKS === */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(180deg, #111e17 0%, #0f1a14 100%)',
        }}
      >
        <div className="section-container">
          <ScrollReveal className="mb-12 text-center">
            <SectionLabel>
              {isFr ? 'Tracks d\'investissement' : 'Investment tracks'}
            </SectionLabel>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">
              {isFr ? "Trois façons d'investir" : 'Three Ways to Invest'}
            </h2>
            <p className="text-white/50">
              {isFr
                ? 'Choisissez le track qui correspond à votre profil et vos objectifs'
                : 'Choose the track that matches your profile and goals'}
            </p>
          </ScrollReveal>

          <div className="grid gap-5 md:grid-cols-3">
            {tracks.map((track, i) => (
              <ScrollReveal key={track.id} delay={i * 100}>
                <div
                  className="ayx-track-card overflow-hidden rounded-2xl border"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: `${track.color}55`,
                    boxShadow: `0 0 32px ${track.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <div className="px-5 pb-4 pt-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-3xl">{track.icon}</span>
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: `${track.color}30`, color: track.color }}
                      >
                        {track.tag}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-white">{track.title}</h3>
                    <p className="mb-5 text-sm leading-relaxed text-white/50">{track.desc}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-white/40">
                          {isFr ? 'Min. investissement' : 'Min. investment'}
                        </p>
                        <p className="font-bold text-white">{track.min}</p>
                      </div>
                      <div
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-white/40">
                          {isFr ? 'Durée du cycle' : 'Cycle duration'}
                        </p>
                        <p className="font-bold text-white">{track.timeline}</p>
                      </div>
                    </div>
                    {track.roi && (
                      <div
                        className="mt-2 rounded-xl p-3 text-center"
                        style={{ background: '#B5850A20' }}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-white/40">
                          {isFr ? 'Retour estimé' : 'Estimated return'}
                        </p>
                        <p className="font-bold" style={{ color: '#B5850A' }}>
                          {track.roi}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="px-5 pb-5">
                    {track.id === 'B' ? (
                      <button
                        type="button"
                        onClick={() => setKycOpen(true)}
                        className="block w-full rounded-xl py-3 text-center text-sm font-bold transition hover:opacity-90"
                        style={{
                          background: track.color,
                          color: '#1a3c2e',
                          boxShadow: `0 4px 24px ${track.glow}`,
                        }}
                      >
                        {isFr ? `Voir les deals Track ${track.id}` : `Browse Track ${track.id} Deals`}
                      </button>
                    ) : (
                      <Link
                        to="/afri-yield/opportunities"
                        className="block w-full rounded-xl py-3 text-center text-sm font-bold transition hover:opacity-90"
                        style={{
                          background: track.color,
                          color: track.id === 'A' ? '#fff' : track.id === 'C' ? '#fff' : '#1a3c2e',
                          boxShadow: `0 4px 24px ${track.glow}`,
                        }}
                      >
                        {isFr ? `Voir les deals Track ${track.id}` : `Browse Track ${track.id} Deals`}
                      </Link>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
        <div className="mt-12">
          <SectionDivider />
        </div>
      </section>

      {/* === FEATURED OPPORTUNITIES === */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(180deg, #0d1f17 0%, #0a1610 100%)',
        }}
      >
        <div className="section-container">
          <div className="mx-auto mb-6 max-w-4xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 text-xl text-amber-400">⚠️</span>
              <div>
                <p className="mb-1 text-sm font-bold text-amber-400">
                  {isFr ? 'Avis légal important' : 'Important Legal Notice'}
                </p>
                <p className="text-xs leading-relaxed text-white/70">
                  {isFr
                    ? "AfriYield Exchange est une plateforme de facilitation d'investissement exploitée par Djigui Corporation. Nous ne sommes pas une institution financière agréée ou un courtier-négociant. Les investissements comportent des risques incluant la perte totale du capital. Les rendements affichés sont des projections basées sur les performances historiques des coopératives partenaires et ne constituent pas une garantie. Consultez un conseiller financier avant d'investir. Tous les paiements sont traités exclusivement via le portail web sécurisé."
                    : 'AfriYield Exchange is an investment facilitation platform operated by Djigui Corporation. We are not a licensed financial institution or broker-dealer. Investments carry risk including total loss of capital. Returns shown are projections based on historical partner cooperative performance and do not constitute a guarantee. Consult a financial advisor before investing. All payments are processed exclusively through the secure web portal.'}
                </p>
                <p className="mt-2 text-xs font-medium text-amber-400/60">
                  {isFr
                    ? '🌍 Opéré par Djigui Corporation — Pas une institution financière agréée'
                    : '🌍 Operated by Djigui Corporation — Not a licensed financial institution'}
                </p>
              </div>
            </div>
          </div>

          <ScrollReveal className="mb-10 flex items-center justify-between">
            <div>
              <SectionLabel>
                {isFr ? 'Opportunités' : 'Opportunities'}
              </SectionLabel>
              <h2 className="mb-2 text-3xl font-bold text-white">
                {isFr ? 'Opportunités en vedette' : 'Featured Opportunities'}
              </h2>
              <p className="text-sm text-white/40">
                {isFr
                  ? 'Toutes vérifiées, toutes assurées, toutes sous escrow'
                  : 'All verified, all insured, all under escrow'}
              </p>
            </div>
            <Link
              to="/afri-yield/opportunities"
              className="flex items-center gap-2 text-sm font-semibold transition"
              style={{ color: '#B5850A' }}
            >
              {isFr ? 'Toutes les opportunités' : 'All opportunities'}{' '}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>

          {opportunities.length === 0 ? (
            <ScrollReveal>
              <div
                className="rounded-2xl py-16 text-center"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="mb-3 text-4xl">🌾</p>
                <p className="text-white/40">
                  {isFr
                    ? 'Premières opportunités vérifiées en cours de validation.'
                    : 'First verified opportunities being validated.'}
                </p>
                <Link
                  to="/afri-yield/register"
                  className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-bold"
                  style={{ background: '#B5850A', color: '#1a3c2e' }}
                >
                  {isFr ? "S'inscrire pour être notifié" : 'Register to be notified'}
                </Link>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {opportunities.map((opp, i) => (
                <ScrollReveal key={opp._id || opp.id} delay={i * 80}>
                  <OpportunityCard opp={opp} isFr={isFr} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
        <div className="mt-12">
          <SectionDivider />
        </div>
      </section>

      {/* === TRUST PILLARS === */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(180deg, #111e17 0%, #0d1f17 100%)',
        }}
      >
        <div className="section-container">
          <ScrollReveal className="mb-12 text-center">
            <SectionLabel>
              {isFr ? 'Protection du capital' : 'Capital protection'}
            </SectionLabel>
            <h2 className="mb-3 text-3xl font-bold text-white">
              {isFr ? 'Comment nous protégeons votre capital' : 'How we protect your capital'}
            </h2>
            <p className="text-white/40">
              {isFr
                ? "7 couches de protection — de la vérification KYC à l'escrow agréé"
                : '7 protection layers — from KYC verification to licensed escrow'}
            </p>
          </ScrollReveal>

          <div className="grid gap-5 md:grid-cols-3">
            {trustPillars.map(({ icon, title, desc }, i) => (
              <ScrollReveal key={title} delay={i * 60}>
                <div
                  className="rounded-2xl border p-5 backdrop-blur-sm"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(181,133,10,0.2)', color: '#B5850A' }}
                  >
                    {icon}
                  </div>
                  <h3 className="mb-2 font-bold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={200}>
            <div
              className="mt-10 rounded-2xl border p-6 text-center"
              style={{
                background: 'rgba(181,133,10,0.1)',
                borderColor: 'rgba(181,133,10,0.2)',
              }}
            >
              <p className="mb-2 text-sm text-white/60">
                {isFr
                  ? 'Besoin de comprendre en détail comment fonctionne AfriYield?'
                  : 'Need to understand in detail how AfriYield works?'}
              </p>
              <Link
                to="/how-it-works"
                style={{ color: '#B5850A' }}
                className="text-sm font-bold hover:underline"
              >
                {isFr ? 'Lire notre guide complet de transparence →' : 'Read our complete transparency guide →'}
              </Link>
            </div>
          </ScrollReveal>
        </div>
        <div className="mt-12">
          <SectionDivider />
        </div>
      </section>

      {/* === PREMIUM === */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(180deg, #0d1f17 0%, #1a3c2e22 50%, #0d1f17 100%)',
        }}
      >
        <div className="section-container">
          <ScrollReveal>
            <div
              className="mx-auto max-w-3xl overflow-hidden rounded-3xl"
              style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}
            >
              <div className="p-8 md:p-12">
                <div className="mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5" style={{ color: '#B5850A' }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.35em]"
                    style={{ color: '#B5850A' }}
                  >
                    AfriYield Premium
                  </span>
                </div>
                <h2 className="mb-3 text-3xl font-bold text-white">
                  {isFr ? 'Accès complet. Priorité totale.' : 'Full access. Full priority.'}
                </h2>
                <p className="mb-8 max-w-xl text-white/60">
                  {isFr
                    ? 'Alertes de deal en temps réel, accès aux opportunités Track C, rapports de marché hebdomadaires, appel conseil gratuit mensuel.'
                    : 'Real-time deal alerts, Track C opportunity access, weekly market reports, monthly free advisory call.'}
                </p>
                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  {[
                    isFr ? 'Accès prioritaire aux nouveaux deals' : 'Priority access to new deals',
                    isFr ? 'Alertes prix commodités en temps réel' : 'Real-time commodity price alerts',
                    isFr ? 'Rapports de marché hebdomadaires' : 'Weekly market reports',
                    isFr ? 'Appel conseil mensuel gratuit ($99 valeur)' : 'Monthly free advisory call ($99 value)',
                    isFr ? 'Score AfriYield des fournisseurs visible' : 'Supplier AfriYield Score visible',
                    isFr ? 'Accès Track C — sourcing premium vérifié' : 'Track C access — verified premium sourcing',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#B5850A' }} />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Link
                    to="/afri-yield/register"
                    className="rounded-xl px-8 py-3.5 font-bold text-[#1a3c2e]"
                    style={{ background: '#B5850A' }}
                  >
                    {isFr ? `S'inscrire — $299/an` : `Subscribe — $299/year`}
                  </Link>
                  <span className="text-sm text-white/40">
                    {isFr
                      ? 'ou $29.99/mois · Premier appel conseil gratuit'
                      : 'or $29.99/month · First advisory call free'}
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
        <div className="mt-12">
          <SectionDivider />
        </div>
      </section>

      {/* === WAITLIST === */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(180deg, #111e17 0%, #0a1410 100%)',
        }}
      >
        <div className="section-container">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <SectionLabel>{isFr ? 'Liste d\'attente' : 'Waitlist'}</SectionLabel>
            <h2 className="mb-3 text-3xl font-bold text-white">
              {isFr
                ? 'Prêt à transformer vos transferts en capital?'
                : 'Ready to transform your transfers into capital?'}
            </h2>
            <p className="mb-8 text-white/50">
              {isFr
                ? "Recevez une notification dès que la première opportunité est disponible dans votre région d'intérêt."
                : 'Get notified the moment the first opportunity is available in your region of interest.'}
            </p>
            {emailDone ? (
              <p className="font-semibold text-green-400">
                ✓ {isFr ? 'Parfait ! Vous serez notifié en priorité.' : 'Done! You will be notified with priority.'}
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await fetch(`${API}/api/waitlist`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, source: 'afriyield_landing' }),
                    });
                  } catch {}
                  setEmailDone(true);
                }}
                className="mx-auto flex max-w-md gap-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
                  className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                />
                <button
                  type="submit"
                  className="rounded-xl px-5 py-3 text-sm font-bold text-[#1a3c2e]"
                  style={{ background: '#B5850A' }}
                >
                  {isFr ? "M'inscrire" : 'Notify me'}
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </section>

      {kycOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-[#1a3c2e]">
              {isFr ? 'Vérification identité requise' : 'Identity Verification Required'}
            </h3>
            <p className="mb-5 text-sm text-gray-500">
              {isFr
                ? 'Conformité OHADA — requis avant tout investissement Track B'
                : 'OHADA Compliance — required before any Track B investment'}
            </p>
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {isFr ? "Nom complet (tel que sur votre pièce d'identité)" : 'Full legal name (as on ID)'}
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={kycData.fullName}
                  onChange={(e) => setKycData((d) => ({ ...d, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {isFr ? 'Pays de résidence' : 'Country of residence'}
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#B5850A]"
                  value={kycData.country}
                  onChange={(e) => setKycData((d) => ({ ...d, country: e.target.value }))}
                >
                  <option value="">{isFr ? 'Sélectionnez un pays' : 'Select a country'}</option>
                  {INVESTOR_RESIDENCE_OPTIONS.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {isFr ? "Numéro passeport ou pièce d'identité nationale" : 'Passport or national ID number'}
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={kycData.idNumber}
                  onChange={(e) => setKycData((d) => ({ ...d, idNumber: e.target.value }))}
                />
              </div>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-amber-500"
                    checked={kycData.notUSPerson}
                    onChange={(e) => setKycData((d) => ({ ...d, notUSPerson: e.target.checked }))}
                  />
                  <span className="text-xs leading-relaxed text-gray-700">
                    {isFr
                      ? 'Je confirme que je ne suis PAS une "US Person" au sens de la réglementation SEC américaine. (Ressortissants/résidents américains: contactez compliance@sahelagriconnect.com)'
                      : 'I confirm I am NOT a "US Person" under US SEC regulations. (US citizens/residents: contact compliance@sahelagriconnect.com)'}
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-amber-500"
                    checked={kycData.acceptRisk}
                    onChange={(e) => setKycData((d) => ({ ...d, acceptRisk: e.target.checked }))}
                  />
                  <span className="text-xs leading-relaxed text-gray-700">
                    {isFr
                      ? 'Je reconnais que les investissements agricoles comportent des risques incluant la perte du capital. Les rendements projetés ne sont PAS garantis. Je ne recevrai pas de conseil financier personnalisé de cette plateforme.'
                      : 'I acknowledge that agricultural investments carry risks including loss of capital. Projected returns are NOT guaranteed. I will not receive personalized financial advice from this platform.'}
                  </span>
                </label>

                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <p className="text-xs text-blue-700">
                    💳{' '}
                    {isFr
                      ? "Tous les paiements d'investissement sont traités exclusivement via ce portail web sécurisé. Aucun paiement via l'application mobile."
                      : 'All investment payments are processed exclusively through this secure web portal. No payments via the mobile app.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setKycOpen(false)}
                  className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
                >
                  {isFr ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={kycLoading || !kycData.notUSPerson || !kycData.acceptRisk}
                  className="flex-1 rounded-xl bg-[#B5850A] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {kycLoading ? '...' : isFr ? 'Soumettre' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WhyStatValue({ end, active, suffix = '' }) {
  const isDecimal = !Number.isInteger(end);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let startTs = null;
    let frame = 0;
    const tick = (ts) => {
      if (startTs == null) startTs = ts;
      const t = Math.min((ts - startTs) / 1400, 1);
      const eased = 1 - (1 - t) ** 3;
      const v = end * eased;
      setDisplay(isDecimal ? Math.round(v * 10) / 10 : Math.round(v));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, active, isDecimal]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}

function OpportunityCard({ opp, isFr }) {
  const fundingPct =
    opp.amountSought > 0 ? Math.min(100, Math.round((opp.amountRaised / opp.amountSought) * 100)) : 0;
  const trackColor =
    { 'Track A': '#1a3c2e', 'Track B': '#B5850A', 'Track C': '#3b82f6', All: '#6b7280' }[opp.track] ||
    '#1a3c2e';

  return (
    <Link
      to={`/afri-yield/opportunities/${opp._id}`}
      className="block overflow-hidden rounded-2xl transition hover:scale-[1.01]"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="p-5 pb-0">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                style={{ background: trackColor }}
              >
                {opp.track}
              </span>
              {opp.verified && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: '#B5850A20', color: '#B5850A' }}
                >
                  ✓ Vérifié
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold leading-snug text-white">{opp.centerName}</h3>
            <p className="mt-0.5 text-sm text-white/40">
              🌍 {opp.location}, {opp.country}
            </p>
          </div>
          {opp.afriyieldScore > 0 && (
            <div className="text-center">
              <p
                className="text-lg font-bold"
                style={{
                  color:
                    opp.afriyieldScore >= 70 ? '#4ade80' : opp.afriyieldScore >= 50 ? '#B5850A' : '#f87171',
                }}
              >
                {opp.afriyieldScore}
              </p>
              <p className="text-xs text-white/30">Score</p>
            </div>
          )}
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/50">{opp.description}</p>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-white/30">{isFr ? 'Recherché' : 'Seeking'}</p>
            <p className="text-sm font-bold text-white">${(opp.amountSought || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-white/30">{isFr ? 'Min.' : 'Min.'}</p>
            <p className="text-sm font-bold text-white">${(opp.minInvestment || 1000).toLocaleString()}</p>
          </div>
          {opp.expectedROIMin > 0 ? (
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(181,133,10,0.1)' }}>
              <p className="text-xs" style={{ color: 'rgba(181,133,10,0.5)' }}>
                {isFr ? 'Rend. proj.' : 'Proj. ROI'}
              </p>
              <p className="text-sm font-bold" style={{ color: '#B5850A' }}>
                <span>
                  ~{opp.expectedROIMin}–{opp.expectedROIMax}%
                </span>
                <span className="ml-1 text-xs text-white/40">proj.</span>
              </p>
            </div>
          ) : (
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-white/30">{isFr ? 'Jours' : 'Days'}</p>
              <p className="text-sm font-bold text-white">{opp.cycledays}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex justify-between text-xs text-white/40">
            <span>
              ${(opp.amountRaised || 0).toLocaleString()} {isFr ? 'levés' : 'raised'}
            </span>
            <span>{fundingPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${fundingPct}%`,
                background: fundingPct >= 80 ? '#4ade80' : '#B5850A',
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex flex-wrap gap-2">
          {opp.commodities?.length
            ? opp.commodities.map((c) => (
                <span key={c} className="text-xs text-white/40">
                  {c}
                </span>
              ))
            : opp.commodity && <span className="text-xs text-white/40">{opp.commodity}</span>}
        </div>
        <span className="text-xs font-semibold" style={{ color: '#B5850A' }}>
          {isFr ? 'Voir le deal →' : 'View deal →'}
        </span>
      </div>
    </Link>
  );
}
