import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wheat, BarChart3, Globe, Banknote, Factory, Star } from 'lucide-react';
import {
  HomeSection,
  GlassFeatureCard,
  GlassEmojiFeature,
  GlassPartnerCard,
  GlassRoleCard,
  GlassStat,
  GlassDarkCard,
  GlassCtaPanel,
} from '../components/home/HomeUI';

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
        ? 'Français, anglais, bambara, fulfulde et mooré — la plateforme parle la langue de vos utilisateurs.'
        : "French, English, Bambara, Fulfulde, and Mooré — the platform speaks your users' language.",
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
    <div>
      <Hero />

      <HomeSection variant="roles" eyebrow={isFr ? 'Écosystème' : 'Ecosystem'} title={isFr ? 'Qui êtes-vous ?' : 'Who are you?'} subtitle={isFr ? 'Choisissez votre profil pour commencer sur la plateforme panafricaine' : 'Choose your profile to get started on the pan-African platform'}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 md:gap-4">
          {roleCards.map((card) => (
            <GlassRoleCard key={card.title} {...card} />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        variant="features"
        eyebrow={isFr ? 'Impact' : 'Impact'}
        title={isFr ? 'Problèmes résolus' : 'Problems we solve'}
        subtitle={
          isFr
            ? "Sahel AgriConnect répond aux défis majeurs de l'agriculture à travers l'Afrique et la diaspora"
            : 'Sahel AgriConnect addresses major agricultural challenges across Africa and the diaspora'
        }
      >
        <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
          {problemCards.map((card) => (
            <GlassFeatureCard key={card.title} icon={card.Icon} title={card.title} description={card.text} />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        variant="platform"
        eyebrow={isFr ? 'Plateforme' : 'Platform'}
        title={isFr ? 'Ce qui rend la plateforme unique' : 'What makes the platform unique'}
        subtitle={
          isFr
            ? "Une infrastructure agricole complète, souveraine et sécurisée — conçue pour l'Afrique."
            : 'Complete, sovereign, and secure agricultural infrastructure — designed for Africa.'
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {platformFeatures.map((f) => (
            <GlassEmojiFeature key={f.title} icon={f.icon} title={f.title} description={f.desc} />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        variant="meshWarm"
        eyebrow={isFr ? 'Réseau' : 'Network'}
        title={isFr ? 'Partenaires & Institutions' : 'Partners & Institutions'}
        subtitle={
          isFr
            ? "Développé et soutenu par des institutions engagées dans la transformation agricole souveraine de l'Afrique."
            : 'Built and supported by institutions committed to sovereign agricultural transformation in Africa.'
        }
      >
        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          <GlassPartnerCard
            monogram="DC"
            title="Djigui Corporation"
            description={
              isFr
                ? "Structure porteuse du projet. Facilitation des investissements diaspora, conformité OHADA, et représentation USA."
                : 'Project vehicle. Diaspora investment facilitation, OHADA compliance, and US representation.'
            }
            badge={isFr ? 'Fondateur' : 'Founding Partner'}
          />
          <GlassPartnerCard
            monogram="🎓"
            title={isFr ? 'Partenaire Universitaire USA' : 'US University Partner'}
            description={
              isFr
                ? "Recherche agronomique, certification qualité, et transfert de technologie vers les coopératives africaines."
                : 'Agronomic research, quality certification, and technology transfer to African cooperatives.'
            }
            badge={isFr ? 'Partenaire Recherche' : 'Research Partner'}
          />
          <GlassPartnerCard
            monogram="🌍"
            title={isFr ? 'Réseau Diaspora USA' : 'Diaspora Network USA'}
            description={
              isFr
                ? "Restaurants, détaillants et investisseurs de la diaspora connectés aux producteurs africains."
                : 'Diaspora restaurants, retailers, and investors connected to African producers.'
            }
            badge={isFr ? 'Réseau Commercial' : 'Trade Network'}
            accent="amber"
          />
        </div>
      </HomeSection>

      <HomeSection
        variant="forest"
        eyebrow={isFr ? 'Notre Mission' : 'Our Mission'}
        title={
          isFr ? (
            <>
              Construire la <span className="text-gradient-gold">souveraineté alimentaire</span> de l&apos;Afrique
            </>
          ) : (
            <>
              Building Africa&apos;s <span className="text-gradient-gold">food sovereignty</span>
            </>
          )
        }
        subtitle={
          isFr
            ? "Sahel AgriConnect connecte agriculteurs, coopératives et investisseurs dans un écosystème numérique souverain — conçu en Afrique, pour l'Afrique."
            : 'Sahel AgriConnect connects farmers, cooperatives, and investors in a sovereign digital ecosystem — designed in Africa, for Africa.'
        }
      >
        <MissionStats farmerStats={farmerStats} coopStats={coopStats} processorStats={processorStats} isFr={isFr} />
        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:gap-5">
          {[
            {
              icon: '✅',
              title: isFr ? 'Souveraineté alimentaire' : 'Food sovereignty',
              desc: isFr
                ? "Autonomie alimentaire grâce à une agriculture numérique, résiliente et durable."
                : 'Food autonomy through digital, resilient, and sustainable agriculture.',
            },
            {
              icon: '📈',
              title: isFr ? 'Valorisation économique' : 'Economic value',
              desc: isFr
                ? 'Marchés locaux, régionaux et internationaux — financement diaspora sans prêt.'
                : 'Local, regional, and global markets — non-loan diaspora financing.',
            },
            {
              icon: '🌱',
              title: isFr ? 'Richesse générationnelle' : 'Generational wealth',
              desc: isFr
                ? 'Chaînes de valeur durables qui préservent les savoirs et construisent un patrimoine.'
                : 'Sustainable value chains that preserve knowledge and build generational assets.',
            },
          ].map((p) => (
            <GlassDarkCard key={p.title} icon={p.icon} title={p.title} description={p.desc} />
          ))}
        </div>
      </HomeSection>

      <HomeSection id="rejoindre" variant="cta" className="!py-10 md:!py-14">
        <div className="mb-6 text-center max-w-3xl mx-auto">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#4ade80' }}>
            {isFr ? 'Rejoindre' : 'Join us'}
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            {isFr ? (
              <>
                Prêt à <span className="text-gradient">transformer</span> l&apos;agriculture ?
              </>
            ) : (
              <>
                Ready to <span className="text-gradient">transform</span> agriculture?
              </>
            )}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
          <GlassCtaPanel
            variant="forest"
            eyebrow={isFr ? 'Agriculteurs & Coopératives' : 'Farmers & Cooperatives'}
            title={isFr ? 'Rejoignez la plateforme' : 'Join the platform'}
            description={
              isFr
                ? 'Enregistrez votre exploitation, accédez aux financements, aux outils IA et aux marchés.'
                : 'Register your farm, access financing, AI tools, and markets.'
            }
          >
            <Link
              to="/dashboard"
              className="w-full rounded-xl py-3.5 text-center text-sm font-bold transition hover:opacity-90"
              style={{ background: '#B5850A', color: '#060f0a' }}
            >
              {isFr ? "S'inscrire comme agriculteur" : 'Register as a Farmer'}
            </Link>
            <Link
              to="/cooperative-registration"
              className="w-full rounded-xl py-3.5 text-center text-sm font-semibold text-white/90 transition hover:bg-white/10"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {isFr ? 'Inscrire ma coopérative' : 'Register my Cooperative'}
            </Link>
          </GlassCtaPanel>

          <GlassCtaPanel
            variant="amber"
            eyebrow={isFr ? 'Investisseurs Diaspora' : 'Diaspora Investors'}
            title={isFr ? "Investissez dans l'agriculture africaine" : 'Invest in African agriculture'}
            description={
              isFr
                ? 'Transformez vos transferts en capital agricole productif. Escrow sécurisé. Conformité OHADA.'
                : 'Turn remittances into productive agricultural capital. Secured escrow. OHADA compliance.'
            }
          >
            <Link
              to="/afri-yield"
              className="w-full rounded-xl py-3.5 text-center text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#4CAF50', color: '#060f0a' }}
            >
              {isFr ? 'Découvrir AfriYield Exchange' : 'Explore AfriYield Exchange'}
            </Link>
            <Link
              to="/afri-yield/register"
              className="w-full rounded-xl py-3.5 text-center text-sm font-semibold transition hover:bg-white/10"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {isFr ? "S'inscrire comme investisseur" : 'Register as an Investor'}
            </Link>
          </GlassCtaPanel>
        </div>
      </HomeSection>
    </div>
  );
};

function MissionStats({ farmerStats, coopStats, processorStats, isFr }) {
  const stats = [
    {
      icon: '👩‍🌾',
      value: farmerStats?.total ?? '—',
      label: isFr ? 'Agriculteurs enregistrés' : 'Registered farmers',
    },
    {
      icon: '🤝',
      value: coopStats?.active ?? coopStats?.total ?? '—',
      label: isFr ? 'Coopératives actives' : 'Active cooperatives',
    },
    {
      icon: '🏭',
      value: processorStats?.total ?? '—',
      label: isFr ? 'Centres de transformation' : 'Processing centers',
    },
    {
      icon: '🌍',
      value: '54+',
      label: isFr ? 'Pays couverts' : 'Countries covered',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {stats.map((stat) => (
        <GlassStat key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
      ))}
    </div>
  );
}

export default Home;
