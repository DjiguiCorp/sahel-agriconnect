import Hero from '../components/Hero';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Hero />

      {/* Section Projet PTASS */}
      <section className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green mb-4">
            {t('home.projectTitle')}
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            {t('home.projectDescription')}
          </p>
        </div>

        {/* Objectifs */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-green rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-primary-green">{t('home.objectives.foodSovereignty.title')}</h3>
            <p className="text-gray-600">
              {t('home.objectives.foodSovereignty.description')}
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-primary-orange">{t('home.objectives.valorization.title')}</h3>
            <p className="text-gray-600">
              {t('home.objectives.valorization.description')}
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-primary-blue">{t('home.objectives.period.title')}</h3>
            <p className="text-gray-600">
              {t('home.objectives.period.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Céréales Prioritaires */}
      <section className="bg-gray-100 py-16">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green text-center mb-12">
            Céréales Prioritaires
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Mil', 'Sorgho', 'Maïs', 'Riz'].map((cereal, index) => (
              <div key={index} className="card text-center">
                <div className="text-4xl mb-4">🌾</div>
                <h3 className="text-xl font-semibold text-primary-green">{cereal}</h3>
                <p className="text-gray-600 mt-2">
                  Production locale essentielle pour la sécurité alimentaire
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cultures de Rente */}
      <section className="section-container py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-green text-center mb-12">
          Cultures de Rente
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Coton', 'Arachide', 'Sésame', 'Karité', 'Mangue', 'Anacarde'].map((crop, index) => (
            <div key={index} className="card">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">🌱</div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-orange">{crop}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Valorisation économique et export
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trois Niveaux de Qualité */}
      <section className="bg-primary-blue text-white py-16">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Trois Niveaux de Qualité
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl mb-4 text-center">⭐</div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Qualité Standard</h3>
              <p className="text-gray-100">
                Production répondant aux normes de base pour la consommation locale 
                et les marchés régionaux.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl mb-4 text-center">⭐⭐</div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Qualité Premium</h3>
              <p className="text-gray-100">
                Production de haute qualité pour les marchés urbains et l'exportation 
                régionale avec certification.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl mb-4 text-center">⭐⭐⭐</div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Qualité Excellence</h3>
              <p className="text-gray-100">
                Production d'excellence certifiée pour l'exportation internationale 
                avec traçabilité complète.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Irrigation et Transport */}
      <section className="section-container py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-green text-center mb-12">
          Infrastructure et Logistique
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">💧</div>
              <div>
                <h3 className="text-2xl font-semibold text-primary-blue mb-3">Irrigation</h3>
                <p className="text-gray-600">
                  Développement de systèmes d'irrigation modernes et durables pour 
                  améliorer la productivité agricole et réduire la dépendance aux 
                  précipitations saisonnières.
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">🚚</div>
              <div>
                <h3 className="text-2xl font-semibold text-primary-orange mb-3">Transport</h3>
                <p className="text-gray-600">
                  Optimisation des chaînes logistiques pour faciliter le transport 
                  des produits agricoles des zones de production vers les marchés 
                  locaux et internationaux.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Potentiel de Croissance */}
      <section className="bg-gradient-to-r from-primary-green to-primary-lightgreen text-white py-16">
        <div className="section-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Potentiel de Croissance
            </h2>
            <p className="text-lg mb-8 text-gray-100">
              Le Mali et le Burkina Faso possèdent un immense potentiel agricole 
              inexploité. Avec les bonnes technologies, infrastructures et formations, 
              la production agricole peut être multipliée par 3 à 5 fois, créant des 
              opportunités économiques majeures pour les agriculteurs et les communautés.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">3-5x</div>
                <p className="text-gray-100">Augmentation de la production</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">100K+</div>
                <p className="text-gray-100">Agriculteurs ciblés</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">5 ans</div>
                <p className="text-gray-100">Feuille de route</p>
              </div>
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
            <a
              href="/contact"
              className="btn-secondary bg-white text-primary-orange hover:bg-gray-100"
            >
              S'inscrire maintenant
            </a>
            <a
              href="#"
              className="btn-primary bg-primary-blue hover:bg-primary-darkblue"
              onClick={(e) => {
                e.preventDefault();
                alert('Application mobile bientôt disponible !');
              }}
            >
              Télécharger l'app
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

