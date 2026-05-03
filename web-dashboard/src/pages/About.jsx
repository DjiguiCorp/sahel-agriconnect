import IconCircle from '../components/IconCircle';
import { Target, Banknote, Smartphone, Sprout, Handshake, Globe, GraduationCap } from 'lucide-react';

const About = () => {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-forest to-brand-sage text-white py-20">
        <div className="section-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">À propos du projet PTASS</h1>
          <p className="text-xl max-w-3xl mx-auto text-white/90">
            Découvrez notre mission, nos objectifs et nos partenaires dans la transformation de l&apos;agriculture en
            Afrique de l&apos;Ouest et au-delà
          </p>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-forest mb-6">Présentation du projet PTASS</h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <p>
              Le <strong>Projet de Transformation Agricole du Sahel (PTASS)</strong> est une initiative ambitieuse
              visant à digitaliser et moderniser l&apos;agriculture en Afrique de l&apos;Ouest et au-delà. Ce projet
              s&apos;inscrit
              dans une démarche de souveraineté alimentaire et de développement économique durable.
            </p>
            <p>
              Face aux défis climatiques, économiques et sécuritaires de la région, le PTASS propose une approche
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
        <h2 className="text-3xl md:text-4xl font-bold text-brand-forest text-center mb-12">Feuille de route 2026-2030</h2>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {[
              {
                year: '2026',
                title: 'Lancement et infrastructure',
                description:
                  "Mise en place de la plateforme, déploiement de l'application mobile, formation des premiers agriculteurs pilotes, installation des systèmes d'irrigation dans les zones prioritaires.",
              },
              {
                year: '2027-2028',
                title: 'Expansion et formation',
                description:
                  'Élargissement à 50 000+ agriculteurs, développement des coopératives, mise en place des certifications de qualité, optimisation des chaînes logistiques.',
              },
              {
                year: '2029',
                title: 'Consolidation et marchés',
                description:
                  "Atteinte de 100 000+ agriculteurs actifs, développement des marchés d'exportation, valorisation des produits certifiés, création d'emplois dans le secteur agricole.",
              },
              {
                year: '2030',
                title: 'Autonomie et durabilité',
                description:
                  "Modèle économique autonome, souveraineté alimentaire atteinte, écosystème agricole durable et résilient, réplication du modèle dans d'autres pays d'Afrique subsaharienne.",
              },
            ].map((phase, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-brand-amber rounded-full flex items-center justify-center text-brand-forest font-bold text-xl shadow-md">
                    {phase.year}
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
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                Icon: Handshake,
                title: 'AES',
                text: 'Partenaire technique et financier majeur du projet, apportant expertise et ressources pour la digitalisation agricole.',
              },
              {
                Icon: Globe,
                title: 'Djigui',
                text: "Organisation locale engagée dans le développement agricole et l'autonomisation des communautés rurales en Afrique de l'Ouest et au-delà.",
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
              Le projet PTASS répond directement à ces besoins en proposant des solutions intégrées et durables.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
