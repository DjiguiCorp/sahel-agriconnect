import { useState } from 'react';

const SeasonalPlanning = () => {
  const [selectedSeason, setSelectedSeason] = useState('rainy');

  // Données mockées
  const [farmers] = useState([
    {
      id: 1,
      nom: 'Amadou Diallo',
      region: 'Sikasso, Mali',
      saison: 'rainy',
      cultures: ['Riz', 'Mil'],
      superficie: '12 ha',
      besoins: {
        intrants: 'Semences de riz (50 kg), Engrais NPK (200 kg)',
        fertilisants: 'Compost de fèces de bétail (5 tonnes)',
        pesticides: 'Pesticides biologiques (néem)'
      },
      sol: {
        type: 'Argileux',
        pH: 6.2,
        sante: 'Moyenne'
      }
    },
    {
      id: 2,
      nom: 'Fatou Traoré',
      region: 'Bobo-Dioulasso, Burkina Faso',
      saison: 'dry',
      cultures: ['Tomate', 'Oignon'],
      superficie: '8 ha',
      besoins: {
        intrants: 'Semences de tomate (2 kg), Système irrigation',
        fertilisants: 'Compost organique (3 tonnes)',
        pesticides: 'Fongicides préventifs'
      },
      sol: {
        type: 'Limoneux',
        pH: 6.8,
        sante: 'Bonne'
      }
    },
    {
      id: 3,
      nom: 'Ibrahim Konaté',
      region: 'Ségou, Mali',
      saison: 'rainy',
      cultures: ['Sorgho', 'Maïs'],
      superficie: '15 ha',
      besoins: {
        intrants: 'Semences de sorgho (30 kg), Engrais azoté',
        fertilisants: 'Fumier organique (8 tonnes)',
        pesticides: 'Traitement préventif'
      },
      sol: {
        type: 'Sableux',
        pH: 5.8,
        sante: 'Faible'
      }
    }
  ]);

  const getSoilRecommendations = (farmer) => {
    const recommendations = [];
    
    if (farmer.sol.sante === 'Faible' || farmer.sol.pH < 6) {
      recommendations.push('Apport urgent de compost de fèces de bétail (5-10 tonnes/ha)');
      recommendations.push('Correction du pH avec chaux agricole si nécessaire');
    }
    
    if (farmer.sol.type === 'Sableux') {
      recommendations.push('Apport régulier de matière organique pour améliorer la rétention d\'eau');
    }
    
    recommendations.push('Rotation des cultures recommandée (légumineuses après céréales)');
    recommendations.push('Utilisation d\'engrais verts pour améliorer la fertilité');
    
    return recommendations;
  };

  const filteredFarmers = farmers.filter(f => f.saison === selectedSeason);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Planification Saisonnière</h2>
        <p className="text-gray-600">Gestion des agriculteurs par saison de culture</p>
      </div>

      {/* Sélection de saison */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setSelectedSeason('rainy')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedSeason === 'rainy'
              ? 'bg-primary-blue text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🌧️ Saison des Pluies
        </button>
        <button
          onClick={() => setSelectedSeason('dry')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedSeason === 'dry'
              ? 'bg-primary-orange text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ☀️ Hors Saison
        </button>
      </div>

      {/* Liste des agriculteurs */}
      <div className="space-y-6">
        {filteredFarmers.map((farmer) => {
          const recommendations = getSoilRecommendations(farmer);
          
          return (
            <div key={farmer.id} className="card">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary-green mb-2">{farmer.nom}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Région :</span>
                      <p className="font-medium">{farmer.region}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Superficie :</span>
                      <p className="font-medium">{farmer.superficie}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Cultures prévues :</span>
                      <p className="font-medium">{farmer.cultures.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Besoins en intrants */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-primary-blue mb-3">📋 Besoins en Intrants</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Intrants :</span>
                    <p className="text-gray-700">{farmer.besoins.intrants}</p>
                  </div>
                  <div>
                    <span className="font-medium">Fertilisants :</span>
                    <p className="text-gray-700">{farmer.besoins.fertilisants}</p>
                  </div>
                  <div>
                    <span className="font-medium">Pesticides :</span>
                    <p className="text-gray-700">{farmer.besoins.pesticides}</p>
                  </div>
                </div>
              </div>

              {/* Rapport Santé des Sols */}
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-green-800 mb-3">🌱 Rapport : Santé des Sols et Nutriments</h4>
                <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type de sol :</span>
                    <p className="font-medium">{farmer.sol.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">pH :</span>
                    <p className="font-medium">{farmer.sol.pH}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Santé :</span>
                    <p className={`font-medium ${
                      farmer.sol.sante === 'Bonne' ? 'text-green-600' :
                      farmer.sol.sante === 'Moyenne' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {farmer.sol.sante}
                    </p>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-green-800 mb-2">Recommandations Automatiques :</h5>
                  <ul className="space-y-1">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="text-green-600 mr-2">→</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonalPlanning;

