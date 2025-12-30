import { useState } from 'react';
import { processorsByRegion } from '../data/cooperativesData';

const DiasporaPartnership = () => {
  const [activeTab, setActiveTab] = useState('register'); // 'register' ou 'matching'
  const [formData, setFormData] = useState({
    nomEntreprise: '',
    villeUS: '',
    typeBusiness: '',
    produitsImportes: [],
    investissement: false,
    montantInvestissement: '',
    message: ''
  });
  const [matches, setMatches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const businessTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'retail', label: 'Retail / Magasin' },
    { value: 'distributor', label: 'Distributeur' },
    { value: 'other', label: 'Autre' }
  ];

  const produitsSahel = [
    'Karité',
    'Sésame',
    'Cajou',
    'Mangue',
    'Arachide',
    'Coton',
    'Mil',
    'Sorgho',
    'Riz'
  ];

  // Flatten all transformation centers
  const allCenters = Object.values(processorsByRegion).flat();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductChange = (produit) => {
    setFormData(prev => ({
      ...prev,
      produitsImportes: prev.produitsImportes.includes(produit)
        ? prev.produitsImportes.filter(p => p !== produit)
        : [...prev.produitsImportes, produit]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulation de matching automatique
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trouver les centres de transformation correspondants
      const matchedCenters = allCenters.filter(center =>
        formData.produitsImportes.some(produit =>
          center.produitsAcceptes.includes(produit)
        )
      );

      setMatches(matchedCenters);
      setActiveTab('matching');
      alert('Inscription réussie! Voici les centres de transformation correspondants.');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary-green mb-2">
          Partenariat Diaspora
        </h2>
        <p className="text-gray-600">
          Connectez votre entreprise aux USA avec les centres de transformation du Sahel
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('register')}
            className={`py-4 px-6 border-b-2 font-medium transition-colors ${
              activeTab === 'register'
                ? 'border-primary-green text-primary-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Inscription Entreprise
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className={`py-4 px-6 border-b-2 font-medium transition-colors ${
              activeTab === 'matching'
                ? 'border-primary-green text-primary-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Centres Correspondants {matches.length > 0 && `(${matches.length})`}
          </button>
        </nav>
      </div>

      {/* Formulaire d'inscription */}
      {activeTab === 'register' && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-sm text-gray-700">
                <strong>🌍 Connectez-vous aux producteurs du Sahel :</strong> Inscrivez votre entreprise pour être mis en relation avec les centres de transformation locaux (karité, sésame, cajou, mangue) et représenter leurs produits aux USA.
              </p>
            </div>

            {/* Nom de l'entreprise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nomEntreprise"
                value={formData.nomEntreprise}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Ex: Sahel Foods USA"
              />
            </div>

            {/* Ville US */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville, État (USA) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="villeUS"
                value={formData.villeUS}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="Ex: New York, NY"
              />
            </div>

            {/* Type de business */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de business <span className="text-red-500">*</span>
              </label>
              <select
                name="typeBusiness"
                value={formData.typeBusiness}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              >
                <option value="">Sélectionnez un type</option>
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Produits importés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produits du Sahel importés <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {produitsSahel.map(produit => (
                  <label key={produit} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.produitsImportes.includes(produit)}
                      onChange={() => handleProductChange(produit)}
                      className="w-4 h-4 text-primary-orange rounded focus:ring-primary-orange"
                    />
                    <span className="text-sm text-gray-700">{produit}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Option investissement */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="investissement"
                  checked={formData.investissement}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-green rounded focus:ring-primary-green"
                />
                <span className="text-sm font-medium text-gray-700">
                  Je souhaite investir dans un centre de transformation (actionnariat)
                </span>
              </label>
              {formData.investissement && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant d'investissement estimé (USD)
                  </label>
                  <input
                    type="number"
                    name="montantInvestissement"
                    value={formData.montantInvestissement}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                    placeholder="Ex: 50000"
                  />
                </div>
              )}
            </div>

            {/* Message */}
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
                placeholder="Décrivez votre entreprise et vos besoins..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Traitement...' : 'Soumettre et trouver des partenaires'}
            </button>
          </form>
        </div>
      )}

      {/* Résultats de matching */}
      {activeTab === 'matching' && (
        <div>
          {matches.length > 0 ? (
            <div className="space-y-6">
              <div className="card bg-green-50 border-l-4 border-primary-green">
                <p className="text-sm text-gray-700">
                  <strong>✅ {matches.length} centre(s) de transformation trouvé(s) :</strong> Voici les centres qui correspondent à vos produits.
                </p>
              </div>
              {matches.map((center) => (
                <div key={center.id} className="card">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary-green mb-3">
                        {center.nom}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                          <span className="text-gray-600">Contact :</span>
                          <p className="font-medium">{center.contact}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4">
                      <button className="btn-primary">
                        Contacter ce centre
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600">
                Aucun centre de transformation trouvé. Inscrivez-vous d'abord pour trouver des partenaires.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiasporaPartnership;

