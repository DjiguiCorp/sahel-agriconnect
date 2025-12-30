import { useState } from 'react';
import { processorsByRegion } from '../data/cooperativesData';

const TransformationCenters = () => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [certificationRequests, setCertificationRequests] = useState([]);

  // Flatten all centers
  const allCenters = Object.values(processorsByRegion).flat();
  const regions = Object.keys(processorsByRegion);

  const filteredCenters = selectedRegion
    ? processorsByRegion[selectedRegion] || []
    : allCenters;

  // Ajouter des statuts de certification aux centres
  const centersWithCertification = filteredCenters.map(center => ({
    ...center,
    certificationStatus: center.certificationStatus || 'Local',
    certificationRequested: certificationRequests.some(req => req.centerId === center.id)
  }));

  const handleCertificationRequest = (request) => {
    setCertificationRequests(prev => [...prev, request]);
    setShowCertificationForm(false);
    setSelectedCenter(null);
    alert('Demande de certification soumise! Vous serez contacté pour les inspections.');
  };

  const getCertificationBadge = (status) => {
    const badges = {
      'Local': 'bg-gray-100 text-gray-800',
      'Régional': 'bg-blue-100 text-blue-800',
      'International (FDA/USDA)': 'bg-green-100 text-green-800'
    };
    return badges[status] || badges['Local'];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-primary-green mb-2">
            Centres de Transformation Premium
          </h2>
          <p className="text-gray-600">
            Liste des centres de transformation avec certification Local / Régional / International (FDA/USDA)
          </p>
        </div>
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

      {/* Liste des centres */}
      <div className="grid gap-6">
        {centersWithCertification.map((center) => (
          <div key={center.id} className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-xl font-bold text-primary-green">
                    {center.nom}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCertificationBadge(center.certificationStatus)}`}>
                    {center.certificationStatus}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Propriétaire :</span>
                    <p className="font-medium">{center.proprietaire} ({center.genre})</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Localisation :</span>
                    <p className="font-medium">{center.localisation}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Capacité :</span>
                    <p className="font-medium">{center.capacite}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Produits :</span>
                    <p className="font-medium">{center.produits.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Produits acceptés :</span>
                    <p className="font-medium">{center.produitsAcceptes.join(', ')}</p>
                  </div>
                  {center.contact && (
                    <div>
                      <span className="text-gray-600">Contact :</span>
                      <p className="font-medium">{center.contact}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4 flex flex-col space-y-2">
                {center.certificationStatus !== 'International (FDA/USDA)' && (
                  <button
                    onClick={() => {
                      setSelectedCenter(center.id);
                      setShowCertificationForm(true);
                    }}
                    className="btn-secondary text-sm"
                  >
                    Demander certification FDA/USDA
                  </button>
                )}
                <button
                  onClick={() => {
                    // Action pour représenter aux USA
                    alert('Fonctionnalité de représentation aux USA - En développement');
                  }}
                  className="btn-primary text-sm"
                >
                  Représenter aux USA
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Demandes de certification */}
      {certificationRequests.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-primary-green mb-4">
            Mes demandes de certification
          </h3>
          <div className="space-y-4">
            {certificationRequests.map((request, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-blue">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      Centre: {allCenters.find(c => c.id === request.centerId)?.nom}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Date: {new Date(request.date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Statut: <span className="font-medium text-primary-orange">{request.statut}</span>
                    </p>
                    {request.inspectionDate && (
                      <p className="text-sm text-gray-600">
                        Inspection prévue: {new Date(request.inspectionDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire de demande de certification */}
      {showCertificationForm && (
        <CertificationRequestForm
          centerId={selectedCenter}
          centerName={allCenters.find(c => c.id === selectedCenter)?.nom}
          onClose={() => {
            setShowCertificationForm(false);
            setSelectedCenter(null);
          }}
          onSubmit={handleCertificationRequest}
        />
      )}
    </div>
  );
};

// Composant formulaire de demande de certification
const CertificationRequestForm = ({ centerId, centerName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'FDA/USDA',
    capaciteActuelle: '',
    produits: [],
    inspectionPrevue: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmit({
        ...formData,
        centerId,
        date: new Date().toISOString(),
        statut: 'En attente d\'inspection',
        inspectionDate: formData.inspectionPrevue || null
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary-green">
              Demande de Certification FDA/USDA
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-primary-blue rounded">
            <p className="text-sm text-gray-700">
              <strong>⭐ Certification Internationale :</strong> La certification FDA/USDA permet l'exportation vers les USA. Un processus d'inspection sera organisé pour valider les normes de qualité.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Centre de transformation
              </label>
              <input
                type="text"
                value={centerName}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité actuelle (tonnes/mois) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capaciteActuelle"
                value={formData.capaciteActuelle}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Ex: 50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'inspection souhaitée <span className="text-gray-500">(optionnel)</span>
              </label>
              <input
                type="date"
                name="inspectionPrevue"
                value={formData.inspectionPrevue}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message complémentaire
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Décrivez votre centre et vos besoins de certification..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-primary-darkgreen transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransformationCenters;

