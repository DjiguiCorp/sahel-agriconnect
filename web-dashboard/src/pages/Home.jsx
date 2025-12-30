import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Hero />

      {/* Section Problèmes Résolus */}
      <section className="section-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green mb-4">
            Problèmes Résolus
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Sahel AgriConnect répond aux défis majeurs de l'agriculture au Sahel
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-4xl mb-4">🌾</div>
            <h3 className="text-xl font-semibold text-primary-green mb-2">
              Accès aux Intrants
            </h3>
            <p className="text-gray-600">
              Facilite l'accès aux semences, fertilisants et équipements via les coopératives
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-primary-green mb-2">
              Traçabilité
            </h3>
            <p className="text-gray-600">
              Suivi complet de la production à la consommation pour certification qualité
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-primary-green mb-2">
              Accès aux Marchés
            </h3>
            <p className="text-gray-600">
              Connexion directe aux marchés locaux, régionaux et internationaux
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-primary-green mb-2">
              Financement
            </h3>
            <p className="text-gray-600">
              Financement sans prêt via diaspora et ressources locales
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">🏭</div>
            <h3 className="text-xl font-semibold text-primary-green mb-2">
              Transformation
            </h3>
            <p className="text-gray-600">
              Connexion aux centres de transformation pour valorisation des produits
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-primary-green mb-2">
              Certification
            </h3>
            <p className="text-gray-600">
              Support pour certification Local, Régional et International (FDA/USDA)
            </p>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités Clés */}
      <section className="bg-gray-100 py-16">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-green mb-4">
              Fonctionnalités Clés
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Une plateforme complète pour transformer l'agriculture au Sahel
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">👨‍🌾</div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-2">
                    Enregistrement Agriculteurs
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Formulaire complet avec géolocalisation GPS, détection satellite des terres, 
                    et analyse de maladies des plantes.
                  </p>
                  <Link to="/dashboard" className="text-primary-orange hover:underline font-medium">
                    Enregistrer un agriculteur →
                  </Link>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🤝</div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-2">
                    Gestion Coopératives
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Liste complète des coopératives, demandes de financement, 
                    et gestion des équipements partagés.
                  </p>
                  <Link to="/cooperatives" className="text-primary-orange hover:underline font-medium">
                    Voir les coopératives →
                  </Link>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🌍</div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-2">
                    Partenariat Diaspora
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Connexion entreprises diaspora (USA) avec centres de transformation locaux. 
                    Matching automatique par produits.
                  </p>
                  <Link to="/diaspora" className="text-primary-orange hover:underline font-medium">
                    Rejoindre la diaspora →
                  </Link>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🏭</div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-2">
                    Centres de Transformation
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Liste des centres avec certification (Local/Régional/FDA-USDA), 
                    demande de certification, représentation aux USA.
                  </p>
                  <Link to="/centres-transformation" className="text-primary-orange hover:underline font-medium">
                    Voir les centres →
                  </Link>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">📊</div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-2">
                    Dashboard Administratif
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Vue temps réel des agriculteurs, gestion des coopératives, 
                    suivi des demandes et statistiques complètes.
                  </p>
                  <Link to="/admin/login" className="text-primary-orange hover:underline font-medium">
                    Accéder au dashboard →
                  </Link>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🔬</div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-2">
                    Outils Agricoles
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Diagnostic du sol, détection de maladies, Think Tank Solutions 
                    avec recommandations personnalisées.
                  </p>
                  <Link to="/diagnostic-sol" className="text-primary-orange hover:underline font-medium">
                    Utiliser les outils →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Partenaires */}
      <section className="section-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green mb-4">
            Partenaires Potentiels
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Rejoignez un écosystème en croissance pour transformer l'agriculture au Sahel
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-primary-green mb-3">
              Alliance des États du Sahel (AES)
            </h3>
            <p className="text-gray-600">
              Coordination transfrontalière pour la transformation agricole régionale
            </p>
          </div>
          <div className="card text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-primary-green mb-3">
              Diaspora
            </h3>
            <p className="text-gray-600">
              Restaurants et retailers USA connectés aux producteurs du Sahel
            </p>
          </div>
          <div className="card text-center">
            <div className="text-5xl mb-4">🏛️</div>
            <h3 className="text-xl font-semibold text-primary-green mb-3">
              Ministères
            </h3>
            <p className="text-gray-600">
              Ministères de l'Agriculture pour suivi des politiques et statistiques
            </p>
          </div>
        </div>
      </section>

      {/* Section Projet PTASS */}
      <section className="bg-primary-blue text-white py-16">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.projectTitle')}
            </h2>
            <p className="text-lg text-gray-100 max-w-3xl mx-auto">
              {t('home.projectDescription')}
            </p>
          </div>

          {/* Objectifs */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-primary-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.objectives.foodSovereignty.title')}</h3>
              <p className="text-gray-100 text-sm">
                {t('home.objectives.foodSovereignty.description')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.objectives.valorization.title')}</h3>
              <p className="text-gray-100 text-sm">
                {t('home.objectives.valorization.description')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.objectives.period.title')}</h3>
              <p className="text-gray-100 text-sm">
                {t('home.objectives.period.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Screenshots (Placeholder) */}
      <section className="section-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green mb-4">
            Aperçu de la Plateforme
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Découvrez les fonctionnalités de Sahel AgriConnect
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card bg-gray-100 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-500 font-medium">Screenshot Dashboard Admin</p>
              <p className="text-gray-400 text-sm mt-2">À venir</p>
            </div>
          </div>
          <div className="card bg-gray-100 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-500 font-medium">Screenshot Application Mobile</p>
              <p className="text-gray-400 text-sm mt-2">À venir</p>
            </div>
          </div>
        </div>
      </section>

      {/* Appel à l'Action */}
      <section id="rejoindre" className="section-container py-16">
        <div className="bg-gradient-to-br from-primary-orange to-primary-lightorange rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Rejoignez le Projet PTASS
          </h2>
          <p className="text-xl mb-8 text-gray-100 max-w-2xl mx-auto">
            Que vous soyez agriculteur, coopérative, investisseur ou partenaire, 
            participez à la transformation de l'agriculture au Sahel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="btn-secondary bg-white text-primary-orange hover:bg-gray-100"
            >
              S'inscrire maintenant
            </Link>
            <Link
              to="/admin/login"
              className="btn-primary bg-primary-blue hover:bg-primary-darkblue"
            >
              Voir le dashboard admin
            </Link>
            <Link
              to="/dashboard"
              className="btn-secondary bg-white text-primary-green hover:bg-gray-100"
            >
              S'inscrire comme agriculteur
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
