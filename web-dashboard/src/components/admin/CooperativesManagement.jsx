import { useState } from 'react';

const CooperativesManagement = () => {
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [toolsUpdate, setToolsUpdate] = useState({});

  // Données mockées des coopératives
  const [cooperatives] = useState([
    {
      id: 1,
      nom: 'Coopérative Agricole de Sikasso',
      localisation: 'Sikasso, Mali',
      responsable: 'Amadou Diallo',
      membres: 45,
      statut: 'Fonctionnelle',
      outils: {
        tracteurs: 2,
        sechoirs: 3,
        stockage: 'Oui',
        irrigationSolaire: 'Partiel',
        transformation: 'Oui'
      }
    },
    {
      id: 2,
      nom: 'Union des Producteurs de Sikasso',
      localisation: 'Sikasso, Mali',
      responsable: 'Fatou Traoré',
      membres: 32,
      statut: 'Fonctionnelle',
      outils: {
        tracteurs: 1,
        sechoirs: 2,
        stockage: 'Oui',
        irrigationSolaire: 'Non',
        transformation: 'Non'
      }
    },
    {
      id: 3,
      nom: 'Coopérative de Bobo-Dioulasso',
      localisation: 'Bobo-Dioulasso, Burkina Faso',
      responsable: 'Ibrahim Konaté',
      membres: 58,
      statut: 'Fonctionnelle',
      outils: {
        tracteurs: 3,
        sechoirs: 4,
        stockage: 'Oui',
        irrigationSolaire: 'Oui',
        transformation: 'Oui'
      }
    }
  ]);

  const handleToolUpdate = (coopId, tool, value) => {
    setToolsUpdate(prev => ({
      ...prev,
      [coopId]: {
        ...prev[coopId],
        [tool]: value
      }
    }));
  };

  const saveToolsUpdate = (coopId) => {
    // Simulation de sauvegarde
    alert(`Outils mis à jour pour la coopérative ${coopId}`);
    setToolsUpdate(prev => {
      const updated = { ...prev };
      delete updated[coopId];
      return updated;
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary-green mb-2">Gestion des Coopératives</h2>
        <p className="text-gray-600">Suivi et gestion des coopératives locales</p>
      </div>

      <div className="grid gap-6">
        {cooperatives.map((coop) => (
          <div key={coop.id} className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-green mb-2">{coop.nom}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Localisation :</span>
                    <p className="font-medium">{coop.localisation}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Responsable :</span>
                    <p className="font-medium">{coop.responsable}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Membres :</span>
                    <p className="font-medium">{coop.membres} agriculteurs</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Statut :</span>
                    <p className="font-medium text-green-600">{coop.statut}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCooperative(selectedCooperative === coop.id ? null : coop.id)}
                className="mt-4 md:mt-0 btn-secondary"
              >
                {selectedCooperative === coop.id ? 'Masquer' : 'Vérifier outils'}
              </button>
            </div>

            {selectedCooperative === coop.id && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-primary-blue">
                <h4 className="font-bold text-primary-blue mb-4">Checklist des Outils Disponibles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={toolsUpdate[coop.id]?.tracteurs !== undefined 
                          ? toolsUpdate[coop.id].tracteurs 
                          : coop.outils.tracteurs > 0}
                        onChange={(e) => handleToolUpdate(coop.id, 'tracteurs', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Tracteurs ({coop.outils.tracteurs} disponible{coop.outils.tracteurs > 1 ? 's' : ''})</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={toolsUpdate[coop.id]?.sechoirs !== undefined 
                          ? toolsUpdate[coop.id].sechoirs 
                          : coop.outils.sechoirs > 0}
                        onChange={(e) => handleToolUpdate(coop.id, 'sechoirs', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Séchoirs ({coop.outils.sechoirs} disponible{coop.outils.sechoirs > 1 ? 's' : ''})</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={toolsUpdate[coop.id]?.stockage !== undefined 
                          ? toolsUpdate[coop.id].stockage 
                          : coop.outils.stockage === 'Oui'}
                        onChange={(e) => handleToolUpdate(coop.id, 'stockage', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Stockage sec/froid</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={toolsUpdate[coop.id]?.irrigationSolaire !== undefined 
                          ? toolsUpdate[coop.id].irrigationSolaire 
                          : coop.outils.irrigationSolaire === 'Oui'}
                        onChange={(e) => handleToolUpdate(coop.id, 'irrigationSolaire', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Irrigation solaire</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={toolsUpdate[coop.id]?.transformation !== undefined 
                          ? toolsUpdate[coop.id].transformation 
                          : coop.outils.transformation === 'Oui'}
                        onChange={(e) => handleToolUpdate(coop.id, 'transformation', e.target.checked)}
                        className="w-4 h-4 text-primary-orange"
                      />
                      <span>Équipement de transformation</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => saveToolsUpdate(coop.id)}
                  className="mt-4 btn-primary"
                >
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CooperativesManagement;

