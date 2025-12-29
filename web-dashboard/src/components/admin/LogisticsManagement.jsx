import { useState } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { processorsByRegion } from '../../data/cooperativesData';

const LogisticsManagement = () => {
  const { farmers } = useWebSocket();
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Simuler des suggestions de connexion
  const generateSuggestions = () => {
    const suggestions = [];
    
    farmers.forEach(farmer => {
      if (farmer.region && processorsByRegion[farmer.region]) {
        processorsByRegion[farmer.region].forEach(processor => {
          // Vérifier si le produit du processeur correspond aux cultures de l'agriculteur
          const farmerCultures = farmer.cultures?.toLowerCase() || '';
          const processorProducts = processor.produitsAcceptes.map(p => p.toLowerCase()).join(' ');
          
          if (processorProducts.includes(farmerCultures.split(',')[0]?.toLowerCase() || '')) {
            suggestions.push({
              farmer: farmer.nom,
              farmerRegion: farmer.region,
              farmerProduct: farmerCultures.split(',')[0],
              processor: processor.nom,
              processorLocation: processor.localisation,
              processorCapacity: processor.capaciteMax,
              processorProducts: processor.produitsTransformes.join(', '),
              distance: '~50 km' // Simulé
            });
          }
        });
      }
    });
    
    return suggestions;
  };

  const suggestions = generateSuggestions();

  const storageFacilities = [
    {
      id: 1,
      nom: 'Entrepôt Central - Bamako',
      type: 'Stockage sec/froid',
      capacite: '500 tonnes',
      localisation: 'Bamako, Mali',
      statut: 'Disponible'
    },
    {
      id: 2,
      nom: 'Centre de Stockage - Sikasso',
      type: 'Stockage sec',
      capacite: '200 tonnes',
      localisation: 'Sikasso, Mali',
      statut: 'Disponible'
    },
    {
      id: 3,
      nom: 'Entrepôt - Bobo-Dioulasso',
      type: 'Stockage sec/froid',
      capacite: '300 tonnes',
      localisation: 'Bobo-Dioulasso, Burkina Faso',
      statut: 'Disponible'
    }
  ];

  const transportRoutes = [
    {
      id: 1,
      origine: 'Sikasso, Mali',
      destination: 'Bamako, Mali',
      distance: '375 km',
      type: 'Route',
      frequence: 'Hebdomadaire',
      produits: 'Riz, Karité, Mangue'
    },
    {
      id: 2,
      origine: 'Bobo-Dioulasso, Burkina Faso',
      destination: 'Ouagadougou, Burkina Faso',
      distance: '365 km',
      type: 'Route',
      frequence: 'Hebdomadaire',
      produits: 'Sésame, Coton'
    },
    {
      id: 3,
      origine: 'Bamako, Mali',
      destination: 'Port de Dakar, Sénégal',
      distance: '1200 km',
      type: 'Route + Port',
      frequence: 'Mensuelle',
      produits: 'Export international'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Logistique et Solutions</h2>
        <p className="text-gray-600">Cartographie des chaînes d'approvisionnement et suggestions de connexion</p>
      </div>

      {/* Suggestions de connexion */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">💡 Suggestions de Connexion</h3>
        <p className="text-gray-600 mb-4">
          Connexions automatiques entre agriculteurs et processeurs locaux basées sur les produits et la localisation
        </p>
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune suggestion disponible pour le moment</p>
          ) : (
            suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-primary-orange transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-primary-green mb-2">
                      {suggestion.farmer} → {suggestion.processor}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Agriculteur :</span>
                        <p className="font-medium">{suggestion.farmer}</p>
                        <p className="text-gray-500">{suggestion.farmerRegion}</p>
                        <p className="text-primary-green">Produit : {suggestion.farmerProduct}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Processeur :</span>
                        <p className="font-medium">{suggestion.processor}</p>
                        <p className="text-gray-500">{suggestion.processorLocation}</p>
                        <p className="text-primary-orange">Capacité : {suggestion.processorCapacity} tonnes/mois</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>💡 Suggestion :</strong> Connectez {suggestion.farmer} à {suggestion.processor} 
                        (capacité {suggestion.processorCapacity} tonnes/mois) pour transformation de {suggestion.farmerProduct}.
                        Distance estimée : {suggestion.distance}
                      </p>
                    </div>
                  </div>
                </div>
                <button className="mt-3 btn-primary text-sm">
                  Créer la connexion
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stockage */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">📦 Installations de Stockage</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {storageFacilities.map((facility) => (
            <div key={facility.id} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-bold text-primary-green mb-2">{facility.nom}</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">Type :</span> <span className="font-medium">{facility.type}</span></p>
                <p><span className="text-gray-600">Capacité :</span> <span className="font-medium">{facility.capacite}</span></p>
                <p><span className="text-gray-600">Localisation :</span> <span className="font-medium">{facility.localisation}</span></p>
                <p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    facility.statut === 'Disponible' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {facility.statut}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Routes de transport */}
      <div className="card">
        <h3 className="text-2xl font-bold text-primary-green mb-4">🚚 Chaînes Logistiques</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Origine</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Destination</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Distance</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fréquence</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Produits</th>
              </tr>
            </thead>
            <tbody>
              {transportRoutes.map((route) => (
                <tr key={route.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium">{route.origine}</td>
                  <td className="py-4 px-4 font-medium">{route.destination}</td>
                  <td className="py-4 px-4">{route.distance}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {route.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">{route.frequence}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{route.produits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogisticsManagement;

