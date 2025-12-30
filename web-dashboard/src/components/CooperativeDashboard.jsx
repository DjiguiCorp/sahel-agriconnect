import { useState } from 'react';
import CooperativeFinanceForm from './CooperativeFinanceForm';
import { cooperativesByRegion } from '../data/cooperativesData';

const CooperativeDashboard = () => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [financeRequests, setFinanceRequests] = useState([]);

  // Flatten all cooperatives
  const allCooperatives = Object.values(cooperativesByRegion).flat();
  const regions = Object.keys(cooperativesByRegion);

  const filteredCooperatives = selectedRegion
    ? cooperativesByRegion[selectedRegion] || []
    : allCooperatives;

  const handleFinanceRequest = (request) => {
    setFinanceRequests(prev => [...prev, request]);
    setShowFinanceForm(false);
    setSelectedCooperative(null);
    alert('Demande de financement soumise avec succès! Vous serez contacté prochainement.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-primary-green mb-2">
            Coopératives - Alliance des États du Sahel (AES)
          </h2>
          <p className="text-gray-600">
            Liste des coopératives au Mali, Burkina Faso et Niger
          </p>
        </div>
        <button
          onClick={() => setShowFinanceForm(true)}
          className="mt-4 md:mt-0 btn-primary"
        >
          + Nouvelle demande de financement
        </button>
      </div>

      {/* Filtre par région */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrer par région
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
        >
          <option value="">Toutes les régions</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Liste des coopératives */}
      <div className="grid gap-6">
        {filteredCooperatives.map((coop) => (
          <div key={coop.id} className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-primary-green mb-3">
                  {coop.nom}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type :</span>
                    <p className="font-medium">{coop.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Produits :</span>
                    <p className="font-medium">{coop.produits.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Capacité :</span>
                    <p className="font-medium">{coop.capacite}</p>
                  </div>
                  {coop.contact && (
                    <div>
                      <span className="text-gray-600">Contact :</span>
                      <p className="font-medium">{coop.contact}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedCooperative(coop.id);
                    setShowFinanceForm(true);
                  }}
                  className="btn-secondary"
                >
                  Demander financement
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Demandes de financement récentes */}
      {financeRequests.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-primary-green mb-4">
            Mes demandes de financement
          </h3>
          <div className="space-y-4">
            {financeRequests.map((request, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-blue">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      Type: {request.type === 'equipment' ? 'Équipement' : 
                             request.type === 'diaspora' ? 'Partenariat diaspora' : 
                             'Expansion transformation'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Date: {new Date(request.date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Statut: <span className="font-medium text-primary-orange">{request.statut}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire de financement */}
      {showFinanceForm && (
        <CooperativeFinanceForm
          cooperativeId={selectedCooperative}
          onClose={() => {
            setShowFinanceForm(false);
            setSelectedCooperative(null);
          }}
          onSubmit={handleFinanceRequest}
        />
      )}
    </div>
  );
};

export default CooperativeDashboard;

