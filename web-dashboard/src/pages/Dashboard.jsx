import { useState, useEffect } from 'react';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import ProcessorRegistration from '../components/ProcessorRegistration';
import Modal from '../components/Modal';
import { API_ENDPOINTS } from '../config/api';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessorModalOpen, setIsProcessorModalOpen] = useState(false);
  const [showProcessorForm, setShowProcessorForm] = useState(false);
  
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les agriculteurs depuis le backend
  useEffect(() => {
    const loadFarmers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_ENDPOINTS.FARMERS.BASE);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des agriculteurs');
        }
        
        const data = await response.json();
        // Transformer les données pour l'affichage
        const formattedFarmers = data.farmers || data.map(farmer => ({
          id: farmer._id || farmer.id,
          nom: farmer.nom,
          cultures: Array.isArray(farmer.cultures) ? farmer.cultures.join(', ') : farmer.cultures,
          superficie: `${farmer.superficie || 0} ha`,
          statut: farmer.statut || 'Actif',
          region: farmer.region || 'Non spécifiée'
        }));
        
        setFarmers(formattedFarmers);
        setError(null);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
        // En cas d'erreur, utiliser des données mockées pour la démo
        setFarmers([
          {
            id: 1,
            nom: 'Amadou Diallo',
            cultures: 'Mil, Sorgho',
            superficie: '12 ha',
            statut: 'Actif',
            region: 'Ségou, Mali'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFarmers();
  }, []);

  const activeFarmers = farmers.filter(f => f.statut === 'Actif').length;
  const totalArea = farmers.reduce((sum, f) => {
    const area = parseFloat(f.superficie.replace(' ha', '')) || 0;
    return sum + area;
  }, 0);

  // Fonction pour ajouter un nouvel agriculteur
  const handleFarmerAdded = (newFarmer) => {
    // Formater le nouvel agriculteur pour l'affichage
    const formattedFarmer = {
      id: newFarmer._id || newFarmer.id,
      nom: newFarmer.nom,
      cultures: Array.isArray(newFarmer.cultures) ? newFarmer.cultures.join(', ') : newFarmer.cultures,
      superficie: `${newFarmer.superficie || 0} ha`,
      statut: newFarmer.statut || 'Actif',
      region: newFarmer.region || 'Non spécifiée'
    };
    setFarmers([...farmers, formattedFarmer]);
    setIsModalOpen(false); // Fermer la modal après l'ajout
  };

  // Fonction pour ajouter un nouveau processeur
  const handleProcessorAdded = (newProcessor) => {
    console.log('Nouveau processeur ajouté:', newProcessor);
    setIsProcessorModalOpen(false);
    setShowProcessorForm(false);
    // Ici vous pouvez ajouter le processeur à une liste si nécessaire
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-green to-primary-lightgreen text-white py-12">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('dashboard.title')}</h1>
          <p className="text-lg text-gray-100">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </section>

      {/* Statistiques */}
      <section className="section-container py-8">
        {/* Boutons pour ouvrir les formulaires */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{t('dashboard.registerFarmer')}</span>
          </button>
          <button
            onClick={() => {
              setShowProcessorForm(true);
              setIsProcessorModalOpen(true);
            }}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{t('dashboard.registerProcessor')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-green to-primary-lightgreen text-white">
            <div className="text-3xl font-bold mb-2">{farmers.length}</div>
            <div className="text-gray-100">{t('dashboard.stats.registered')}</div>
          </div>
          <div className="card bg-gradient-to-br from-primary-orange to-primary-lightorange text-white">
            <div className="text-3xl font-bold mb-2">{activeFarmers}</div>
            <div className="text-gray-100">{t('dashboard.stats.active')}</div>
          </div>
          <div className="card bg-gradient-to-br from-primary-blue to-primary-darkblue text-white">
            <div className="text-3xl font-bold mb-2">{totalArea} ha</div>
            <div className="text-gray-100">{t('dashboard.stats.totalArea')}</div>
          </div>
        </div>

        {/* Tableau des agriculteurs */}
        <div className="card">
          <h2 className="text-2xl font-bold text-primary-green mb-6">
            {t('dashboard.farmersList')}
          </h2>
          
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('dashboard.loading')}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ {t('dashboard.error')} - {error}
              </p>
            </div>
          )}
          
          {!isLoading && farmers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('dashboard.empty')}</p>
            </div>
          )}
          
          {!isLoading && farmers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('dashboard.columns.name')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('dashboard.columns.crops')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('dashboard.columns.area')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('dashboard.columns.region')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('dashboard.columns.status')}</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr key={farmer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{farmer.nom}</td>
                    <td className="py-4 px-4 text-gray-600">{farmer.cultures}</td>
                    <td className="py-4 px-4 text-gray-600">{farmer.superficie}</td>
                    <td className="py-4 px-4 text-gray-600">{farmer.region}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          farmer.statut === 'Actif' || farmer.statut === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {farmer.statut === 'Actif' ? t('dashboard.status.active') : t('dashboard.status.pending')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-primary-blue rounded">
          <p className="text-gray-700 text-sm">
            <strong>{t('common.info')} :</strong> {t('dashboard.note')}
          </p>
        </div>
      </section>

      {/* Modal pour le formulaire d'enregistrement d'agriculteur */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('farmerRegistration.title')}
      >
        <FarmerRegistrationForm onFarmerAdded={handleFarmerAdded} />
      </Modal>

      {/* Modal pour le formulaire d'enregistrement de processeur */}
      <Modal
        isOpen={isProcessorModalOpen}
        onClose={() => {
          setIsProcessorModalOpen(false);
          setShowProcessorForm(false);
        }}
        title={t('farmerRegistration.title') + ' / Processeur'}
      >
        <ProcessorRegistration onProcessorAdded={handleProcessorAdded} />
      </Modal>
    </div>
  );
};

export default Dashboard;

