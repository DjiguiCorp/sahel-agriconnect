import { useState } from 'react';
import ThinkTankSolutions from '../components/ThinkTankSolutions';

const ThinkTank = () => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showFientesSolutions, setShowFientesSolutions] = useState(false);

  const solutions = {
    irrigation: {
      title: 'Gestion de l\'Irrigation',
      description: 'Solutions pour optimiser l\'utilisation de l\'eau et améliorer l\'irrigation des cultures',
      problemes: [
        'Manque d\'eau pendant la saison sèche',
        'Gaspillage d\'eau par irrigation inefficace',
        'Coûts élevés de l\'irrigation',
        'Sécheresse récurrente'
      ],
      etapes: [
        {
          numero: 1,
          titre: 'Évaluation des besoins en eau',
          description: 'Calculer les besoins en eau de vos cultures selon le stade de croissance et les conditions climatiques'
        },
        {
          numero: 2,
          titre: 'Choix du système d\'irrigation',
          description: 'Sélectionner entre irrigation goutte à goutte, aspersion ou gravitaire selon vos ressources'
        },
        {
          numero: 3,
          titre: 'Installation et maintenance',
          description: 'Installer le système et assurer une maintenance régulière pour éviter les fuites'
        },
        {
          numero: 4,
          titre: 'Suivi et optimisation',
          description: 'Surveiller l\'humidité du sol et ajuster l\'irrigation selon les besoins réels'
        }
      ],
      intrants: [
        'Système d\'irrigation goutte à goutte (tuyaux, goutteurs)',
        'Pompe à eau (électrique ou solaire)',
        'Réservoir de stockage d\'eau',
        'Compteur d\'eau ou système de mesure',
        'Matériel de maintenance (filtres, réparations)'
      ],
      ressources: [
        {
          type: 'PDF',
          titre: 'Guide d\'irrigation pour le Sahel',
          lien: '#'
        },
        {
          type: 'Vidéo',
          titre: 'Installation d\'un système goutte à goutte',
          lien: '#'
        },
        {
          type: 'PDF',
          titre: 'Calcul des besoins en eau des cultures',
          lien: '#'
        }
      ]
    },
    ravageurs: {
      title: 'Gestion des Ravageurs et Maladies',
      description: 'Méthodes de lutte intégrée contre les ravageurs et maladies des cultures',
      problemes: [
        'Infestation de ravageurs (criquets, chenilles, etc.)',
        'Maladies fongiques et bactériennes',
        'Perte de rendement due aux attaques',
        'Résistance aux pesticides'
      ],
      etapes: [
        {
          numero: 1,
          titre: 'Identification du ravageur/maladie',
          description: 'Observer et identifier précisément le type de ravageur ou de maladie affectant vos cultures'
        },
        {
          numero: 2,
          titre: 'Prévention',
          description: 'Mettre en place des mesures préventives : rotation des cultures, variétés résistantes, bonnes pratiques culturales'
        },
        {
          numero: 3,
          titre: 'Lutte biologique',
          description: 'Utiliser des méthodes naturelles : prédateurs naturels, pièges, plantes répulsives'
        },
        {
          numero: 4,
          titre: 'Traitement si nécessaire',
          description: 'Appliquer des traitements biologiques ou chimiques uniquement si nécessaire et selon les recommandations'
        }
      ],
      intrants: [
        'Pesticides biologiques (néem, pyrèthre)',
        'Pièges à phéromones',
        'Filets de protection',
        'Variétés de semences résistantes',
        'Équipement de pulvérisation'
      ],
      ressources: [
        {
          type: 'PDF',
          titre: 'Guide de lutte intégrée contre les ravageurs',
          lien: '#'
        },
        {
          type: 'Vidéo',
          titre: 'Préparation de pesticides biologiques',
          lien: '#'
        },
        {
          type: 'PDF',
          titre: 'Identification des ravageurs courants',
          lien: '#'
        }
      ]
    },
    sol: {
      title: 'Amélioration des Sols Dégradés',
      description: 'Techniques pour restaurer et améliorer la fertilité des sols dégradés',
      problemes: [
        'Sol appauvri en nutriments',
        'Érosion et perte de matière organique',
        'Compaction du sol',
        'Acidification ou alcalinisation excessive'
      ],
      etapes: [
        {
          numero: 1,
          titre: 'Analyse du sol',
          description: 'Effectuer une analyse de sol pour identifier les carences et problèmes spécifiques'
        },
        {
          numero: 2,
          titre: 'Apport de matière organique',
          description: 'Incorporer du compost, fumier ou engrais verts pour améliorer la structure et la fertilité'
        },
        {
          numero: 3,
          titre: 'Correction du pH',
          description: 'Appliquer de la chaux (si acide) ou du soufre (si alcalin) selon les besoins'
        },
        {
          numero: 4,
          titre: 'Rotation et couverture',
          description: 'Pratiquer la rotation des cultures et utiliser des cultures de couverture pour protéger le sol'
        }
      ],
      intrants: [
        'Compost ou fumier organique (5-10 tonnes/ha)',
        'Chaux agricole (si pH bas)',
        'Engrais verts (légumineuses)',
        'Paillis (paille, feuilles)',
        'Engrais minéraux équilibrés (NPK)'
      ],
      ressources: [
        {
          type: 'PDF',
          titre: 'Guide de restauration des sols',
          lien: '#'
        },
        {
          type: 'Vidéo',
          titre: 'Fabrication de compost',
          lien: '#'
        },
        {
          type: 'PDF',
          titre: 'Techniques de rotation des cultures',
          lien: '#'
        }
      ]
    },
    semences: {
      title: 'Amélioration des Semences',
      description: 'Sélection et gestion de semences de qualité pour améliorer les rendements',
      problemes: [
        'Semences de mauvaise qualité',
        'Faible taux de germination',
        'Variétés non adaptées au climat',
        'Manque de variétés résistantes'
      ],
      etapes: [
        {
          numero: 1,
          titre: 'Sélection de variétés adaptées',
          description: 'Choisir des variétés résistantes à la sécheresse et adaptées à votre région'
        },
        {
          numero: 2,
          titre: 'Test de germination',
          description: 'Tester la qualité des semences avant la plantation'
        },
        {
          numero: 3,
          titre: 'Conservation appropriée',
          description: 'Stocker les semences dans un endroit sec, frais et protégé des ravageurs'
        },
        {
          numero: 4,
          titre: 'Renouvellement régulier',
          description: 'Renouveler les semences tous les 2-3 ans pour maintenir la vigueur'
        }
      ],
      intrants: [
        'Semences certifiées de qualité',
        'Conteneurs de stockage hermétiques',
        'Désinfectants pour semences',
        'Matériel de test de germination',
        'Étiquettes pour identification'
      ],
      ressources: [
        {
          type: 'PDF',
          titre: 'Guide de sélection des semences',
          lien: '#'
        },
        {
          type: 'Vidéo',
          titre: 'Test de germination des semences',
          lien: '#'
        },
        {
          type: 'PDF',
          titre: 'Conservation des semences',
          lien: '#'
        }
      ]
    },
    fertilisation: {
      title: 'Fertilisation Optimale',
      description: 'Stratégies de fertilisation pour maximiser les rendements de manière durable',
      problemes: [
        'Carences en nutriments',
        'Surdosage d\'engrais',
        'Coûts élevés des intrants',
        'Impact environnemental'
      ],
      etapes: [
        {
          numero: 1,
          titre: 'Analyse des besoins',
          description: 'Déterminer les besoins en nutriments selon le type de culture et le stade de croissance'
        },
        {
          numero: 2,
          titre: 'Choix des engrais',
          description: 'Sélectionner entre engrais organiques, minéraux ou combinés selon disponibilité et coût'
        },
        {
          numero: 3,
          titre: 'Application au bon moment',
          description: 'Appliquer les engrais au moment optimal du cycle de croissance'
        },
        {
          numero: 4,
          titre: 'Suivi et ajustement',
          description: 'Surveiller la réponse des cultures et ajuster la fertilisation si nécessaire'
        }
      ],
      intrants: [
        'Engrais organiques (compost, fumier)',
        'Engrais minéraux (NPK, urée)',
        'Engrais foliaires',
        'Mycorhizes (champignons bénéfiques)',
        'Équipement d\'épandage'
      ],
      ressources: [
        {
          type: 'PDF',
          titre: 'Guide de fertilisation des cultures',
          lien: '#'
        },
        {
          type: 'Vidéo',
          titre: 'Application d\'engrais organiques',
          lien: '#'
        },
        {
          type: 'PDF',
          titre: 'Calcul des doses d\'engrais',
          lien: '#'
        }
      ]
    }
  };

  const problemKeys = Object.keys(solutions);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-blue to-primary-darkblue text-white py-12">
        <div className="section-container text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Think Tank Solutions</h1>
          <p className="text-lg text-gray-100 max-w-2xl mx-auto">
            Solutions pratiques et recommandations pour résoudre les problèmes agricoles courants
          </p>
        </div>
      </section>

      <section className="section-container py-16">
        {/* Section spéciale : Valorisation des Fientes */}
        <div className="mb-12">
          <div className="card bg-gradient-to-br from-primary-orange to-primary-lightorange text-white">
            <h2 className="text-2xl font-bold mb-3">
              🌱⚡ Valorisation des Fientes d'Élevage
            </h2>
            <p className="text-gray-100 mb-4">
              Solutions complètes pour transformer les fientes en fertilisant organique ou en biogaz
            </p>
            <button
              onClick={() => setShowFientesSolutions(!showFientesSolutions)}
              className="btn-secondary bg-white text-primary-orange hover:bg-gray-100"
            >
              {showFientesSolutions ? 'Masquer les solutions' : 'Voir les solutions détaillées'}
            </button>
          </div>
          
          {showFientesSolutions && (
            <div className="mt-6">
              <ThinkTankSolutions />
            </div>
          )}
        </div>

        {/* Liste des problèmes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {problemKeys.map((key) => {
            const solution = solutions[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedProblem(selectedProblem === key ? null : key)}
                className={`card text-left transition-all ${
                  selectedProblem === key
                    ? 'ring-4 ring-primary-orange bg-primary-orange/5'
                    : 'hover:shadow-lg'
                }`}
              >
                <h3 className="text-xl font-bold text-primary-green mb-2">
                  {solution.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{solution.description}</p>
                <div className="flex items-center text-primary-orange font-medium">
                  <span>Voir les solutions</span>
                  <svg
                    className={`w-5 h-5 ml-2 transition-transform ${
                      selectedProblem === key ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Détails de la solution sélectionnée */}
        {selectedProblem && (
          <div className="max-w-4xl mx-auto space-y-6">
            {(() => {
              const solution = solutions[selectedProblem];
              return (
                <>
                  {/* En-tête */}
                  <div className="card bg-gradient-to-br from-primary-green to-primary-lightgreen text-white">
                    <h2 className="text-3xl font-bold mb-2">{solution.title}</h2>
                    <p className="text-gray-100">{solution.description}</p>
                  </div>

                  {/* Problèmes courants */}
                  <div className="card">
                    <h3 className="text-2xl font-bold text-primary-green mb-4">
                      🔍 Problèmes Courants
                    </h3>
                    <ul className="space-y-2">
                      {solution.problemes.map((probleme, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary-orange mr-2">•</span>
                          <span className="text-gray-700">{probleme}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Étapes */}
                  <div className="card">
                    <h3 className="text-2xl font-bold text-primary-green mb-6">
                      📋 Étapes de Mise en Œuvre
                    </h3>
                    <div className="space-y-6">
                      {solution.etapes.map((etape) => (
                        <div key={etape.numero} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary-orange rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {etape.numero}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">
                              {etape.titre}
                            </h4>
                            <p className="text-gray-600">{etape.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Intrants recommandés */}
                  <div className="card bg-blue-50">
                    <h3 className="text-2xl font-bold text-primary-blue mb-4">
                      🛠️ Intrants Recommandés
                    </h3>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {solution.intrants.map((intrant, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary-blue mr-2">→</span>
                          <span className="text-gray-700">{intrant}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ressources */}
                  <div className="card bg-orange-50">
                    <h3 className="text-2xl font-bold text-primary-orange mb-4">
                      📚 Ressources Complémentaires
                    </h3>
                    <div className="space-y-3">
                      {solution.ressources.map((ressource, index) => (
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
                </>
              );
            })()}
          </div>
        )}

        {/* Message si aucune solution sélectionnée */}
        {!selectedProblem && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Sélectionnez un problème ci-dessus pour voir les solutions détaillées
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ThinkTank;

