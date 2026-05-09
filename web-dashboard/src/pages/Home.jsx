import Hero from '../components/Hero';
import IconCircle from '../components/IconCircle';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wheat,
  BarChart3,
  Globe,
  Banknote,
  Factory,
  Star,
  Handshake,
  Landmark,
  Users,
  Microscope,
  Camera,
  Smartphone,
  Calendar,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

const Home = () => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

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

  const keyFeatures = [
    {
      Icon: Users,
      title: isFr ? 'Enregistrement agriculteurs' : 'Farmer registration',
      text: isFr
        ? 'Formulaire complet avec géolocalisation GPS, détection satellite des terres, et analyse de maladies des plantes.'
        : 'Full form with GPS geolocation, satellite land detection, and plant disease analysis.',
      to: '/dashboard',
      link: isFr ? 'Accéder au Dashboard →' : 'Go to Dashboard →',
    },
    {
      Icon: Handshake,
      title: isFr ? 'Gestion coopératives' : 'Cooperative management',
      text: isFr
        ? 'Liste complète des coopératives, demandes de financement, et gestion des équipements partagés.'
        : 'Full cooperative listings, funding requests, and shared equipment management.',
      to: '/cooperatives',
      link: isFr ? 'Voir les coopératives →' : 'View cooperatives →',
    },
    {
      Icon: Globe,
      title: isFr ? 'Partenariat diaspora' : 'Diaspora partnership',
      text: isFr
        ? 'Connexion entreprises diaspora (USA) avec centres de transformation locaux. Matching automatique par produits.'
        : 'Connect USA diaspora businesses with local processing centers. Product-based matching.',
      to: '/diaspora',
      link: isFr ? 'Rejoindre la diaspora →' : 'Join the diaspora →',
    },
    {
      Icon: Factory,
      title: isFr ? 'Centres de transformation' : 'Processing centers',
      text: isFr
        ? 'Liste des centres avec certification (local/régional/FDA-USDA), demande de certification, représentation aux USA.'
        : 'Centers with certification (local/regional/FDA-USDA), certification requests, US representation.',
      to: '/centres-transformation',
      link: isFr ? 'Voir les centres →' : 'View centers →',
    },
    {
      Icon: BarChart3,
      title: isFr ? 'Dashboard administratif' : 'Admin dashboard',
      text: isFr
        ? 'Vue temps réel des agriculteurs, gestion des coopératives, suivi des demandes et statistiques complètes.'
        : 'Real-time farmer view, cooperative management, request tracking, and full statistics.',
      to: '/admin/login',
      link: isFr ? 'Accéder au dashboard →' : 'Open admin dashboard →',
    },
    {
      Icon: Microscope,
      title: isFr ? 'Outils agricoles' : 'Agricultural tools',
      text: isFr
        ? 'Diagnostic du sol, détection de maladies, Think Tank Solutions avec recommandations personnalisées.'
        : 'Soil diagnostics, disease detection, Think Tank Solutions with tailored recommendations.',
      to: '/diagnostic-sol',
      link: isFr ? 'Utiliser les outils →' : 'Use the tools →',
    },
  ];

  return (
    <div>
      <Hero />

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

      <section className="bg-gray-100/80 py-16">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-forest mb-4">
              {isFr ? 'Fonctionnalités clés' : 'Key features'}
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {isFr
                ? 'Une plateforme complète pour transformer l\'agriculture en Afrique de l\'Ouest et au-delà'
                : 'A full platform to transform agriculture across West Africa and beyond'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {keyFeatures.map(({ Icon, title, text, to, link }) => (
              <div key={title} className="card">
                <div className="flex items-start gap-4">
                  <IconCircle className="mt-0.5">
                    <Icon strokeWidth={1.75} />
                  </IconCircle>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-forest mb-2">{title}</h3>
                    <p className="text-gray-600 mb-4">{text}</p>
                    <Link to={to} className="text-brand-sage hover:text-brand-forest font-medium underline-offset-2 hover:underline">
                      {link}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-forest mb-4">Partenaires potentiels</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Rejoignez un écosystème en croissance pour transformer l&apos;agriculture en Afrique de l&apos;Ouest et
            au-delà
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              Icon: Handshake,
              title: 'Alliance des États du Sahel (AES)',
              text: 'Coordination transfrontalière pour la transformation agricole régionale',
            },
            {
              Icon: Globe,
              title: 'Diaspora',
              text: "Restaurants et détaillants USA connectés aux producteurs d'Afrique de l'Ouest et au-delà",
            },
            {
              Icon: Landmark,
              title: 'Ministères',
              text: "Ministères de l'Agriculture pour suivi des politiques et statistiques",
            },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="card text-center">
              <div className="mb-4 flex justify-center">
                <IconCircle className="h-14 w-14 [&_svg]:h-7 [&_svg]:w-7">
                  <Icon strokeWidth={1.75} />
                </IconCircle>
              </div>
              <h3 className="text-xl font-semibold text-brand-forest mb-3">{title}</h3>
              <p className="text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-forest text-white py-16">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.projectTitle')}</h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">{t('home.projectDescription')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-brand-sage rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.objectives.foodSovereignty.title')}</h3>
              <p className="text-white/90 text-sm">{t('home.objectives.foodSovereignty.description')}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-brand-amber rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-brand-forest" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.objectives.valorization.title')}</h3>
              <p className="text-white/90 text-sm">{t('home.objectives.valorization.description')}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-brand-cream/90 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-brand-forest" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.objectives.period.title')}</h3>
              <p className="text-white/90 text-sm">{t('home.objectives.period.description')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-forest mb-4">Aperçu de la plateforme</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">Découvrez les fonctionnalités de Sahel AgriConnect</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card bg-brand-cream/50 flex items-center justify-center min-h-[300px]">
            <div className="text-center px-4">
              <div className="flex justify-center mb-4">
                <IconCircle className="h-16 w-16 [&_svg]:h-8 [&_svg]:w-8">
                  <Camera strokeWidth={1.5} />
                </IconCircle>
              </div>
              <p className="text-gray-600 font-medium">Capture dashboard administrateur</p>
              <p className="text-gray-400 text-sm mt-2">À venir</p>
            </div>
          </div>
          <div className="card bg-brand-cream/50 flex items-center justify-center min-h-[300px]">
            <div className="text-center px-4">
              <div className="flex justify-center mb-4">
                <IconCircle className="h-16 w-16 [&_svg]:h-8 [&_svg]:w-8">
                  <Smartphone strokeWidth={1.5} />
                </IconCircle>
              </div>
              <p className="text-gray-600 font-medium">Application mobile</p>
              <p className="text-gray-400 text-sm mt-2">À venir</p>
            </div>
          </div>
        </div>
      </section>

      <section id="rejoindre" className="section-container py-16">
        <div className="rounded-2xl bg-gradient-to-br from-brand-amber to-brand-amberDeep p-10 md:p-12 text-center text-brand-forest shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.cta.title')}</h2>
          <p className="text-lg mb-8 text-brand-forest/90 max-w-2xl mx-auto">
            Que vous soyez agriculteur, coopérative, investisseur ou partenaire, participez à la transformation de
            l&apos;agriculture en Afrique de l&apos;Ouest et au-delà.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link
              to="/contact"
              className="inline-flex justify-center rounded-lg bg-white px-6 py-3 font-semibold text-brand-forest shadow hover:bg-brand-cream transition"
            >
              S&apos;inscrire maintenant
            </Link>
            <Link
              to="/admin/login"
              className="inline-flex justify-center rounded-lg bg-brand-forest px-6 py-3 font-semibold text-white shadow hover:bg-brand-forest/90 transition"
            >
              Voir le dashboard admin
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex justify-center rounded-lg border-2 border-brand-forest bg-transparent px-6 py-3 font-semibold text-brand-forest hover:bg-brand-forest/10 transition"
            >
              S&apos;inscrire comme agriculteur
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
