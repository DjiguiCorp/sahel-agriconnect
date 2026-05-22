import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wheat, BarChart3, Globe, Banknote, Factory, Star } from 'lucide-react';
const Home = () => {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || i18n.language || '').startsWith('fr');
  const [farmerStats, setFarmerStats] = useState(null);
  const [coopStats, setCoopStats] = useState(null);
  const [processorStats, setProcessorStats] = useState(null);

  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE_URL;
    if (!API) return;
    Promise.allSettled([
      fetch(`${API}/api/farmers/public-stats`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`${API}/api/cooperatives/public-stats`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`${API}/api/processors/public-stats`).then((r) => (r.ok ? r.json() : Promise.reject())),
    ]).then(([farmers, coops, processors]) => {
      if (farmers.status === 'fulfilled') setFarmerStats(farmers.value);
      if (coops.status === 'fulfilled') setCoopStats(coops.value);
      if (processors.status === 'fulfilled') setProcessorStats(processors.value);
    });
  }, []);

  const problemCards = [
    {
      Icon: Wheat,
      title: isFr ? 'Accès aux intrants' : 'Access to inputs',
      text: isFr
        ? "Facilite l'accès aux semences, fertilisants et équipements via les coopératives"
        : 'Easier access to seeds, fertilizers, and equipment through cooperatives',
    },
    {
      Icon: BarChart3,
      title: isFr ? 'Traçabilité' : 'Traceability',
      text: isFr
        ? 'Suivi complet de la production à la consommation pour certification qualité'
        : 'Full tracking from production to consumption for quality certification',
    },
    {
      Icon: Globe,
      title: isFr ? 'Accès aux marchés' : 'Market access',
      text: isFr
        ? 'Connexion directe aux marchés locaux, régionaux et internationaux'
        : 'Direct connection to local, regional, and international markets',
    },
    {
      Icon: Banknote,
      title: isFr ? 'Financement' : 'Financing',
      text: isFr
        ? 'Financement sans prêt via diaspora et ressources locales'
        : 'Non-loan financing via diaspora and local resources',
    },
    {
      Icon: Factory,
      title: isFr ? 'Transformation' : 'Processing',
      text: isFr
        ? 'Connexion aux centres de transformation pour valorisation des produits'
        : 'Connection to processing centers to add value to crops',
    },
    {
      Icon: Star,
      title: isFr ? 'Certification' : 'Certification',
      text: isFr
        ? 'Support pour certification locale, régionale et internationale (FDA/USDA)'
        : 'Support for local, regional, and international certification (FDA/USDA)',
    },
  ];

  const roleCards = [
    {
      emoji: '👩‍🌾',
      title: isFr ? 'Agriculteur' : 'Farmer',
      desc: isFr
        ? 'Enregistrez votre exploitation, accédez aux outils et formations'
        : 'Register your farm, access tools and training',
      to: '/dashboard',
    },
    {
      emoji: '🤝',
      title: isFr ? 'Coopérative' : 'Cooperative',
      desc: isFr ? 'Gérez vos membres, demandez des financements' : 'Manage members, request financing',
      to: '/cooperative-registration',
    },
    {
      emoji: '🏭',
      title: isFr ? 'Transformateur' : 'Processor',
      desc: isFr
        ? 'Certifiez votre centre, connectez-vous aux acheteurs diaspora'
        : 'Certify your center, connect to diaspora buyers',
      to: '/dashboard',
    },
    {
      emoji: '💰',
      title: isFr ? 'Investisseur Diaspora' : 'Diaspora Investor',
      desc: isFr ? "Investissez dans l'agriculture africaine via AfriYield" : 'Invest in African agriculture via AfriYield',
      to: '/afri-yield',
    },
    {
      emoji: '🏛️',
      title: isFr ? 'Gouvernement' : 'Government',
      desc: isFr
        ? 'Suivi des politiques agricoles et données nationales'
        : 'Monitor agricultural policies and national data',
      to: '/platform-licensing?type=government',
    },
  ];

  const platformFeatures = [
    {
      icon: '📍',
      title: isFr ? 'Géolocalisation GPS satellite' : 'GPS satellite geolocation',
      desc: isFr
        ? 'Chaque exploitation est géolocalisée avec détection automatique des terres par satellite.'
        : 'Every farm is geolocated with automatic satellite land detection.',
    },
    {
      icon: '🔒',
      title: isFr ? 'Escrow sécurisé OHADA' : 'OHADA secured escrow',
      desc: isFr
        ? "Les fonds sont protégés par un agent d'escrow agréé. Libération en 3 jalons vérifiés."
        : 'Funds protected by a licensed escrow agent. Released in 3 verified milestones.',
    },
    {
      icon: '📱',
      title: isFr ? 'Alertes WhatsApp & SMS' : 'WhatsApp & SMS alerts',
      desc: isFr
        ? "Notifications en temps réel via WhatsApp et SMS — le canal principal sur le continent."
        : 'Real-time notifications via WhatsApp and SMS — the primary channel across the continent.',
    },
    {
      icon: '🌐',
      title: isFr ? 'Multilingue' : 'Multilingual',
      desc: isFr
        ? 'Français et anglais — la plateforme s\'adapte à vos utilisateurs à travers le Sahel.'
        : 'French and English — the platform adapts to your users across the Sahel.',
    },
    {
      icon: '📊',
      title: isFr ? 'Traçabilité complète' : 'Full traceability',
      desc: isFr
        ? 'Suivi de la production à la consommation pour certification locale, régionale et FDA/USDA.'
        : 'Track from production to consumption for local, regional, and FDA/USDA certification.',
    },
    {
      icon: '🤖',
      title: isFr ? 'Outils IA agricoles' : 'Agricultural AI tools',
      desc: isFr
        ? 'Diagnostic sol, détection de maladies par photo, et optimisation de production par IA.'
        : 'Soil diagnostics, plant disease detection by photo, and AI production optimization.',
    },
  ];

  return (
    <div style={{ background: '#0b1f12' }}>
      <Hero />

      {/* ── SECTION 1: Who are you — Teal shift ──────────────── */}
      <section
        style={{
          background: `
        radial-gradient(ellipse 120% 60% at 50% 0%,
          rgba(14,60,50,0.9) 0%,
          rgba(8,32,28,0.95) 50%,
          transparent 80%),
        linear-gradient(180deg, #091a14 0%, #0d2218 100%)
      `,
          padding: '5rem 0',
        }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{
                background: 'rgba(29,158,117,0.15)',
                color: '#1D9E75',
                border: '1px solid rgba(29,158,117,0.3)',
              }}
            >
              🌍 {isFr ? 'ÉCOSYSTÈME' : 'ECOSYSTEM'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {isFr ? 'Qui êtes-vous ?' : 'Who are you?'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-sm max-w-md mx-auto">
              {isFr
                ? 'Choisissez votre profil pour commencer sur la plateforme panafricaine'
                : 'Choose your profile to get started on the pan-African platform'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {roleCards.map((card, i) => (
              <Link
                key={card.title}
                to={card.to}
                className="flex flex-col items-center text-center p-5 rounded-2xl transition-all duration-200 group hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(16px)',
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <span className="text-3xl mb-3">{card.emoji}</span>
                <span className="font-bold text-white text-sm mb-1">{card.title}</span>
                <span className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {card.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Problems solved — Deep slate-blue ─────── */}
      <section
        style={{
          background: `
        radial-gradient(ellipse 100% 70% at 0% 50%,
          rgba(12,35,70,0.85) 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 100% 30%,
          rgba(29,158,117,0.1) 0%, transparent 50%),
        linear-gradient(180deg, #0d2218 0%, #0a1830 100%)
      `,
          padding: '5rem 0',
        }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{
                background: 'rgba(59,130,246,0.12)',
                color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.25)',
              }}
            >
              ⚡ {isFr ? 'SOLUTIONS' : 'SOLUTIONS'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {isFr ? 'Problèmes résolus' : 'Problems we solve'}
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem' }}>
              {isFr
                ? "Sahel AgriConnect répond aux défis majeurs de l'agriculture en Afrique"
                : 'Sahel AgriConnect addresses major agricultural challenges across Africa'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {problemCards.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] group"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(96,165,250,0.14)' }}
                >
                  <Icon strokeWidth={1.75} size={22} style={{ color: '#60a5fa' }} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Platform features — Forest emerald ────── */}
      <section
        style={{
          background: `
        radial-gradient(ellipse 90% 70% at 100% 0%,
          rgba(20,70,40,0.7) 0%, transparent 55%),
        radial-gradient(ellipse 70% 50% at 0% 80%,
          rgba(181,133,10,0.1) 0%, transparent 50%),
        linear-gradient(160deg, #0a1830 0%, #0f2218 100%)
      `,
          padding: '5rem 0',
        }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{
                background: 'rgba(76,175,80,0.12)',
                color: '#4ade80',
                border: '1px solid rgba(76,175,80,0.25)',
              }}
            >
              🛠️ {isFr ? 'INFRASTRUCTURE' : 'INFRASTRUCTURE'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {isFr ? 'Ce qui rend la plateforme unique' : 'What makes the platform unique'}
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {isFr
                ? "Infrastructure agricole complète, souveraine et sécurisée — construite pour l'Afrique"
                : 'Complete, sovereign, secure agricultural infrastructure — built for Africa'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5 flex gap-4 items-start transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(76,175,80,0.15)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Partners — Warm amber-gold ────────────── */}
      <section
        style={{
          background: `
        radial-gradient(ellipse 100% 60% at 50% 0%,
          rgba(80,52,0,0.6) 0%, transparent 55%),
        radial-gradient(ellipse 60% 40% at 0% 60%,
          rgba(29,158,117,0.1) 0%, transparent 50%),
        linear-gradient(180deg, #0f2218 0%, #120e04 50%, #0f1a10 100%)
      `,
          padding: '5rem 0',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{
              background: 'rgba(181,133,10,0.14)',
              color: '#B5850A',
              border: '1px solid rgba(181,133,10,0.3)',
            }}
          >
            🤝 {isFr ? 'PARTENAIRES' : 'PARTNERS'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isFr ? 'Partenaires & Institutions' : 'Partners & Institutions'}
          </h2>
          <p className="mb-10 max-w-xl mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isFr
              ? "Développé et soutenu par des institutions engagées dans la transformation agricole de l'Afrique."
              : 'Built and supported by institutions committed to agricultural transformation in Africa.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                initials: 'DC',
                name: 'Djigui Corporation',
                desc: isFr
                  ? 'Structure porteuse. Investissements diaspora, conformité OHADA, représentation USA.'
                  : 'Project vehicle. Diaspora investment facilitation, OHADA compliance, US representation.',
                color: '#B5850A',
              },
              {
                initials: 'SA',
                name: 'Sahel AgriConnect',
                desc: isFr
                  ? "Plateforme opérationnelle. Infrastructure agricole pour l'Afrique de l'Ouest."
                  : 'Operational platform. Agricultural infrastructure for West Africa.',
                color: '#4CAF50',
              },
              {
                initials: 'AY',
                name: 'AfriYield Exchange',
                desc: isFr
                  ? "Plateforme de facilitation d'investissements agricoles diaspora."
                  : 'Agricultural investment facilitation platform for the diaspora.',
                color: '#f59e0b',
              },
            ].map(({ initials, name, desc, color }) => (
              <div
                key={name}
                className="rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${color}28`,
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 font-bold text-xl"
                  style={{ background: `${color}20`, color }}
                >
                  {initials}
                </div>
                <h3 className="font-bold text-white mb-2">{name}</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: AfriYield CTA — Deep navy ─────────────── */}
      <section
        style={{
          background: `
        radial-gradient(ellipse 120% 80% at 50% 50%,
          rgba(15,40,90,0.9) 0%,
          rgba(8,18,45,0.95) 50%,
          rgba(10,22,18,1) 80%),
        radial-gradient(ellipse 80% 50% at 90% 20%,
          rgba(181,133,10,0.18) 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 10% 80%,
          rgba(29,158,117,0.12) 0%, transparent 50%)
      `,
          padding: '6rem 0',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{
              background: 'rgba(181,133,10,0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(181,133,10,0.3)',
            }}
          >
            💰 AfriYield Exchange
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isFr ? "Investissez dans l'agriculture africaine" : 'Invest in African Agriculture'}
          </h2>
          <p className="text-base mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {isFr
              ? 'Rendements projetés basés sur les performances historiques des coopératives partenaires. Investissements comportent des risques.'
              : 'Projected returns based on historical cooperative performance. Investments carry risk.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              to="/afri-yield"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
              style={{
                background: '#B5850A',
                color: 'black',
                boxShadow: '0 0 32px rgba(181,133,10,0.25)',
              }}
            >
              {isFr ? 'Explorer les opportunités →' : 'Explore opportunities →'}
            </Link>
            <Link
              to="/afri-yield/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:scale-105"
              style={{
                background: 'rgba(181,133,10,0.1)',
                border: '1px solid rgba(181,133,10,0.3)',
                color: '#f59e0b',
              }}
            >
              {isFr ? "S'inscrire comme investisseur" : 'Register as investor'}
            </Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            ⚠️{' '}
            {isFr
              ? "AfriYield Exchange n'est pas une institution financière agréée. Les rendements ne sont pas garantis."
              : 'AfriYield Exchange is not a licensed financial institution. Returns are not guaranteed.'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
