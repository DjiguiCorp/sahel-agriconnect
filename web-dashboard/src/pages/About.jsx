const About = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-green to-primary-lightgreen text-white py-20">
        <div className="section-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">À Propos du Projet PTASS</h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-100">
            Découvrez notre mission, nos objectifs et nos partenaires dans la transformation 
            de l'agriculture au Sahel
          </p>
        </div>
      </section>

      {/* Présentation du Projet */}
      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green mb-6">
            Présentation du Projet PTASS
          </h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <p>
              Le <strong>Projet de Transformation Agricole du Sahel (PTASS)</strong> est une 
              initiative ambitieuse visant à digitaliser et moderniser l'agriculture au Mali 
              et au Burkina Faso. Ce projet s'inscrit dans une démarche de souveraineté 
              alimentaire et de développement économique durable.
            </p>
            <p>
              Face aux défis climatiques, économiques et sécuritaires de la région, le PTASS 
              propose une approche innovante combinant technologies numériques, formation des 
              agriculteurs, amélioration des infrastructures et valorisation des productions locales.
            </p>
            <p>
              Notre plateforme <strong>Sahel AgriConnect</strong> permet de connecter les 
              agriculteurs, les coopératives, les investisseurs et les partenaires techniques 
              pour créer un écosystème agricole performant et résilient.
            </p>
          </div>
        </div>
      </section>

      {/* Objectifs */}
      <section className="bg-gray-100 py-16">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green text-center mb-12">
            Nos Objectifs
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="card">
              <h3 className="text-2xl font-semibold text-primary-green mb-4">
                🎯 Souveraineté Alimentaire
              </h3>
              <p className="text-gray-600">
                Assurer l'autonomie alimentaire des populations du Mali et du Burkina Faso 
                en augmentant la production locale de céréales et de cultures de rente, 
                réduisant ainsi la dépendance aux importations.
              </p>
            </div>
            <div className="card">
              <h3 className="text-2xl font-semibold text-primary-orange mb-4">
                💰 Valorisation Économique
              </h3>
              <p className="text-gray-600">
                Améliorer les revenus des agriculteurs et des coopératives en optimisant 
                les chaînes de valeur, en facilitant l'accès aux marchés et en promouvant 
                des produits de qualité certifiée.
              </p>
            </div>
            <div className="card">
              <h3 className="text-2xl font-semibold text-primary-blue mb-4">
                📱 Digitalisation
              </h3>
              <p className="text-gray-600">
                Mettre à disposition des outils numériques accessibles (application mobile, 
                plateforme web) pour faciliter la gestion des exploitations, l'accès à 
                l'information et la connexion entre acteurs.
              </p>
            </div>
            <div className="card">
              <h3 className="text-2xl font-semibold text-primary-green mb-4">
                🌱 Durabilité
              </h3>
              <p className="text-gray-600">
                Promouvoir des pratiques agricoles durables et résilientes face au changement 
                climatique, en intégrant l'irrigation moderne, la gestion des sols et la 
                diversification des cultures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feuille de Route 2026-2030 */}
      <section className="section-container py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-green text-center mb-12">
          Feuille de Route 2026-2030
        </h2>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {[
              {
                year: '2026',
                title: 'Lancement et Infrastructure',
                description: 'Mise en place de la plateforme, déploiement de l\'application mobile, formation des premiers agriculteurs pilotes, installation des systèmes d\'irrigation dans les zones prioritaires.'
              },
              {
                year: '2027-2028',
                title: 'Expansion et Formation',
                description: 'Élargissement à 50 000+ agriculteurs, développement des coopératives, mise en place des certifications de qualité, optimisation des chaînes logistiques.'
              },
              {
                year: '2029',
                title: 'Consolidation et Marchés',
                description: 'Atteinte de 100 000+ agriculteurs actifs, développement des marchés d\'exportation, valorisation des produits certifiés, création d\'emplois dans le secteur agricole.'
              },
              {
                year: '2030',
                title: 'Autonomie et Durabilité',
                description: 'Modèle économique autonome, souveraineté alimentaire atteinte, écosystème agricole durable et résilient, réplication du modèle dans d\'autres pays du Sahel.'
              }
            ].map((phase, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-primary-orange rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {phase.year}
                  </div>
                </div>
                <div className="flex-1 card">
                  <h3 className="text-2xl font-semibold text-primary-green mb-3">
                    {phase.title}
                  </h3>
                  <p className="text-gray-600">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section className="bg-primary-blue text-white py-16">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Nos Partenaires
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-2xl font-semibold mb-3">AES</h3>
              <p className="text-gray-100">
                Partenaire technique et financier majeur du projet, apportant expertise 
                et ressources pour la digitalisation agricole.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-2xl font-semibold mb-3">Djigui</h3>
              <p className="text-gray-100">
                Organisation locale engagée dans le développement agricole et l'autonomisation 
                des communautés rurales au Mali et au Burkina Faso.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-2xl font-semibold mb-3">Universités US</h3>
              <p className="text-gray-100">
                Partenaires académiques des universités de Pennsylvanie et du Delaware, 
                apportant recherche, innovation et formation technique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Déclaration des Besoins */}
      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green mb-6">
            Déclaration des Besoins
          </h2>
          <div className="card">
            <p className="text-gray-700 text-lg mb-4">
              Les agriculteurs du Mali et du Burkina Faso font face à de nombreux défis :
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-primary-orange mr-3">•</span>
                <span>Accès limité aux technologies et outils numériques modernes</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-orange mr-3">•</span>
                <span>Dépendance aux précipitations saisonnières et manque d'infrastructures d'irrigation</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-orange mr-3">•</span>
                <span>Difficultés d'accès aux marchés et faibles prix de vente</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-orange mr-3">•</span>
                <span>Manque de formation et de conseils techniques</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-orange mr-3">•</span>
                <span>Absence de certification et de traçabilité des produits</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-orange mr-3">•</span>
                <span>Chaînes logistiques inefficaces et coûteuses</span>
              </li>
            </ul>
            <p className="text-gray-700 text-lg mt-6">
              Le projet PTASS répond directement à ces besoins en proposant des solutions 
              intégrées et durables.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

