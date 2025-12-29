import { useState } from 'react';

const InputsManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Données mockées
  const [stock] = useState([
    {
      id: 1,
      type: 'Engrais',
      nom: 'NPK 15-15-15',
      quantite: '5000 kg',
      unite: 'kg',
      localisation: 'Entrepôt Central - Bamako',
      dateReception: '2024-01-15',
      dateExpiration: '2025-12-31'
    },
    {
      id: 2,
      type: 'Engrais',
      nom: 'Urée',
      quantite: '3000 kg',
      unite: 'kg',
      localisation: 'Entrepôt Central - Bamako',
      dateReception: '2024-01-20',
      dateExpiration: '2025-06-30'
    },
    {
      id: 3,
      type: 'Pesticide',
      nom: 'Pesticide Biologique (Néem)',
      quantite: '200 L',
      unite: 'L',
      localisation: 'Entrepôt Central - Bamako',
      dateReception: '2024-02-01',
      dateExpiration: '2025-12-31'
    },
    {
      id: 4,
      type: 'Semence',
      nom: 'Semences de Riz Certifiées',
      quantite: '1000 kg',
      unite: 'kg',
      localisation: 'Entrepôt Central - Bamako',
      dateReception: '2024-01-10',
      dateExpiration: '2024-12-31'
    },
    {
      id: 5,
      type: 'Fertilisant',
      nom: 'Compost de Fèces de Bétail',
      quantite: '20 tonnes',
      unite: 'tonnes',
      localisation: 'Unité de Compostage - Sikasso',
      dateReception: '2024-02-15',
      dateExpiration: 'N/A'
    }
  ]);

  const [distributions] = useState([
    {
      id: 1,
      cooperative: 'Coopérative Agricole de Sikasso',
      agriculteur: 'Amadou Diallo',
      intrant: 'NPK 15-15-15',
      quantite: '200 kg',
      date: '2024-02-20',
      statut: 'Distribué'
    },
    {
      id: 2,
      cooperative: 'Union des Producteurs de Sikasso',
      agriculteur: 'Fatou Traoré',
      intrant: 'Compost de Fèces de Bétail',
      quantite: '5 tonnes',
      date: '2024-02-22',
      statut: 'En attente'
    }
  ]);

  const categories = ['all', 'Engrais', 'Pesticide', 'Semence', 'Fertilisant'];
  const filteredStock = selectedCategory === 'all' 
    ? stock 
    : stock.filter(item => item.type === selectedCategory);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion des Intrants et Fertilisants</h2>
        <p className="text-gray-600">Stock central et distribution aux coopératives et agriculteurs</p>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary-green text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat === 'all' ? 'Tous' : cat}
          </button>
        ))}
      </div>

      {/* Stock Central */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">📦 Stock Central</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantité</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Localisation</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date Réception</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiration</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{item.nom}</td>
                  <td className="py-4 px-4 font-semibold text-primary-green">{item.quantite}</td>
                  <td className="py-4 px-4 text-gray-600">{item.localisation}</td>
                  <td className="py-4 px-4 text-gray-600">{item.dateReception}</td>
                  <td className="py-4 px-4 text-gray-600">{item.dateExpiration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">🚚 Distribution</h3>
        <div className="space-y-4">
          {distributions.map((dist) => (
            <div key={dist.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Coopérative :</span>
                  <p className="font-medium">{dist.cooperative}</p>
                </div>
                <div>
                  <span className="text-gray-600">Agriculteur :</span>
                  <p className="font-medium">{dist.agriculteur}</p>
                </div>
                <div>
                  <span className="text-gray-600">Intrant :</span>
                  <p className="font-medium">{dist.intrant}</p>
                  <p className="text-primary-green font-semibold">{dist.quantite}</p>
                </div>
                <div>
                  <span className="text-gray-600">Statut :</span>
                  <p className={`font-medium ${
                    dist.statut === 'Distribué' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {dist.statut}
                  </p>
                  <p className="text-xs text-gray-500">{dist.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommandations */}
      <div className="card bg-gradient-to-br from-green-50 to-blue-50">
        <h3 className="text-2xl font-bold text-primary-green mb-4">💡 Recommandations Automatiques</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-primary-green mb-2">🌱 Basées sur Type de Sol</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Sol argileux : Compost de fèces (5-10 t/ha)</li>
              <li>• Sol sableux : Matière organique régulière</li>
              <li>• pH bas : Chaux agricole + compost</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-primary-green mb-2">🌾 Basées sur Culture</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Riz : NPK + compost organique</li>
              <li>• Céréales : Engrais azoté + rotation</li>
              <li>• Légumineuses : Moins d'azote nécessaire</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-primary-green mb-2">🐄 Basées sur Élevage</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Fèces de vaches : Compost riche en azote</li>
              <li>• Fèces de poulets : Compost + biogaz</li>
              <li>• Transformation : Fertilisation + énergie</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputsManagement;

