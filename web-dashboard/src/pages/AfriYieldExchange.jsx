import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, TrendingUp, Globe, ChevronRight, ArrowRight, Check, Star, Lock } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

export default function AfriYieldExchange() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [email, setEmail] = useState('');
  const [emailDone, setEmailDone] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [kycData, setKycData] = useState({ fullName: '', country: '', idNumber: '', notUSPerson: false });
  const [kycLoading, setKycLoading] = useState(false);

  const handleKycSubmit = async (e) => {
    e.preventDefault();
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
      bg: '#fff7df',
      icon: '📈',
      title: isFr ? 'Track B — Capital de travail' : 'Track B — Working Capital',
      desc: isFr
        ? 'Investissez dans un cycle de production. Recevez votre capital + quote-part des revenus à la fin du cycle.'
        : 'Invest in a production cycle. Receive your capital + revenue share at cycle end.',
      tag: isFr ? 'Pour investisseurs' : 'For investors',
      min: '$1,000',
      timeline: isFr ? '90–180 jours' : '90–180 days',
      roi: '12–30%',
    },
    {
      id: 'C',
      color: '#3b82f6',
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
      label: isFr
        ? 'envoyés par la diaspora africaine chaque année via Western Union, Wave, MoneyGram'
        : 'sent by African diaspora every year via Western Union, Wave, MoneyGram',
    },
    {
      value: '0%',
      label: isFr
        ? 'de ces transferts vont au développement agricole — AfriYield change ça'
        : 'of those transfers go to agricultural development — AfriYield changes that',
    },
    {
      value: '7.5%',
      label: isFr
        ? 'frais total AfriYield sur les transactions réussies — zéro frais sur les transactions échouées'
        : 'total AfriYield fee on successful transactions — zero fee on failed transactions',
    },
    {
      value: '90',
      label: isFr
        ? 'jours en moyenne pour le premier retour sur un investissement Track B'
        : 'average days to first return on a Track B investment',
    },
  ];

  return (
    <div style={{ background: '#0d1f17', minHeight: '100vh' }}>
      {/* === HERO === */}
      <section
        style={{ background: 'linear-gradient(160deg, #0d1f17 0%, #1a3c2e 60%, #0d1f17 100%)' }}
        className="text-white"
      >
        <div className="section-container py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
              style={{
                background: 'rgba(181,133,10,0.2)',
                color: '#B5850A',
                border: '1px solid rgba(181,133,10,0.3)',
              }}
            >
              <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-[#B5850A]" />
              {isFr ? 'Plateforme de trade et investissement agricole africain' : 'African agricultural trade & investment platform'}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ lineHeight: 1.1 }}>
              AfriYield
              <span style={{ color: '#B5850A' }}> Exchange</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-4 leading-relaxed">
              {isFr
                ? "Transformez vos transferts diaspora en capital agricole productif. Connectez-vous directement aux coopératives et processeurs certifiés d'Afrique de l'Ouest."
                : 'Transform your diaspora transfers into productive agricultural capital. Connect directly to certified cooperatives and processors across West Africa.'}
            </p>
            <p className="text-sm text-white/40 mb-12">
              {isFr ? 'Facilité par Djigui Corporation · Conforme OHADA · Escrow sécurisé' : 'Facilitated by Djigui Corporation · OHADA Compliant · Secured Escrow'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
              {[
                { val: stats?.total ?? '—', label: isFr ? 'Opportunités actives' : 'Active Opportunities' },
                {
                  val: stats?.totalRaised ? `$${Number(stats.totalRaised).toLocaleString()}` : '—',
                  label: isFr ? 'Capital facilité' : 'Capital Facilitated',
                },
                { val: '7.5%', label: isFr ? 'Frais total (succès)' : 'Total Fee (on success)' },
                { val: '3', label: isFr ? 'Jalons escrow vérifiés' : 'Verified Escrow Milestones' },
              ].map(({ val, label }) => (
                <div
                  key={label}
                  className="text-center rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <p className="text-2xl font-bold" style={{ color: '#B5850A' }}>
                    {val}
                  </p>
                  <p className="text-xs text-white/50 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/afri-yield/opportunities"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-[#1a3c2e] text-lg transition hover:opacity-90"
                style={{ background: '#B5850A' }}
              >
                {isFr ? 'Voir les opportunités' : 'Browse Opportunities'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/afri-yield/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-lg transition hover:bg-white/10"
                style={{ border: '2px solid rgba(255,255,255,0.3)' }}
              >
                {isFr ? "M'inscrire comme investisseur" : 'Register as Investor'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#0d1f17' }} className="py-16">
        <div className="section-container">
          <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-10">
            {isFr ? 'Pourquoi AfriYield change tout' : 'Why AfriYield changes everything'}
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {whyStats.map(({ value, label }) => (
              <div key={value} className="text-center">
                <p className="text-4xl font-bold mb-3" style={{ color: '#B5850A' }}>
                  {value}
                </p>
                <p className="text-sm text-white/50 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#111e17' }} className="py-16">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              {isFr ? "Trois façons d'investir" : 'Three Ways to Invest'}
            </h2>
            <p className="text-white/50">
              {isFr ? 'Choisissez le track qui correspond à votre profil et vos objectifs' : 'Choose the track that matches your profile and goals'}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="rounded-2xl overflow-hidden border transition hover:border-white/20"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{track.icon}</span>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ background: track.color + '30', color: track.color }}
                    >
                      {track.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{track.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-5">{track.desc}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <p className="text-xs text-white/40">{isFr ? 'Min. investissement' : 'Min. investment'}</p>
                      <p className="font-bold text-white">{track.min}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <p className="text-xs text-white/40">{isFr ? 'Durée du cycle' : 'Cycle duration'}</p>
                      <p className="font-bold text-white">{track.timeline}</p>
                    </div>
                  </div>
                  {track.roi && (
                    <div className="mt-2 rounded-xl p-3 text-center" style={{ background: '#B5850A20' }}>
                      <p className="text-xs text-white/40">{isFr ? 'Retour estimé' : 'Estimated return'}</p>
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
                      className="block w-full text-center py-3 rounded-xl font-bold text-sm transition hover:opacity-90"
                      style={{
                        background: track.color,
                        color: '#1a3c2e',
                      }}
                    >
                      {isFr ? `Voir les deals Track ${track.id}` : `Browse Track ${track.id} Deals`}
                    </button>
                  ) : (
                    <Link
                      to="/afri-yield/opportunities"
                      className="block w-full text-center py-3 rounded-xl font-bold text-sm transition hover:opacity-90"
                      style={{
                        background: track.color,
                        color: track.id === 'A' ? '#fff' : track.id === 'C' ? '#fff' : '#1a3c2e',
                      }}
                    >
                      {isFr ? `Voir les deals Track ${track.id}` : `Browse Track ${track.id} Deals`}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#0d1f17' }} className="py-16">
        <div className="section-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isFr ? 'Opportunités en vedette' : 'Featured Opportunities'}
              </h2>
              <p className="text-white/40 text-sm">
                {isFr ? 'Toutes vérifiées, toutes assurées, toutes sous escrow' : 'All verified, all insured, all under escrow'}
              </p>
            </div>
            <Link
              to="/afri-yield/opportunities"
              className="flex items-center gap-2 text-sm font-semibold transition"
              style={{ color: '#B5850A' }}
            >
              {isFr ? 'Toutes les opportunités' : 'All opportunities'} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {opportunities.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-4xl mb-3">🌾</p>
              <p className="text-white/40">
                {isFr
                  ? 'Premières opportunités vérifiées en cours de validation.'
                  : 'First verified opportunities being validated.'}
              </p>
              <Link
                to="/afri-yield/register"
                className="inline-block mt-4 px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#B5850A', color: '#1a3c2e' }}
              >
                {isFr ? "S'inscrire pour être notifié" : 'Register to be notified'}
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp._id || opp.id} opp={opp} isFr={isFr} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: '#111e17' }} className="py-16">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              {isFr ? 'Comment nous protégeons votre capital' : 'How we protect your capital'}
            </h2>
            <p className="text-white/40">
              {isFr
                ? "7 couches de protection — de la vérification KYC à l'escrow agréé"
                : '7 protection layers — from KYC verification to licensed escrow'}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {trustPillars.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(181,133,10,0.2)', color: '#B5850A' }}
                >
                  {icon}
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div
            className="mt-10 rounded-2xl p-6 text-center"
            style={{ background: 'rgba(181,133,10,0.1)', border: '1px solid rgba(181,133,10,0.2)' }}
          >
            <p className="text-white/60 text-sm mb-2">
              {isFr ? 'Besoin de comprendre en détail comment fonctionne AfriYield?' : 'Need to understand in detail how AfriYield works?'}
            </p>
            <Link to="/how-it-works" style={{ color: '#B5850A' }} className="font-bold text-sm hover:underline">
              {isFr ? 'Lire notre guide complet de transparence →' : 'Read our complete transparency guide →'}
            </Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#0d1f17' }} className="py-16">
        <div className="section-container">
          <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a3d)' }}>
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5" style={{ color: '#B5850A' }} />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#B5850A' }}>
                  AfriYield Premium
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                {isFr ? 'Accès complet. Priorité totale.' : 'Full access. Full priority.'}
              </h2>
              <p className="text-white/60 mb-8 max-w-xl">
                {isFr
                  ? 'Alertes de deal en temps réel, accès aux opportunités Track C, rapports de marché hebdomadaires, appel conseil gratuit mensuel.'
                  : 'Real-time deal alerts, Track C opportunity access, weekly market reports, monthly free advisory call.'}
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  isFr ? 'Accès prioritaire aux nouveaux deals' : 'Priority access to new deals',
                  isFr ? 'Alertes prix commodités en temps réel' : 'Real-time commodity price alerts',
                  isFr ? 'Rapports de marché hebdomadaires' : 'Weekly market reports',
                  isFr ? 'Appel conseil mensuel gratuit ($99 valeur)' : 'Monthly free advisory call ($99 value)',
                  isFr ? 'Score AfriYield des fournisseurs visible' : 'Supplier AfriYield Score visible',
                  isFr ? 'Accès Track C — sourcing premium vérifié' : 'Track C access — verified premium sourcing',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#B5850A' }} />
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  to="/afri-yield/register"
                  className="px-8 py-3.5 rounded-xl font-bold text-[#1a3c2e]"
                  style={{ background: '#B5850A' }}
                >
                  {isFr ? `S'inscrire — $299/an` : `Subscribe — $299/year`}
                </Link>
                <span className="text-white/40 text-sm">
                  {isFr ? 'ou $29.99/mois · Premier appel conseil gratuit' : 'or $29.99/month · First advisory call free'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#111e17' }} className="py-16">
        <div className="section-container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-3">
              {isFr ? 'Prêt à transformer vos transferts en capital?' : 'Ready to transform your transfers into capital?'}
            </h2>
            <p className="text-white/50 mb-8">
              {isFr
                ? "Recevez une notification dès que la première opportunité est disponible dans votre région d'intérêt."
                : 'Get notified the moment the first opportunity is available in your region of interest.'}
            </p>
            {emailDone ? (
              <p className="text-green-400 font-semibold">
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
                className="flex gap-3 max-w-md mx-auto"
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
                  className="px-5 py-3 rounded-xl font-bold text-sm text-[#1a3c2e]"
                  style={{ background: '#B5850A' }}
                >
                  {isFr ? "M'inscrire" : 'Notify me'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {kycOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#1a3c2e] mb-1">
              {isFr ? 'Vérification identité requise' : 'Identity Verification Required'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {isFr
                ? 'Conformité OHADA — requis avant tout investissement Track B'
                : 'OHADA Compliance — required before any Track B investment'}
            </p>
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isFr ? 'Nom complet (tel que sur votre pièce d\'identité)' : 'Full legal name (as on ID)'}
                </label>
                <input
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  value={kycData.fullName}
                  onChange={(e) => setKycData((d) => ({ ...d, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isFr ? 'Pays de résidence' : 'Country of residence'}
                </label>
                <input
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  value={kycData.country}
                  onChange={(e) => setKycData((d) => ({ ...d, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isFr ? 'Numéro passeport ou pièce d\'identité nationale' : 'Passport or national ID number'}
                </label>
                <input
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  value={kycData.idNumber}
                  onChange={(e) => setKycData((d) => ({ ...d, idNumber: e.target.value }))}
                />
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={kycData.notUSPerson}
                  onChange={(e) => setKycData((d) => ({ ...d, notUSPerson: e.target.checked }))}
                  className="mt-0.5"
                />
                <span className="text-xs text-gray-600">
                  {isFr
                    ? 'Je confirme que je ne suis pas une "US Person" au sens de la réglementation SEC.'
                    : 'I confirm I am not a "US Person" as defined by SEC regulation.'}
                </span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setKycOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600"
                >
                  {isFr ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={kycLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#B5850A] text-white text-sm font-semibold disabled:opacity-60"
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

function OpportunityCard({ opp, isFr }) {
  const fundingPct =
    opp.amountSought > 0 ? Math.min(100, Math.round((opp.amountRaised / opp.amountSought) * 100)) : 0;
  const trackColor = { 'Track A': '#1a3c2e', 'Track B': '#B5850A', 'Track C': '#3b82f6', All: '#6b7280' }[opp.track] || '#1a3c2e';

  return (
    <Link
      to={`/afri-yield/opportunities/${opp._id}`}
      className="block rounded-2xl overflow-hidden transition hover:scale-[1.01]"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: trackColor }}>
                {opp.track}
              </span>
              {opp.verified && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#B5850A20', color: '#B5850A' }}>
                  ✓ Vérifié
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-lg leading-snug">{opp.centerName}</h3>
            <p className="text-sm text-white/40 mt-0.5">
              🌍 {opp.location}, {opp.country}
            </p>
          </div>
          {opp.afriyieldScore > 0 && (
            <div className="text-center">
              <p
                className="text-lg font-bold"
                style={{
                  color: opp.afriyieldScore >= 70 ? '#4ade80' : opp.afriyieldScore >= 50 ? '#B5850A' : '#f87171',
                }}
              >
                {opp.afriyieldScore}
              </p>
              <p className="text-xs text-white/30">Score</p>
            </div>
          )}
        </div>

        <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-4">{opp.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs text-white/30">{isFr ? 'Recherché' : 'Seeking'}</p>
            <p className="text-sm font-bold text-white">${(opp.amountSought || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs text-white/30">{isFr ? 'Min.' : 'Min.'}</p>
            <p className="text-sm font-bold text-white">${(opp.minInvestment || 1000).toLocaleString()}</p>
          </div>
          {opp.expectedROIMin > 0 ? (
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(181,133,10,0.1)' }}>
              <p className="text-xs" style={{ color: 'rgba(181,133,10,0.5)' }}>
                {isFr ? 'ROI est.' : 'Est. ROI'}
              </p>
              <p className="text-sm font-bold" style={{ color: '#B5850A' }}>
                {opp.expectedROIMin}–{opp.expectedROIMax}%
              </p>
            </div>
          ) : (
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-white/30">{isFr ? 'Jours' : 'Days'}</p>
              <p className="text-sm font-bold text-white">{opp.cycledays}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>
              ${(opp.amountRaised || 0).toLocaleString()} {isFr ? 'levés' : 'raised'}
            </span>
            <span>{fundingPct}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
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
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex gap-2 flex-wrap">
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
