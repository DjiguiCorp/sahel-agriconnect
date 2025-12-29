import { useState } from 'react';

const ReportsManagement = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [reports] = useState([
    {
      id: 1,
      cooperative: 'Coopérative Agricole de Sikasso',
      periode: 'Février 2024',
      type: 'Mensuel',
      defis: [
        '10 agriculteurs sans irrigation solaire',
        'Pertes post-récolte : 15%',
        'Manque de stockage : 5 agriculteurs'
      ],
      solutions: [
        'Installation de 3 systèmes d\'irrigation solaire prévus',
        'Formation sur techniques de conservation',
        'Construction d\'un entrepôt communautaire'
      ],
      statistiques: {
        agriculteurs: 45,
        production: '120 tonnes',
        ventes: '95 tonnes',
        pertes: '18 tonnes'
      }
    },
    {
      id: 2,
      cooperative: 'Union des Producteurs de Sikasso',
      periode: 'Trimestre 1 - 2024',
      type: 'Trimestriel',
      defis: [
        'Accès limité à l\'énergie',
        'Conservation des produits',
        'Transport vers marchés'
      ],
      solutions: [
        'Programme biogaz en cours',
        'Amélioration des techniques de séchage',
        'Partenariat transport avec coopérative voisine'
      ],
      statistiques: {
        agriculteurs: 32,
        production: '85 tonnes',
        ventes: '72 tonnes',
        pertes: '10 tonnes'
      }
    }
  ]);

  const [challenges] = useState([
    { type: 'Production', count: 5, description: 'Problèmes de rendement' },
    { type: 'Vente', count: 8, description: 'Accès aux marchés limité' },
    { type: 'Pertes', count: 12, description: 'Pertes post-récolte élevées' },
    { type: 'Irrigation', count: 10, description: 'Sans irrigation solaire' },
    { type: 'Stockage', count: 7, description: 'Manque de stockage' },
    { type: 'Énergie', count: 15, description: 'Accès limité à l\'électricité' },
    { type: 'Conservation', count: 9, description: 'Techniques de conservation insuffisantes' }
  ]);

  const filteredReports = selectedPeriod === 'all'
    ? reports
    : reports.filter(r => r.type.toLowerCase() === (selectedPeriod === 'monthly' ? 'mensuel' : 'trimestriel'));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Rapports Coopératives</h2>
        <p className="text-gray-600">Suivi mensuel et trimestriel des défis et solutions</p>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setSelectedPeriod('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'all'
              ? 'bg-primary-green text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setSelectedPeriod('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'monthly'
              ? 'bg-primary-green text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Mensuels
        </button>
        <button
          onClick={() => setSelectedPeriod('quarterly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'quarterly'
              ? 'bg-primary-green text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Trimestriels
        </button>
      </div>

      {/* Dashboard des défis */}
      <div className="card mb-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">📊 Dashboard : Défis des Agriculteurs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {challenges.map((challenge, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-l-4 border-red-500">
              <div className="text-3xl font-bold text-red-600 mb-1">{challenge.count}</div>
              <div className="text-sm font-semibold text-gray-900 mb-1">{challenge.type}</div>
              <div className="text-xs text-gray-600">{challenge.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des rapports */}
      <div className="space-y-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="card">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-green mb-2">{report.cooperative}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>📅 {report.periode}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {report.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-blue">{report.statistiques.agriculteurs}</div>
                <div className="text-sm text-gray-600">Agriculteurs</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{report.statistiques.production}</div>
                <div className="text-sm text-gray-600">Production</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-orange">{report.statistiques.ventes}</div>
                <div className="text-sm text-gray-600">Ventes</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{report.statistiques.pertes}</div>
                <div className="text-sm text-gray-600">Pertes</div>
              </div>
            </div>

            {/* Défis */}
            <div className="mb-4 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <h4 className="font-bold text-red-800 mb-3">⚠️ Défis Identifiés</h4>
              <ul className="space-y-2">
                {report.defis.map((defi, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="text-red-700">{defi}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-green-800 mb-3">💡 Solutions Proposées</h4>
              <ul className="space-y-2">
                {report.solutions.map((solution, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-green-700">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire de rapport */}
      <div className="card mt-6">
        <h3 className="text-2xl font-bold text-primary-green mb-4">📝 Nouveau Rapport Coopérative</h3>
        <form className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coopérative
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange">
                <option>Sélectionnez une coopérative</option>
                <option>Coopérative Agricole de Sikasso</option>
                <option>Union des Producteurs de Sikasso</option>
                <option>Coopérative de Bobo-Dioulasso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <input
                type="month"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Défis rencontrés
            </label>
            <textarea
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange"
              placeholder="Listez les défis principaux..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solutions mises en place
            </label>
            <textarea
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange"
              placeholder="Décrivez les solutions..."
            />
          </div>
          <button type="submit" className="btn-primary">
            Enregistrer le rapport
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportsManagement;

