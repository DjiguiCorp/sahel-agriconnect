import { useState } from 'react';

const ThinkTankSolutions = () => {
  const [selectedTopic, setSelectedTopic] = useState('fertilisant');

  const topics = {
    fertilisant: {
      title: 'Fertilisants Organiques à partir de Fientes',
      icon: '🌱',
      description: 'Transformation des fientes d\'élevage en fertilisant organique de qualité pour améliorer la fertilité des sols',
      problemes: [
        'Déchets d\'élevage non valorisés',
        'Coûts élevés des engrais chimiques',
        'Dégradation de la qualité des sols',
        'Dépendance aux intrants externes'
      ],
      etapes: [
        {
          numero: 1,
          titre: 'Collecte et Stockage',
          description: 'Collecter les fientes fraîches et les stocker dans un endroit couvert et bien aéré. Éviter l\'exposition directe au soleil et à la pluie.',
          details: [
            'Utiliser des bacs ou fosses de collecte',
            'Maintenir une humidité de 50-60%',
            'Protéger contre les intempéries',
            'Éviter le mélange avec de la litière souillée'
          ]
        },
        {
          numero: 2,
          titre: 'Compostage',
          description: 'Transformer les fientes en compost mature par décomposition aérobie. Le processus prend 2-3 mois.',
          details: [
            'Mélanger fientes avec matière carbonée (paille, feuilles) : ratio 1:2 ou 1:3',
            'Retourner le tas toutes les 2 semaines pour aération',
            'Maintenir température entre 50-70°C',
            'Ajouter de l\'eau si nécessaire pour maintenir l\'humidité',
            'Le compost est prêt quand il est sombre, friable et sans odeur'
          ]
        },
        {
          numero: 3,
          titre: 'Maturation et Séchage',
          description: 'Laisser le compost mûrir pendant 2-4 semaines supplémentaires avant utilisation.',
          details: [
            'Étaler le compost en couche fine pour séchage',
            'Protéger de la pluie pendant le séchage',
            'Tester le pH (idéalement entre 6.5 et 7.5)',
            'Vérifier l\'absence de pathogènes'
          ]
        },
        {
          numero: 4,
          titre: 'Application',
          description: 'Appliquer le compost sur les champs selon les besoins des cultures.',
          details: [
            'Dose recommandée : 5-10 tonnes/hectare',
            'Épandre avant la plantation ou pendant la préparation du sol',
            'Incorporer légèrement dans le sol',
            'Arroser après application pour activation'
          ]
        }
      ],
      avantages: [
        'Améliore la structure et la fertilité du sol',
        'Réduit les coûts d\'achat d\'engrais chimiques',
        'Augmente la rétention d\'eau du sol',
        'Favorise l\'activité microbienne bénéfique',
        'Réduit les déchets et l\'impact environnemental',
        'Améliore la qualité des produits agricoles'
      ],
      intrants: [
        'Fientes d\'élevage (vaches, poulets, chèvres, moutons)',
        'Matière carbonée : paille, feuilles mortes, sciure',
        'Eau pour maintenir l\'humidité',
        'Outils : fourche, brouette, bacs de collecte',
        'Espace de compostage (minimum 10m²)',
        'Bâche ou couverture pour protection'
      ],
      ressources: [
        {
          type: 'PDF',
          titre: 'Guide complet du compostage des fientes',
          lien: '#'
        },
        {
          type: 'Vidéo',
          titre: 'Technique de compostage en zone aride',
          lien: '#'
        },
        {
          type: 'PDF',
          titre: 'Calcul des doses de compost par culture',
          lien: '#'
        }
      ],
      couts: {
        investissement: '500 000 - 1 000 000 FCFA',
        description: 'Pour l\'équipement de base (bacs, outils, espace)',
        retour: '6-12 mois',
        economie: 'Réduction de 30-50% des coûts d\'engrais chimiques'
      }
    },
    biogaz: {
      title: 'Production de Biogaz à partir de Fientes',
      icon: '⚡',
      description: 'Transformation des fientes en biogaz pour produire de l\'énergie (cuisson, éclairage, électricité)',
      problemes: [
        'Manque d\'accès à l\'électricité',
        'Coûts élevés du gaz de cuisson',
        'Déforestation due à l\'utilisation du bois',
        'Déchets d\'élevage non valorisés',
        'Émissions de gaz à effet de serre'
      ],
      etapes: [
        {
          numero: 1,
          titre: 'Dimensionnement',
          description: 'Calculer la taille du digesteur selon la quantité de fientes disponibles et les besoins énergétiques.',
          details: [
            'Estimer la production quotidienne de fientes',
            'Calculer les besoins énergétiques (cuisson, éclairage)',
            'Dimensionner le digesteur : 1m³ pour 2-3 vaches ou 20-30 poulets',
            'Prévoir un espace pour le digesteur et le stockage'
          ]
        },
        {
          numero: 2,
          titre: 'Construction du Digesteur',
          description: 'Construire ou installer un digesteur (biodigesteur) pour la fermentation anaérobie.',
          details: [
            'Choisir le type : fixe (béton) ou souple (plastique)',
            'Installer le système d\'alimentation et de sortie',
            'Connecter le système de collecte du biogaz',
            'Assurer l\'étanchéité complète (anaérobie)',
            'Prévoir un système de sécurité (soupape de pression)'
          ]
        },
        {
          numero: 3,
          titre: 'Alimentation et Fonctionnement',
          description: 'Alimenter le digesteur régulièrement avec les fientes mélangées à de l\'eau.',
          details: [
            'Mélanger fientes avec eau : ratio 1:1 à 1:2',
            'Alimenter quotidiennement à heures fixes',
            'Maintenir température entre 25-35°C (mésophile)',
            'Agiter le mélange régulièrement',
            'Surveiller le pH (idéalement 6.8-7.2)'
          ]
        },
        {
          numero: 4,
          titre: 'Collecte et Utilisation',
          description: 'Collecter le biogaz produit et l\'utiliser pour les besoins énergétiques.',
          details: [
            'Le biogaz commence à être produit après 2-3 semaines',
            'Collecter dans un réservoir de stockage (gazomètre)',
            'Utiliser pour cuisson avec réchaud adapté',
            'Peut alimenter un générateur pour électricité',
            'Le digestat (résidu) peut être utilisé comme fertilisant'
          ]
        }
      ],
      avantages: [
        'Production d\'énergie renouvelable et gratuite',
        'Réduction des coûts d\'électricité et de gaz',
        'Réduction de la déforestation',
        'Valorisation des déchets d\'élevage',
        'Production de fertilisant (digestat) en sous-produit',
        'Réduction des émissions de méthane',
        'Amélioration de la qualité de l\'air intérieur'
      ],
      intrants: [
        'Fientes d\'élevage (frais, quotidiennement)',
        'Eau pour mélange',
        'Digesteur (biodigesteur) : 500 000 - 2 000 000 FCFA',
        'Système de collecte et stockage du biogaz',
        'Réchaud adapté au biogaz',
        'Générateur (optionnel, pour électricité)',
        'Espace d\'installation (minimum 20m²)'
      ],
      ressources: [
        {
          type: 'PDF',
          titre: 'Guide de construction de biodigesteur',
          lien: '#'
        },
        {
          type: 'Vidéo',
          titre: 'Installation d\'un biodigesteur familial',
          lien: '#'
        },
        {
          type: 'PDF',
          titre: 'Calcul de dimensionnement et rentabilité',
          lien: '#'
        }
      ],
      couts: {
        investissement: '500 000 - 2 500 000 FCFA',
        description: 'Selon la taille et le type de digesteur',
        retour: '12-24 mois',
        economie: 'Économie de 50 000 - 150 000 FCFA/mois sur énergie'
      }
    }
  };

  const currentTopic = topics[selectedTopic];

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-green mb-4">
          Solutions Think Tank : Valorisation des Fientes d'Élevage
        </h2>
        <p className="text-gray-600">
          Découvrez comment transformer les fientes de votre élevage en ressources précieuses : 
          fertilisant organique ou énergie (biogaz).
        </p>
      </div>

      {/* Sélection du sujet */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedTopic('fertilisant')}
            className={`p-6 border-2 rounded-lg text-left transition-all ${
              selectedTopic === 'fertilisant'
                ? 'border-primary-green bg-primary-green/10'
                : 'border-gray-300 hover:border-primary-orange'
            }`}
          >
            <div className="text-4xl mb-2">🌱</div>
            <h3 className="text-xl font-bold text-primary-green mb-2">
              Fertilisant Organique
            </h3>
            <p className="text-sm text-gray-600">
              Transformation en compost pour améliorer la fertilité des sols
            </p>
          </button>

          <button
            onClick={() => setSelectedTopic('biogaz')}
            className={`p-6 border-2 rounded-lg text-left transition-all ${
              selectedTopic === 'biogaz'
                ? 'border-primary-green bg-primary-green/10'
                : 'border-gray-300 hover:border-primary-orange'
            }`}
          >
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="text-xl font-bold text-primary-green mb-2">
              Production de Biogaz
            </h3>
            <p className="text-sm text-gray-600">
              Transformation en énergie pour cuisson, éclairage et électricité
            </p>
          </button>
        </div>
      </div>

      {/* Contenu détaillé */}
      {currentTopic && (
        <div className="space-y-6">
          {/* En-tête */}
          <div className="bg-gradient-to-br from-primary-green to-primary-lightgreen text-white p-6 rounded-lg">
            <div className="text-5xl mb-3">{currentTopic.icon}</div>
            <h3 className="text-3xl font-bold mb-2">{currentTopic.title}</h3>
            <p className="text-gray-100">{currentTopic.description}</p>
          </div>

          {/* Problèmes résolus */}
          <div className="card bg-red-50 border-l-4 border-red-500">
            <h4 className="text-xl font-bold text-red-800 mb-3">
              🔍 Problèmes Résolus
            </h4>
            <ul className="space-y-2">
              {currentTopic.problemes.map((probleme, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="text-red-700">{probleme}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Étapes */}
          <div className="card">
            <h4 className="text-2xl font-bold text-primary-green mb-6">
              📋 Étapes de Mise en Œuvre
            </h4>
            <div className="space-y-6">
              {currentTopic.etapes.map((etape) => (
                <div key={etape.numero} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-orange rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {etape.numero}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xl font-semibold text-gray-900 mb-2">
                      {etape.titre}
                    </h5>
                    <p className="text-gray-600 mb-3">{etape.description}</p>
                    <ul className="space-y-1">
                      {etape.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-700">
                          <span className="text-primary-orange mr-2">→</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Avantages */}
          <div className="card bg-green-50 border-l-4 border-green-500">
            <h4 className="text-xl font-bold text-green-800 mb-3">
              ✅ Avantages
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {currentTopic.avantages.map((avantage, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-green-700">{avantage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intrants */}
          <div className="card bg-blue-50 border-l-4 border-primary-blue">
            <h4 className="text-xl font-bold text-primary-blue mb-3">
              🛠️ Intrants Nécessaires
            </h4>
            <ul className="space-y-2">
              {currentTopic.intrants.map((intrant, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-blue mr-2">→</span>
                  <span className="text-gray-700">{intrant}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coûts et Rentabilité */}
          <div className="card bg-orange-50 border-l-4 border-primary-orange">
            <h4 className="text-xl font-bold text-primary-orange mb-3">
              💰 Investissement et Rentabilité
            </h4>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Investissement initial :</strong> {currentTopic.couts.investissement}
              </p>
              <p className="text-sm text-gray-600">{currentTopic.couts.description}</p>
              <p className="text-gray-700">
                <strong>Retour sur investissement :</strong> {currentTopic.couts.retour}
              </p>
              <p className="text-gray-700">
                <strong>Économies :</strong> {currentTopic.couts.economie}
              </p>
            </div>
          </div>

          {/* Ressources */}
          <div className="card bg-purple-50 border-l-4 border-purple-500">
            <h4 className="text-xl font-bold text-purple-800 mb-3">
              📚 Ressources Complémentaires
            </h4>
            <div className="space-y-3">
              {currentTopic.ressources.map((ressource, index) => (
                <a
                  key={index}
                  href={ressource.lien}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Ressource "${ressource.titre}" - Lien à implémenter avec le backend`);
                  }}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className={`px-3 py-1 rounded text-sm font-medium ${
                    ressource.type === 'PDF'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ressource.type}
                  </div>
                  <span className="text-gray-700 flex-1">{ressource.titre}</span>
                  <svg
                    className="w-5 h-5 text-primary-orange"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Note importante */}
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-800">
              <strong>💡 Conseil :</strong> Pour un accompagnement technique et financier, 
              contactez votre coopérative ou les partenaires du projet PTASS (AES, Djigui). 
              Des programmes pilotes peuvent être disponibles pour vous aider à démarrer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkTankSolutions;

