import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LocationSelector from './LocationSelector';
import OtherInput from './OtherInput';
import { COUNTRY_CODES } from '../data/africanRegions';

const ProcessorRegistration = ({ onProcessorAdded }) => {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const PRODUIT_LABELS = {
    'Beurre de karité': isFr ? 'Beurre de karité' : 'Shea Butter',
    'Huile de karité': isFr ? 'Huile de karité' : 'Shea Oil',
    'Huile de sésame': isFr ? 'Huile de sésame' : 'Sesame Oil',
    'Farine de mil': isFr ? 'Farine de mil' : 'Millet Flour',
    'Farine de sorgho': isFr ? 'Farine de sorgho' : 'Sorghum Flour',
    'Farine de riz': isFr ? 'Farine de riz' : 'Rice Flour',
    'Riz décortiqué': isFr ? 'Riz décortiqué' : 'Husked Rice',
    'Jus de mangue': isFr ? 'Jus de mangue' : 'Mango Juice',
    'Confiture de mangue': isFr ? 'Confiture de mangue' : 'Mango Jam',
    'Huile de coton': isFr ? 'Huile de coton' : 'Cotton Oil',
    Tourteau: isFr ? 'Tourteau' : 'Oilseed Cake',
    Tahini: 'Tahini',
    "Huile d'arachide": isFr ? "Huile d'arachide" : 'Peanut Oil',
    Autres: isFr ? 'Autres ✏️' : 'Other ✏️',
  };

  const MATIERE_LABELS = {
    Karité: isFr ? 'Karité' : 'Shea',
    Sésame: isFr ? 'Sésame' : 'Sesame',
    Arachide: isFr ? 'Arachide' : 'Peanut',
    Mil: isFr ? 'Mil' : 'Millet',
    Sorgho: isFr ? 'Sorgho' : 'Sorghum',
    Riz: isFr ? 'Riz' : 'Rice',
    Mangue: isFr ? 'Mangue' : 'Mango',
    Cajou: isFr ? 'Cajou' : 'Cashew',
    Coton: isFr ? 'Coton' : 'Cotton',
    Autres: isFr ? 'Autres ✏️' : 'Other ✏️',
  };

  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    region: '',
    pays: '',
    zone: '',
    localisation: '',
    capaciteMax: '',
    produitsTransformes: [],
    produitsAcceptes: [],
    autresTypesProduits: '',
    autresProduitsAcceptes: '',
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [partnershipSuggestion, setPartnershipSuggestion] = useState(null);

  const produitsDisponibles = [
    'Beurre de karité',
    'Huile de karité',
    'Huile de sésame',
    'Tahini',
    'Huile d\'arachide',
    'Farine de mil',
    'Farine de sorgho',
    'Farine de riz',
    'Riz décortiqué',
    'Jus de mangue',
    'Confiture de mangue',
    'Huile de coton',
    'Tourteau',
    'Autres'
  ];

  const produitsAcceptes = [
    'Karité',
    'Sésame',
    'Arachide',
    'Mil',
    'Sorgho',
    'Riz',
    'Mangue',
    'Cajou',
    'Coton',
    'Autres'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const calculatePartnershipSuggestion = (capacite) => {
    const capaciteNum = parseFloat(capacite);
    if (!isNaN(capaciteNum) && capaciteNum > 0) {
      // Estimation : 1 agriculteur moyen produit ~2-3 tonnes/an
      // Pour une capacité mensuelle, on peut estimer le nombre d'agriculteurs
      const agriculteursEstimes = Math.floor(capaciteNum * 12 / 2.5); // Capacité annuelle / production moyenne par agriculteur
      return agriculteursEstimes;
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    }

    if (!formData.region) {
      newErrors.region = 'La région est requise';
    }

    if (!formData.localisation.trim()) {
      newErrors.localisation = 'La localisation est requise';
    }

    if (!formData.capaciteMax.trim()) {
      newErrors.capaciteMax = 'La capacité maximale est requise';
    } else if (isNaN(formData.capaciteMax) || parseFloat(formData.capaciteMax) <= 0) {
      newErrors.capaciteMax = 'Capacité invalide (doit être un nombre positif)';
    }

    if (formData.produitsTransformes.length === 0) {
      newErrors.produitsTransformes = 'Sélectionnez au moins un produit transformé';
    }

    if (formData.produitsAcceptes.length === 0) {
      newErrors.produitsAcceptes = 'Sélectionnez au moins un produit accepté';
    }

    if (formData.produitsTransformes.includes('Autres') && !formData.autresTypesProduits.trim()) {
      newErrors.autresTypesProduits = isFr ? 'Précisez les autres produits' : 'Please specify other products';
    }

    if (formData.produitsAcceptes.includes('Autres') && !formData.autresProduitsAcceptes.trim()) {
      newErrors.autresProduitsAcceptes = isFr
        ? 'Précisez les autres matières premières'
        : 'Please specify other raw materials';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(false);
    setPartnershipSuggestion(null);

    if (!validateForm()) {
      return;
    }

    // Calculer la suggestion de partenariat
    const agriculteursEstimes = calculatePartnershipSuggestion(formData.capaciteMax);
    if (agriculteursEstimes) {
      setPartnershipSuggestion({
        capacite: formData.capaciteMax,
        agriculteurs: agriculteursEstimes
      });
    }

    // Simulation de l'enregistrement
    const newProcessor = {
      id: Date.now(),
      nom: formData.nom,
      telephone: formData.telephone,
      email: formData.email || 'N/A',
      pays: formData.pays,
      country: formData.pays,
      countryCode: COUNTRY_CODES[formData.pays] || '',
      region: formData.region,
      localisation: formData.localisation,
      capaciteMax: `${formData.capaciteMax} tonnes/mois`,
      produitsTransformes: formData.produitsTransformes.join(', '),
      produitsAcceptes: formData.produitsAcceptes.join(', '),
      autresTypesProduits: formData.autresTypesProduits || undefined,
      autresProduitsAcceptes: formData.autresProduitsAcceptes || undefined,
      statut: 'En attente'
    };

    console.log('Processeur enregistré:', newProcessor);

    // Appeler la fonction callback si fournie
    if (onProcessorAdded) {
      onProcessorAdded(newProcessor);
    }

    // Message de succès
    setSuccess(true);

    // Réinitialiser le formulaire après 5 secondes
    setTimeout(() => {
      setFormData({
        nom: '',
        telephone: '',
        email: '',
        region: '',
        pays: '',
        zone: '',
        localisation: '',
        capaciteMax: '',
        produitsTransformes: [],
        produitsAcceptes: [],
        autresTypesProduits: '',
        autresProduitsAcceptes: '',
      });
      setSuccess(false);
      setPartnershipSuggestion(null);
    }, 10000);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-primary-green mb-6">
        Enregistrer un Centre de Transformation / Processeur
      </h2>

      {/* Message Sans Prêt */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-primary-blue rounded">
        <p className="text-sm text-gray-700">
          <strong>💡 Sans prêt :</strong> Tous les partenariats et soutiens sont sans prêt : 
          utilisation des ressources locales, formation gratuite, équipement partagé via coopératives.
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 rounded text-green-800">
          <p className="font-semibold">✅ Processeur enregistré avec succès !</p>
        </div>
      )}

      {Object.keys(errors).length > 0 && !success && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded text-red-800">
          <p className="font-semibold">⚠️ Veuillez remplir tous les champs obligatoires.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div>
          <h3 className="text-xl font-semibold text-primary-green mb-4">Informations de Base</h3>
          
          <div className="mb-4">
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du centre / Processeur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                errors.nom ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Centre de Transformation de Karité"
            />
            {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                errors.telephone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: +223 76 12 34 56"
            />
            {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (optionnel)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Ex: contact@centre-transformation.ml"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Région / Zone <span className="text-red-500">*</span>
            </label>
            <LocationSelector
              value={{ country: formData.pays || formData.country || '', region: formData.region || formData.zone || '' }}
              onChange={({ country, region }) => setFormData((p) => ({ ...p, pays: country, region, zone: region }))}
              required
              showDetectedBanner={true}
            />
            {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
          </div>

          <div>
            <label htmlFor="localisation" className="block text-sm font-medium text-gray-700 mb-2">
              Localisation précise <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="localisation"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                errors.localisation ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Sikasso Centre, Route de Bamako"
            />
            {errors.localisation && <p className="mt-1 text-sm text-red-600">{errors.localisation}</p>}
          </div>
        </div>

        {/* Capacité */}
        <div>
          <h3 className="text-xl font-semibold text-primary-green mb-4">
            {isFr ? 'Capacité de traitement' : 'Processing capacity'}
          </h3>
          
          <div>
            <label htmlFor="capaciteMax" className="block text-sm font-medium text-gray-700 mb-2">
              Capacité maximale (tonnes/mois) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="capaciteMax"
              name="capaciteMax"
              value={formData.capaciteMax}
              onChange={handleChange}
              min="0"
              step="0.1"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                errors.capaciteMax ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 15.5"
            />
            {errors.capaciteMax && <p className="mt-1 text-sm text-red-600">{errors.capaciteMax}</p>}
            {formData.capaciteMax && !isNaN(formData.capaciteMax) && parseFloat(formData.capaciteMax) > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                💡 Capacité annuelle estimée : <strong>{parseFloat(formData.capaciteMax) * 12} tonnes/an</strong>
              </p>
            )}
          </div>
        </div>

        {/* Produits */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isFr ? 'Produits fabriqués' : 'Products manufactured'} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {produitsDisponibles.map((produit) => (
                <label
                  key={produit}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.produitsTransformes.includes(produit)
                      ? 'bg-primary-green text-white border-primary-green'
                      : 'bg-white border-gray-300 hover:border-primary-orange'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.produitsTransformes.includes(produit)}
                    onChange={() => handleCheckboxChange('produitsTransformes', produit)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{PRODUIT_LABELS[produit] || produit}</span>
                </label>
              ))}
            </div>
            {(formData.produitsTransformes || []).includes('Autres') && (
              <OtherInput
                value={formData.autresTypesProduits}
                onChange={(val) => setFormData((p) => ({ ...p, autresTypesProduits: val }))}
                placeholder={
                  isFr
                    ? "Ex: Sirop de gingembre, Pâte d'arachide, Farine de manioc..."
                    : 'Ex: Ginger syrup, Peanut paste, Cassava flour...'
                }
              />
            )}
            {errors.autresTypesProduits && (
              <p className="mt-2 text-sm text-red-600">{errors.autresTypesProduits}</p>
            )}
            {errors.produitsTransformes && <p className="mt-2 text-sm text-red-600">{errors.produitsTransformes}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isFr ? 'Matières premières acceptées' : 'Accepted raw materials'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {produitsAcceptes.map((matiere) => (
                <label
                  key={matiere}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.produitsAcceptes.includes(matiere)
                      ? 'bg-primary-orange text-white border-primary-orange'
                      : 'bg-white border-gray-300 hover:border-primary-orange'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.produitsAcceptes.includes(matiere)}
                    onChange={() => handleCheckboxChange('produitsAcceptes', matiere)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{MATIERE_LABELS[matiere] || matiere}</span>
                </label>
              ))}
            </div>
            {formData.produitsAcceptes.includes('Autres') && (
              <OtherInput
                value={formData.autresProduitsAcceptes}
                onChange={(val) => setFormData((p) => ({ ...p, autresProduitsAcceptes: val }))}
                placeholder={
                  isFr ? 'Ex: Fonio, Niébé, Moringa, Baobab...' : 'Ex: Fonio, Cowpea, Moringa, Baobab...'
                }
              />
            )}
            {errors.autresProduitsAcceptes && (
              <p className="mt-2 text-sm text-red-600">{errors.autresProduitsAcceptes}</p>
            )}
            {errors.produitsAcceptes && <p className="mt-2 text-sm text-red-600">{errors.produitsAcceptes}</p>}
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full btn-primary"
          >
            {isFr ? 'Enregistrer le processeur' : 'Register processor'}
          </button>
        </div>
      </form>

      {/* Suggestion de partenariat */}
      {partnershipSuggestion && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <h4 className="font-bold text-green-800 mb-2">
            💡 Proposition de Partenariat
          </h4>
          <p className="text-green-700">
            Vous avez une capacité de <strong>{partnershipSuggestion.capacite} tonnes/mois</strong>. 
            Vous pouvez signer un partenariat avec environ <strong>{partnershipSuggestion.agriculteurs} agriculteurs locaux</strong> 
            pour transformation saisonnière.
          </p>
          <p className="text-sm text-green-600 mt-2">
            Contactez votre coopérative locale pour organiser les partenariats sans prêt.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessorRegistration;

