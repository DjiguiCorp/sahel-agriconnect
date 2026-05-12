import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import IconCircle from '../components/IconCircle';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wheat, BarChart3, Globe, Banknote, Factory, Star } from 'lucide-react';

const Home = () => {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
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
      desc: isFr ? 'Enregistrez votre exploitation, accédez aux outils et formations' : 'Register your farm, access tools and training',
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
      desc: isFr ? 'Certifiez votre centre, connectez-vous aux acheteurs diaspora' : 'Certify your center, connect to diaspora buyers',
      to: '/dashboard',
    },
    {
      emoji: '💰',
      title: isFr ? 'Investisseur Diaspora' : 'Diaspora Investor',
      desc: isFr ? 'Investissez dans l\'agriculture africaine via AfriYield' : 'Invest in African agriculture via AfriYield',
      to: '/afri-yield',
    },
    {
      emoji: '🏛️',
      title: isFr ? 'Gouvernement' : 'Government',
      desc: isFr ? 'Suivi des politiques agricoles et données nationales' : 'Monitor agricultural policies and national data',
      to: '/government-portal',
    },
  ];

  return (
    <div>
      <Hero />

      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#1a3c2e] text-center mb-2">
            {isFr ? 'Qui êtes-vous ?' : 'Who are you?'}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            {isFr ? 'Choisissez votre profil pour commencer' : 'Choose your profile to get started'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {roleCards.map((card) => (
              <Link
                key={card.title}
                to={card.to}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border-2 border-transparent hover:border-[#1a3c2e] shadow-sm hover:shadow-md transition group"
              >
                <span className="text-3xl mb-3">{card.emoji}</span>
                <span className="font-bold text-[#1a3c2e] text-sm mb-1">{card.title}</span>
                <span className="text-xs text-gray-500 leading-tight">{card.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-forest mb-4">
            {isFr ? 'Problèmes résolus' : 'Problems we solve'}
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            {isFr
              ? "Sahel AgriConnect répond aux défis majeurs de l'agriculture en Afrique de l'Ouest et au-delà"
              : 'Sahel AgriConnect addresses the major challenges of agriculture across Africa'}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problemCards.map(({ Icon, title, text }) => (
            <div key={title} className="card">
              <div className="mb-4">
                <IconCircle>
                  <Icon strokeWidth={1.75} />
                </IconCircle>
              </div>
              <h3 className="text-xl font-semibold text-brand-forest mb-2">{title}</h3>
              <p className="text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités clés — platform-wide capabilities, not role links */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1a3c2e] text-center mb-3">
            {isFr ? 'Ce qui rend la plateforme unique' : 'What makes the platform unique'}
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10 max-w-xl mx-auto">
            {isFr
              ? "Une infrastructure agricole complète, souveraine et sécurisée — construite pour l'Afrique de l'Ouest."
              : 'A complete, sovereign, and secure agricultural infrastructure — built for West Africa.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '📍',
                title: isFr ? 'Géolocalisation GPS satellite' : 'GPS Satellite Geolocation',
                desc: isFr
                  ? 'Chaque exploitation est géolocalisée avec détection automatique des terres par satellite.'
                  : 'Every farm is geolocated with automatic satellite land detection.',
              },
              {
                icon: '🔒',
                title: isFr ? 'Escrow sécurisé OHADA' : 'OHADA Secured Escrow',
                desc: isFr
                  ? 'Les fonds sont protégés par un agent d\'escrow agréé. Libération en 3 jalons vérifiés.'
                  : 'Funds protected by a licensed escrow agent. Released in 3 verified milestones.',
              },
              {
                icon: '📱',
                title: isFr ? 'Alertes WhatsApp & SMS' : 'WhatsApp & SMS Alerts',
                desc: isFr
                  ? 'Notifications en temps réel via WhatsApp et SMS — le canal principal en Afrique de l\'Ouest.'
                  : 'Real-time notifications via WhatsApp and SMS — the primary channel in West Africa.',
              },
              {
                icon: '🌐',
                title: isFr ? 'Multilingue' : 'Multilingual',
                desc: isFr
                  ? 'Français, anglais, bambara, fulfulde et mooré — la plateforme parle la langue de vos utilisateurs.'
                  : 'French, English, Bambara, Fulfulde, and Mooré — the platform speaks your users\' language.',
              },
              {
                icon: '📊',
                title: isFr ? 'Traçabilité complète' : 'Full Traceability',
                desc: isFr
                  ? 'Suivi de la production à la consommation pour certification qualité locale, régionale et FDA/USDA.'
                  : 'Track from production to consumption for local, regional, and FDA/USDA quality certification.',
              },
              {
                icon: '🤖',
                title: isFr ? 'Outils IA agricoles' : 'Agricultural AI Tools',
                desc: isFr
                  ? 'Diagnostic sol, détection de maladies des plantes par photo, et optimisation de production par IA.'
                  : 'Soil diagnostics, plant disease detection by photo, and AI-powered production optimization.',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex gap-4 items-start">
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-[#1a3c2e] text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partenaires potentiels */}
      <section className="py-14 bg-[#f5f0e8]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#1a3c2e] mb-3">
            {isFr ? 'Partenaires & Institutions' : 'Partners & Institutions'}
          </h2>
          <p className="text-gray-600 mb-10 max-w-xl mx-auto text-sm">
            {isFr
              ? "Sahel AgriConnect est développé et soutenu par des institutions engagées dans la transformation agricole souveraine de l'Afrique."
              : 'Sahel AgriConnect is built and supported by institutions committed to sovereign agricultural transformation in Africa.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Djigui Corporation */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-xl bg-[#1a3c2e] flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">DC</span>
              </div>
              <h3 className="font-bold text-[#1a3c2e] mb-2">Djigui Corporation</h3>
              <p className="text-gray-500 text-sm">
                {isFr
                  ? "Structure porteuse du projet. Facilitation des investissements diaspora, conformité OHADA, et représentation USA."
                  : 'Project vehicle. Diaspora investment facilitation, OHADA compliance, and US representation.'}
              </p>
              <span className="mt-4 text-xs font-semibold text-[#B5850A] bg-[#fff7df] px-3 py-1 rounded-full">
                {isFr ? 'Fondateur' : 'Founding Partner'}
              </span>
            </div>

            {/* US University */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-xl bg-[#1a3c2e] flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🎓</span>
              </div>
              <h3 className="font-bold text-[#1a3c2e] mb-2">
                {isFr ? 'Partenaire Universitaire USA' : 'US University Partner'}
              </h3>
              <p className="text-gray-500 text-sm">
                {isFr
                  ? "Recherche agronomique, certification qualité, et transfert de technologie vers les coopératives d'Afrique de l'Ouest."
                  : 'Agronomic research, quality certification, and technology transfer to West African cooperatives.'}
              </p>
              <span className="mt-4 text-xs font-semibold text-[#1a3c2e] bg-green-50 px-3 py-1 rounded-full">
                {isFr ? 'Partenaire Recherche' : 'Research Partner'}
              </span>
            </div>

            {/* Diaspora Network */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-xl bg-[#B5850A] flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🌍</span>
              </div>
              <h3 className="font-bold text-[#1a3c2e] mb-2">
                {isFr ? 'Réseau Diaspora USA' : 'Diaspora Network USA'}
              </h3>
              <p className="text-gray-500 text-sm">
                {isFr
                  ? "Restaurants, détaillants et investisseurs de la diaspora ouest-africaine aux États-Unis connectés aux producteurs locaux."
                  : 'West African diaspora restaurants, retailers, and investors in the US connected to local producers.'}
              </p>
              <span className="mt-4 text-xs font-semibold text-[#B5850A] bg-[#fff7df] px-3 py-1 rounded-full">
                {isFr ? 'Réseau Commercial' : 'Trade Network'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Stats Section */}
      <section className="bg-[#1a3c2e] py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-[#B5850A] uppercase mb-4">
            {isFr ? 'Notre Mission' : 'Our Mission'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isFr
              ? "Construire la souveraineté alimentaire de l'Afrique de l'Ouest"
              : "Building West Africa's food sovereignty"}
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm leading-relaxed mb-12">
            {isFr
              ? "Sahel AgriConnect connecte les agriculteurs, coopératives et investisseurs dans un écosystème numérique souverain — conçu en Afrique, pour l'Afrique."
              : 'Sahel AgriConnect connects farmers, cooperatives, and investors in a sovereign digital ecosystem — designed in Africa, for Africa.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
            {[
              {
                value: farmerStats?.total ?? '—',
                label: isFr ? 'Agriculteurs enregistrés' : 'Registered Farmers',
                icon: '👩‍🌾',
              },
              {
                value: coopStats?.active ?? coopStats?.total ?? '—',
                label: isFr ? 'Coopératives actives' : 'Active Cooperatives',
                icon: '🤝',
              },
              {
                value: processorStats?.total ?? '—',
                label: isFr ? 'Centres de transformation' : 'Processing Centers',
                icon: '🏭',
              },
              {
                value: '17',
                label: isFr ? 'Pays zone OHADA' : 'OHADA Zone Countries',
                icon: '🌍',
              },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-2xl mb-1">{stat.icon}</span>
                <span className="text-3xl font-bold text-[#B5850A]">{stat.value}</span>
                <span className="text-xs text-gray-400 mt-1 text-center">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '✅',
                title: isFr ? 'Souveraineté alimentaire' : 'Food Sovereignty',
                desc: isFr
                  ? "Autonomie alimentaire pour l'Afrique de l'Ouest grâce à une agriculture numérique, résiliente et durable."
                  : 'Food autonomy for West Africa through digital, resilient, and sustainable agriculture.',
              },
              {
                icon: '📈',
                title: isFr ? 'Valorisation économique' : 'Economic Value',
                desc: isFr
                  ? 'Connexion directe aux marchés locaux, régionaux et USA — financement sans prêt via la diaspora.'
                  : 'Direct connection to local, regional, and US markets — non-loan financing via the diaspora.',
              },
              {
                icon: '🌱',
                title: isFr ? 'Richesse générationnelle' : 'Generational Wealth',
                desc: isFr
                  ? "Chaînes de valeur durables qui préservent les savoirs locaux et construisent un patrimoine pour les générations futures."
                  : 'Sustainable value chains that preserve local knowledge and build assets for future generations.',
              },
            ].map((p) => (
              <div
                key={p.title}
                className="bg-white/5 rounded-2xl p-6 text-left border border-white/10 hover:border-[#B5850A]/50 transition"
              >
                <span className="text-2xl mb-3 block">{p.icon}</span>
                <h3 className="text-white font-bold mb-2">{p.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="rejoindre" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl overflow-hidden grid md:grid-cols-2">
            <div className="bg-[#1a3c2e] p-10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#B5850A] uppercase">
                  {isFr ? 'Agriculteurs & Coopératives' : 'Farmers & Cooperatives'}
                </span>
                <h3 className="text-2xl font-bold text-white mt-3 mb-3">
                  {isFr ? 'Rejoignez la plateforme' : 'Join the platform'}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {isFr
                    ? 'Enregistrez votre exploitation, accédez aux financements, aux outils IA et aux marchés régionaux.'
                    : 'Register your farm, access financing, AI tools, and regional markets.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 mt-8">
                <Link
                  to="/dashboard"
                  className="w-full text-center py-3 px-5 rounded-xl bg-[#B5850A] text-white font-bold text-sm hover:bg-[#9a7009] transition"
                >
                  {isFr ? "S'inscrire comme agriculteur" : 'Register as a Farmer'}
                </Link>
                <Link
                  to="/cooperative-registration"
                  className="w-full text-center py-3 px-5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition"
                >
                  {isFr ? 'Inscrire ma coopérative' : 'Register my Cooperative'}
                </Link>
              </div>
            </div>

            <div className="bg-[#B5850A] p-10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#1a3c2e] uppercase">
                  {isFr ? 'Investisseurs Diaspora' : 'Diaspora Investors'}
                </span>
                <h3 className="text-2xl font-bold text-[#1a3c2e] mt-3 mb-3">
                  {isFr ? "Investissez dans l'agriculture africaine" : 'Invest in African agriculture'}
                </h3>
                <p className="text-[#1a3c2e]/80 text-sm leading-relaxed">
                  {isFr
                    ? 'Transformez vos transferts diaspora en capital agricole productif. Escrow sécurisé. Conformité OHADA. ROI 12–30%.'
                    : 'Turn your diaspora transfers into productive agricultural capital. Secured escrow. OHADA compliance. 12–30% ROI.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 mt-8">
                <Link
                  to="/afri-yield"
                  className="w-full text-center py-3 px-5 rounded-xl bg-[#1a3c2e] text-white font-bold text-sm hover:bg-[#143326] transition"
                >
                  {isFr ? 'Découvrir AfriYield Exchange' : 'Explore AfriYield Exchange'}
                </Link>
                <Link
                  to="/afri-yield/register"
                  className="w-full text-center py-3 px-5 rounded-xl border border-[#1a3c2e]/30 text-[#1a3c2e] font-semibold text-sm hover:bg-[#1a3c2e]/10 transition"
                >
                  {isFr ? "S'inscrire comme investisseur" : 'Register as an Investor'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
