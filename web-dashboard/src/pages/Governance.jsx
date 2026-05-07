import { Link } from 'react-router-dom';

const Governance = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-green to-primary-lightgreen text-white py-16">
        <div className="section-container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Gouvernance et Données
          </h1>
          <p className="text-xl text-center text-gray-100 max-w-3xl mx-auto">
            Souveraineté des données, confidentialité et engagement transparent
          </p>
        </div>
      </section>

      {/* Section Souveraineté des Données */}
      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary-green mb-6">
            Souveraineté des Données
          </h2>
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-primary-green mb-4">
              Principe Fondamental
            </h3>
            <p className="text-gray-700 mb-4">
              Les données agricoles collectées appartiennent aux <strong>agriculteurs, coopératives et organisations locales</strong>. 
              <strong> Sahel AgriConnect</strong> agit comme un facilitateur, pas comme un propriétaire.
            </p>
            <div className="bg-blue-50 border-l-4 border-primary-blue p-4 rounded">
              <p className="text-sm text-gray-700">
                <strong>Engagement :</strong> Aucune vente de données à des tiers sans consentement explicite. 
                Les agriculteurs peuvent exporter leurs données à tout moment.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold text-primary-green mb-2">
                Propriété Locale
              </h3>
              <p className="text-gray-600 text-sm">
                Les données sont hébergées dans des infrastructures contrôlées par les partenaires locaux 
                  (gouvernements, ministères, organisations partenaires). Aucune dépendance externe.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold text-primary-green mb-2">
                Confidentialité
              </h3>
              <p className="text-gray-600 text-sm">
                Chiffrement des données sensibles (coordonnées GPS, informations financières). 
                Accès basé sur les rôles (agriculteur, coopérative, admin).
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-semibold text-primary-green mb-2">
                Interopérabilité
              </h3>
              <p className="text-gray-600 text-sm">
                APIs ouvertes pour intégration avec d'autres systèmes agricoles. 
                Export des données en formats standards (CSV, JSON, GeoJSON).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Qui Possède les Données */}
      <section className="bg-gray-100 py-16">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-primary-green mb-6">
              Qui Possède les Données ?
            </h2>
            <div className="card">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-3">
                    Données Agriculteurs
                  </h3>
                  <p className="text-gray-700">
                    Les informations collectées (nom, localisation, cultures, superficies) appartiennent à 
                    <strong> l'agriculteur</strong>. Il peut :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>Exporter ses données à tout moment</li>
                    <li>Demander la suppression de ses données</li>
                    <li>Contrôler qui a accès à ses informations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-3">
                    Données Coopératives
                  </h3>
                  <p className="text-gray-700">
                    Les informations des coopératives (membres, équipements, demandes de financement) 
                    appartiennent à la <strong>coopérative</strong>. Accès partagé entre la coopérative 
                    et les administrateurs de la plateforme pour gestion.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-3">
                    Données Agregées
                  </h3>
                  <p className="text-gray-700">
                    Les statistiques agrégées (nombre total d'agriculteurs, superficies totales) 
                    peuvent être utilisées par les <strong>gouvernements et organisations partenaires</strong> 
                    pour le suivi des politiques agricoles, avec anonymisation des données individuelles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Confidentialité */}
      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary-green mb-6">
            Confidentialité et Protection
          </h2>
          <div className="card">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-primary-green mb-3">
                  Chiffrement
                </h3>
                <p className="text-gray-700">
                  Toutes les données sensibles sont chiffrées :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li><strong>En transit :</strong> HTTPS/TLS pour toutes les communications</li>
                  <li><strong>Au repos :</strong> Chiffrement des bases de données MongoDB Atlas</li>
                  <li><strong>Coordonnées GPS :</strong> Chiffrement supplémentaire pour protection de la vie privée</li>
                  <li><strong>Informations financières :</strong> Chiffrement de niveau bancaire</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-primary-green mb-3">
                  Contrôle d'Accès
                </h3>
                <p className="text-gray-700">
                  Système de rôles et permissions :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li><strong>Agriculteur :</strong> Accès uniquement à ses propres données</li>
                  <li><strong>Coopérative :</strong> Accès aux données de ses membres</li>
                  <li><strong>Admin :</strong> Accès aux données agrégées pour gestion</li>
                  <li><strong>Ministère :</strong> Accès aux statistiques anonymisées uniquement</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-primary-green mb-3">
                  Conformité
                </h3>
                <p className="text-gray-700">
                  Nous nous engageons à respecter les standards de protection des données :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li>Principes similaires au RGPD (consentement, droit à l'oubli, portabilité)</li>
                  <li>Respect des lois locales sur la protection des données</li>
                  <li>Audit régulier de la sécurité</li>
                  <li>Transparence sur l'utilisation des données</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Stratégie API */}
      <section className="bg-gray-100 py-16">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-primary-green mb-6">
              Stratégie API Future
            </h2>
            <div className="card">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-3">
                    Phase 1 (2026) - APIs Internes
                  </h3>
                  <p className="text-gray-700">
                    APIs REST pour le frontend React. Authentification JWT, endpoints pour agriculteurs, 
                    coopératives, centres de transformation.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-3">
                    Phase 2 (2027) - APIs Publiques
                  </h3>
                  <p className="text-gray-700">
                    Documentation complète des APIs pour partenaires (gouvernements, ministères, organisations partenaires). 
                    Versioning, rate limiting, authentification par clé API.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-primary-green mb-3">
                    Phase 3 (2028+) - Marketplace d'APIs
                  </h3>
                  <p className="text-gray-700">
                    Écosystème d'APIs pour développeurs tiers. Intégration avec autres systèmes agricoles, 
                    applications mobiles, plateformes de commerce électronique.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-primary-blue p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Engagement :</strong> Toutes les APIs seront documentées, versionnées, 
                    et respecteront les principes de souveraineté des données.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Engagement Souverain */}
      <section className="section-container py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary-green mb-6">
            Engagement Souverain
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="text-4xl mb-4">🚫</div>
              <h3 className="text-lg font-semibold text-primary-green mb-2">
                Pas de Dépendance Externe
              </h3>
              <p className="text-gray-600 text-sm">
                Infrastructure déployable localement. Code open-source disponible pour audit et contribution.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-primary-green mb-2">
                Formation Locale
              </h3>
              <p className="text-gray-600 text-sm">
                Transfert de compétences aux équipes locales. Documentation complète en français.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-primary-green mb-2">
                Gouvernance Participative
              </h3>
              <p className="text-gray-600 text-sm">
                Comité de pilotage incluant agriculteurs, coopératives, administrations. 
                Décisions collectives.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">🔓</div>
              <h3 className="text-lg font-semibold text-primary-green mb-2">
                Code Open-Source
              </h3>
              <p className="text-gray-600 text-sm">
                Code disponible sur GitHub pour audit, contribution et déploiement local.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Contact */}
      <section className="bg-primary-green text-white py-16">
        <div className="section-container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Questions sur la Gouvernance ?
          </h2>
          <p className="text-lg text-gray-100 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour plus d'informations sur notre politique de données et notre engagement souverain.
          </p>
          <Link
            to="/contact"
            className="btn-secondary bg-white text-primary-green hover:bg-gray-100 inline-block"
          >
            Nous Contacter
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Governance;

