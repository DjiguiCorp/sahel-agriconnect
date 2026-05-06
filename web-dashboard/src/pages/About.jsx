import { Helmet } from 'react-helmet-async';
import IconCircle from '../components/IconCircle';
import { Target, Banknote, Smartphone, Sprout, Handshake, Globe, GraduationCap } from 'lucide-react';

const About = () => {
  return (
    <div>
      <Helmet>
        <title>À propos de Sahel AgriConnect</title>
      </Helmet>
      <section className="bg-gradient-to-br from-brand-forest to-brand-sage text-white py-20">
        <div className="section-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">À propos de Sahel AgriConnect</h1>
          <p className="text-xl max-w-3xl mx-auto text-white/90">
            Plateforme africaine de digitalisation agricole, connectant les producteurs aux marchés locaux et internationaux.
          </p>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-forest mb-6">Présentation de Sahel AgriConnect</h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <p>
              <strong>Sahel AgriConnect</strong> est une initiative ambitieuse visant à digitaliser et moderniser
              l&apos;agriculture en Afrique de l&apos;Ouest et au-delà, dans une démarche de souveraineté alimentaire et
              de développement économique durable.
            </p>
            <p>
              Face aux défis climatiques, économiques et sécuritaires de la région, Sahel AgriConnect propose une approche
              innovante combinant technologies numériques, formation des agriculteurs, amélioration des infrastructures et
              valorisation des productions locales.
            </p>
            <p>
              Notre plateforme <strong>Sahel AgriConnect</strong> permet de connecter les agriculteurs, les
              coopératives, les investisseurs et les partenaires techniques pour créer un écosystème agricole performant
              et résilient.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-100/80 py-16">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-forest text-center mb-12">Nos objectifs</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                Icon: Target,
                title: 'Souveraineté alimentaire',
                text: "Assurer l'autonomie alimentaire des populations en Afrique de l'Ouest et au-delà en augmentant la production locale de céréales et de cultures de rente, réduisant ainsi la dépendance aux importations.",
              },
              {
                Icon: Banknote,
                title: 'Valorisation économique',
                text: 'Améliorer les revenus des agriculteurs et des coopératives en optimisant les chaînes de valeur, en facilitant l\'accès aux marchés et en promouvant des produits de qualité certifiée.',
              },
              {
                Icon: Smartphone,
                title: 'Digitalisation',
                text: "Mettre à disposition des outils numériques accessibles (application mobile, plateforme web) pour faciliter la gestion des exploitations, l'accès à l'information et la connexion entre acteurs.",
              },
              {
                Icon: Sprout,
                title: 'Durabilité',
                text: 'Promouvoir des pratiques agricoles durables et résilientes face au changement climatique, en intégrant l\'irrigation moderne, la gestion des sols et la diversification des cultures.',
              },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="card">
                <div className="flex items-start gap-4">
                  <IconCircle>
                    <Icon strokeWidth={1.75} />
                  </IconCircle>
                  <div>
                    <h3 className="text-2xl font-semibold text-brand-forest mb-3">{title}</h3>
                    <p className="text-gray-600">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-forest text-center mb-12">Feuille de route</h2>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Phase 1 — Lancement & Infrastructure',
                description:
                  'Déploiement de la plateforme, onboarding des premiers agriculteurs pilotes, mise en place des coopératives fondatrices, lancement des outils de détection de maladies et de diagnostic',
              },
              {
                step: '2',
                title: 'Phase 2 — Expansion & Formation',
                description:
                  "Élargissement à travers l'Afrique de l'Ouest, développement des coopératives, certifications de qualité, optimisation des chaînes logistiques",
              },
              {
                step: '3',
                title: 'Phase 3 — Marchés & Export',
                description:
                  "Connexion aux marchés internationaux via AfriYield Exchange, certifications USDA/UE, partenariats diaspora, fonds d'équipement coopératif",
              },
              {
                step: '4',
                title: 'Impact Continental',
                description:
                  "Une plateforme ouverte à toute l'Afrique — connectant producteurs, investisseurs et acheteurs internationaux sans frontières.",
              },
            ].map((phase, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-brand-amber rounded-full flex items-center justify-center text-brand-forest font-bold text-xl shadow-md">
                    {phase.title === 'Impact Continental' ? (
                      <Globe className="w-11 h-11" strokeWidth={1.75} aria-hidden />
                    ) : (
                      phase.step
                    )}
                  </div>
                </div>
                <div className="flex-1 card">
                  <h3 className="text-2xl font-semibold text-brand-forest mb-3">{phase.title}</h3>
                  <p className="text-gray-600">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-forest text-white py-16">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Nos partenaires</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                Icon: Handshake,
                title: 'Djigui Corporation',
                text: 'Organisation fondatrice de Sahel AgriConnect, engagée dans la transformation agricole et le développement économique durable en Afrique.',
              },
              {
                Icon: GraduationCap,
                title: 'Universités US',
                text: 'Partenaires académiques des universités de Pennsylvanie et du Delaware, apportant recherche, innovation et formation technique.',
              },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <IconCircle className="bg-white/20 border-white/30 text-white [&_svg]:text-white">
                    <Icon strokeWidth={1.75} />
                  </IconCircle>
                </div>
                <h3 className="text-2xl font-semibold mb-3">{title}</h3>
                <p className="text-white/90">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-forest mb-6">Déclaration des besoins</h2>
          <div className="card">
            <p className="text-gray-700 text-lg mb-4">
              Les agriculteurs en Afrique de l&apos;Ouest et au-delà font face à de nombreux défis :
            </p>
            <ul className="space-y-3 text-gray-600">
              {[
                'Accès limité aux technologies et outils numériques modernes',
                "Dépendance aux précipitations saisonnières et manque d'infrastructures d'irrigation",
                "Difficultés d'accès aux marchés et faibles prix de vente",
                'Manque de formation et de conseils techniques',
                'Absence de certification et de traçabilité des produits',
                'Chaînes logistiques inefficaces et coûteuses',
              ].map((item) => (
                <li key={item} className="flex items-start">
                  <span className="text-brand-sage mr-3 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-700 text-lg mt-6">
              Sahel AgriConnect répond directement à ces besoins en proposant des solutions intégrées et durables.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
