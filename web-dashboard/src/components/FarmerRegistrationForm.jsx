import { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { regions, cooperativesByRegion, processorsByRegion } from '../data/cooperativesData';
import PlantDiseaseAnalyzer from './PlantDiseaseAnalyzer';
import LandDetection from './LandDetection';
import { API_ENDPOINTS } from '../config/api';

const FarmerRegistrationForm = ({ onFarmerAdded }) => {
  const { emitFarmerRegistration } = useWebSocket();
  const [formData, setFormData] = useState({
    // Champs de base
    nom: '',
    telephone: '',
    latitude: '',
    longitude: '',
    superficie: '',
    cultures: [],
    // Nouveaux champs
    region: '',
    typeExploitation: '',
    lienCooperative: '',
    nomCooperative: '',
    roleCooperative: '',
    soutienCooperative: [],
    objectifsProduction: [],
    connexionTransformation: false,
    elevage: [],
    elevageAutres: '',
    fientesFertilisant: '',
    fientesBiogaz: '',
    accesElectricite: '',
    besoinSolaire: '',
    accesStockage: '',
    besoinCollecte: '',
    investissementCooperative: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [recommendedSolutions, setRecommendedSolutions] = useState(null);
  const [diseaseDetection, setDiseaseDetection] = useState(null);
  const [landDetection, setLandDetection] = useState(null);
  const [qualityLevel, setQualityLevel] = useState('');

  const availableCultures = [
    'Riz',
    'Mil',
    'Sorgho',
    'Maïs',
    'Fonio',
    'Sésame',
    'Coton',
    'Karité',
    'Mangue',
    'Cajou',
    'Autres'
  ];

  const typesElevage = ['Vaches', 'Poulets', 'Chèvres/moutons', 'Autres'];
  const objectifsProduction = [
    'Souveraineté alimentaire locale (priorité marché national)',
    'Export régional (Afrique)',
    'Export international (Europe, USA, etc.)'
  ];
  const soutiensCooperative = [
    'Intrants',
    'Formation',
    'Financement',
    'Logistique',
    'Commercialisation',
    'Autres'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Réinitialiser les champs conditionnels si nécessaire
    if (name === 'lienCooperative' && value === 'non') {
      setFormData(prev => ({
        ...prev,
        nomCooperative: '',
        roleCooperative: '',
        soutienCooperative: []
      }));
    }
    if (name === 'region') {
      // Réinitialiser la sélection de coopérative si la région change
      setFormData(prev => ({
        ...prev,
        nomCooperative: ''
      }));
    }
    if (name === 'accesElectricite' && value === 'oui') {
      setFormData(prev => ({ ...prev, besoinSolaire: '' }));
    }
    if (name === 'accesStockage' && value === 'oui') {
      setFormData(prev => ({ ...prev, besoinCollecte: '' }));
    }
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Obtenir les coopératives disponibles pour la région sélectionnée
  const availableCooperatives = formData.region ? (cooperativesByRegion[formData.region] || []) : [];
  
  // Obtenir les processeurs disponibles pour la région sélectionnée
  const availableProcessors = formData.region && formData.connexionTransformation 
    ? (processorsByRegion[formData.region] || []) 
    : [];

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

  const handleCultureChange = (culture) => {
    handleCheckboxChange('cultures', culture);
  };

  const generateSolutions = () => {
    const solutions = [];

    // Solutions pour élevage
    if (formData.elevage.length > 0) {
      solutions.push({
        type: 'elevage',
        titre: 'Valorisation des Fientes d\'Élevage',
        description: 'Vos fientes peuvent être transformées en fertilisant organique (compost) ou en biogaz pour l\'énergie.',
        details: [
          formData.fientesFertilisant === 'oui' 
            ? 'Vous utilisez déjà les fientes comme fertilisant - excellent !'
            : 'Considérez la transformation en compost pour améliorer votre sol.',
          formData.fientesBiogaz === 'oui'
            ? 'Vous utilisez déjà les fientes pour le biogaz - très bien !'
            : 'La production de biogaz peut fournir de l\'énergie pour votre exploitation.',
          'Contactez votre coopérative pour un programme pilote de valorisation des fientes.'
        ]
      });
    }

    // Solutions pour électricité
    if (formData.accesElectricite === 'non' || formData.accesElectricite === 'partiel') {
      if (formData.besoinSolaire === 'oui') {
        solutions.push({
          type: 'energie',
          titre: 'Solution Solaire',
          description: 'Solution solaire : mini-grids ou kits individuels disponibles via partenaires.',
          details: [
            'Mini-grids solaires pour communautés agricoles',
            'Kits solaires individuels pour exploitation',
            'Partenaires disponibles : AES, Djigui, et autres organisations',
            'Financement possible via programmes de développement'
          ]
        });
      }
    }

    // Solutions pour stockage
    if (formData.accesStockage === 'non') {
      if (formData.besoinCollecte === 'oui') {
        solutions.push({
          type: 'stockage',
          titre: 'Collecte Directe par Coopérative',
          description: 'Collecte directe par coopérative + transport vers pôles de transformation.',
          details: [
            'Organisation de collecte régulière par la coopérative',
            'Transport vers centres de transformation',
            'Réduction des pertes post-récolte',
            'Meilleure valorisation des produits'
          ]
        });
      }
    }

    return solutions;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation des champs de base
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom complet est requis';
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    if (!formData.latitude.trim()) {
      newErrors.latitude = 'La latitude est requise';
    } else if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      newErrors.latitude = 'Latitude invalide (entre -90 et 90)';
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = 'La longitude est requise';
    } else if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      newErrors.longitude = 'Longitude invalide (entre -180 et 180)';
    }

    if (!formData.superficie.trim()) {
      newErrors.superficie = 'La superficie est requise';
    } else if (isNaN(formData.superficie) || parseFloat(formData.superficie) <= 0) {
      newErrors.superficie = 'Superficie invalide (doit être un nombre positif)';
    }

    if (!formData.region) {
      newErrors.region = 'Sélectionnez votre région/zone';
    }

    if (formData.cultures.length === 0) {
      newErrors.cultures = 'Sélectionnez au moins une culture';
    }

    if (!formData.typeExploitation) {
      newErrors.typeExploitation = 'Sélectionnez un type d\'exploitation';
    }

    if (!formData.lienCooperative) {
      newErrors.lienCooperative = 'Indiquez si vous êtes lié à une coopérative';
    }

    if (formData.lienCooperative === 'oui') {
      if (!formData.nomCooperative.trim()) {
        newErrors.nomCooperative = 'Le nom de la coopérative est requis';
      }
      if (!formData.roleCooperative) {
        newErrors.roleCooperative = 'Indiquez votre rôle dans la coopérative';
      }
      if (formData.soutienCooperative.length === 0) {
        newErrors.soutienCooperative = 'Sélectionnez au moins un type de soutien';
      }
    }

    if (formData.objectifsProduction.length === 0) {
      newErrors.objectifsProduction = 'Sélectionnez au moins un objectif de production';
    }

    if (formData.elevage.includes('Autres') && !formData.elevageAutres.trim()) {
      newErrors.elevageAutres = 'Précisez le type d\'élevage';
    }

    if (!formData.accesElectricite) {
      newErrors.accesElectricite = 'Indiquez votre accès à l\'électricité';
    }

    if (!formData.accesStockage) {
      newErrors.accesStockage = 'Indiquez votre accès au stockage';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setRecommendedSolutions(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    // Générer les solutions recommandées
    const solutions = generateSolutions();
    setRecommendedSolutions(solutions);

    // Simulation de l'enregistrement
    const newFarmer = {
      id: Date.now(),
      nom: formData.nom,
      telephone: formData.telephone,
      localisation: `${formData.latitude}, ${formData.longitude}`,
      superficie: `${formData.superficie} ha`,
      cultures: formData.cultures.join(', '),
      typeExploitation: formData.typeExploitation,
      lienCooperative: formData.lienCooperative,
      nomCooperative: formData.nomCooperative || 'N/A',
      roleCooperative: formData.roleCooperative || 'N/A',
      soutienCooperative: formData.soutienCooperative.join(', ') || 'N/A',
      objectifsProduction: formData.objectifsProduction.join(', '),
      elevage: formData.elevage.join(', ') || 'Aucun',
      fientesFertilisant: formData.fientesFertilisant || 'N/A',
      fientesBiogaz: formData.fientesBiogaz || 'N/A',
      accesElectricite: formData.accesElectricite,
      besoinSolaire: formData.besoinSolaire || 'N/A',
      accesStockage: formData.accesStockage,
      besoinCollecte: formData.besoinCollecte || 'N/A',
      investissementCooperative: formData.investissementCooperative || 'Non',
      statut: 'En attente',
      region: formData.region || 'À déterminer',
      connexionTransformation: formData.connexionTransformation,
      diseaseDetection: diseaseDetection,
      landDetection: landDetection,
      qualityLevel: qualityLevel || 'Non spécifié',
      timestamp: new Date().toISOString()
    };

    console.log('Enregistrement de l\'agriculteur...', newFarmer);

    // Préparer les données pour l'API backend
    const apiData = {
      nom: formData.nom,
      telephone: formData.telephone,
      localisation: {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        texte: `${formData.latitude}, ${formData.longitude}`
      },
      superficie: parseFloat(formData.superficie),
      cultures: formData.cultures,
      region: formData.region,
      typeExploitation: formData.typeExploitation,
      lienCooperative: formData.lienCooperative,
      nomCooperative: formData.nomCooperative || undefined,
      roleCooperative: formData.roleCooperative || undefined,
      soutienCooperative: formData.soutienCooperative,
      objectifsProduction: formData.objectifsProduction,
      connexionTransformation: formData.connexionTransformation,
      elevage: formData.elevage,
      elevageAutres: formData.elevageAutres || undefined,
      fientesFertilisant: formData.fientesFertilisant || undefined,
      fientesBiogaz: formData.fientesBiogaz || undefined,
      accesElectricite: formData.accesElectricite,
      besoinSolaire: formData.besoinSolaire || undefined,
      accesStockage: formData.accesStockage,
      besoinCollecte: formData.besoinCollecte || undefined,
      investissementCooperative: formData.investissementCooperative || 'non',
      diseaseDetection: diseaseDetection || undefined,
      landDetection: landDetection || undefined,
      qualityLevel: qualityLevel || undefined
    };

    try {
      // Envoyer les données au backend
      const response = await fetch(API_ENDPOINTS.FARMERS.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'enregistrement');
      }

      const savedFarmer = await response.json();
      console.log('Agriculteur enregistré avec succès:', savedFarmer);

      // Émettre via WebSocket pour la synchronisation temps réel
      emitFarmerRegistration(savedFarmer);

      // Appeler la fonction callback si fournie
      if (onFarmerAdded) {
        onFarmerAdded(savedFarmer);
      }

      // Message de succès
      setSuccess(true);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setErrors({ submit: error.message || 'Erreur lors de l\'enregistrement. Veuillez réessayer.' });
      // En cas d'erreur, on peut quand même émettre via WebSocket en mode simulation
      emitFarmerRegistration(newFarmer);
      if (onFarmerAdded) {
        onFarmerAdded(newFarmer);
      }
      setSuccess(true); // Afficher le succès même en cas d'erreur réseau (mode dégradé)
    }

    // Réinitialiser le formulaire après 3 secondes (garder les solutions visibles)
    setTimeout(() => {
      setFormData({
        nom: '',
        telephone: '',
        latitude: '',
        longitude: '',
        superficie: '',
        cultures: [],
        region: '',
        typeExploitation: '',
        lienCooperative: '',
        nomCooperative: '',
        roleCooperative: '',
        soutienCooperative: [],
        objectifsProduction: [],
        connexionTransformation: false,
        elevage: [],
        elevageAutres: '',
        fientesFertilisant: '',
        fientesBiogaz: '',
        accesElectricite: '',
        besoinSolaire: '',
        accesStockage: '',
        besoinCollecte: ''
      });
      setSuccess(false);
      setRecommendedSolutions(null);
    }, 10000);
  };

  return (
    <div>
      <div className="card">
        <h2 className="text-2xl font-bold text-primary-green mb-6">
          Enregistrer un Nouvel Agriculteur
        </h2>

        {/* Message général Sans Prêt */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-blue to-primary-green text-white rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-bold mb-1">Partenariats Locaux Sans Prêt</h3>
              <p className="text-sm text-gray-100">
                Tous les partenariats et soutiens sont sans prêt : utilisation des ressources locales, 
                formation gratuite, équipement partagé via coopératives. Votre coopérative locale peut 
                vous accompagner directement.
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 rounded text-green-800">
            <p className="font-semibold">✅ Agriculteur enregistré avec succès !</p>
            <p className="text-sm mt-1">Consultez les solutions recommandées ci-dessous.</p>
          </div>
        )}

        {Object.keys(errors).length > 0 && !success && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded text-red-800">
            <p className="font-semibold">⚠️ Veuillez remplir tous les champs obligatoires.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Informations de Base */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-primary-green mb-4">Informations de Base</h3>
            
            {/* Nom complet */}
            <div className="mb-4">
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet <span className="text-red-500">*</span>
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
                placeholder="Ex: Amadou Diallo"
              />
              {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
            </div>

            {/* Téléphone */}
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

            {/* Localisation GPS */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation GPS <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-xs text-gray-600 mb-1">Latitude</label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                      errors.latitude ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 12.6392"
                  />
                  {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-xs text-gray-600 mb-1">Longitude</label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                      errors.longitude ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: -8.0029"
                  />
                  {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                💡 Vous pouvez obtenir les coordonnées GPS depuis votre téléphone ou une carte
              </p>
              
              {/* Détection de terre via satellite */}
              <LandDetection
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLandDetected={(result) => {
                  setLandDetection(result);
                  // Auto-remplir la superficie si détectée
                  if (result.totalArea && !formData.superficie) {
                    setFormData(prev => ({
                      ...prev,
                      superficie: result.totalArea
                    }));
                  }
                }}
              />
            </div>

            {/* Superficie */}
            <div className="mb-4">
              <label htmlFor="superficie" className="block text-sm font-medium text-gray-700 mb-2">
                Superficie du terrain (en hectares) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="superficie"
                name="superficie"
                value={formData.superficie}
                onChange={handleChange}
                min="0"
                step="0.1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                  errors.superficie ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: 12.5"
              />
              {errors.superficie && <p className="mt-1 text-sm text-red-600">{errors.superficie}</p>}
            </div>

            {/* Région / Zone */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                Région / Zone <span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez votre région/zone</option>
                <optgroup label="🇲🇱 Mali">
                  {regions.filter(r => r.includes('Mali')).map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </optgroup>
                <optgroup label="🇧🇫 Burkina Faso">
                  {regions.filter(r => r.includes('Burkina')).map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </optgroup>
              </select>
              {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
            </div>
          </div>

          {/* Section Coopératives Locales - Enhanced */}
          {formData.region && availableCooperatives.length > 0 && (
            <div className="border-b border-gray-200 pb-6">
              <div className="mb-6 p-5 bg-gradient-to-r from-primary-orange to-primary-lightorange rounded-lg text-white">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">🤝</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Coopératives Disponibles dans Votre Région</h3>
                    <p className="text-sm text-gray-100">
                      Rejoignez une coopérative locale et bénéficiez d'avantages immédiats sans prêt!
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {availableCooperatives.map((coop) => (
                  <div key={coop.id} className="p-5 border-2 border-primary-green rounded-lg hover:shadow-lg transition-all bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-bold text-lg text-primary-green">{coop.nom}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Disponible</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">🌾 Produits :</span> {coop.produits.join(', ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">📊 Capacité :</span> {coop.capacite}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          <span className="font-medium">📞 Contact :</span> {coop.contact}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">✅ Équipements partagés</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">✅ Formations gratuites</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">✅ Intrants réduits</span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">✅ Sans prêt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-sm text-green-800">
                  <strong>💡 Avantage :</strong> En rejoignant une coopérative, vous accédez automatiquement à tous ces avantages. 
                  Contactez directement la coopérative de votre choix pour vous inscrire!
                </p>
              </div>
            </div>
          )}

          {/* Section Type d'Exploitation */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-primary-green mb-4">Type d'Exploitation</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type d'exploitation <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="typeExploitation"
                    value="familiale"
                    checked={formData.typeExploitation === 'familiale'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Familiale</span>
                    <p className="text-sm text-gray-600">Production familiale, subsistance ou petit commerce</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="typeExploitation"
                    value="commerciale"
                    checked={formData.typeExploitation === 'commerciale'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Commerciale/Indépendante</span>
                    <p className="text-sm text-gray-600">Production à grande échelle, orientée marché</p>
                  </div>
                </label>
              </div>
              {errors.typeExploitation && <p className="mt-2 text-sm text-red-600">{errors.typeExploitation}</p>}
            </div>
          </div>

          {/* Section Coopérative - Enhanced with Incentives */}
          <div className="border-b border-gray-200 pb-6">
            <div className="mb-6 p-6 bg-gradient-to-r from-primary-green to-primary-lightgreen rounded-lg text-white">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🎁</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Rejoignez une Coopérative et Bénéficiez d'Avantages!</h3>
                  <p className="text-gray-100 mb-4">
                    Les membres de coopératives ont accès à des avantages exclusifs sans prêt :
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-sm">Équipements partagés (tracteurs, séchoirs)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-sm">Formations gratuites en techniques agricoles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-sm">Intrants et fertilisants à prix réduits</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-sm">Accès au financement coopératif</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-sm">Commercialisation facilitée</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-sm">Support logistique et transport</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Êtes-vous lié à une coopérative ? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.lienCooperative === 'oui'
                    ? 'border-primary-green bg-green-50 shadow-md'
                    : 'border-gray-300 hover:border-primary-orange hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="lienCooperative"
                    value="oui"
                    checked={formData.lienCooperative === 'oui'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-4xl mb-2">✅</span>
                  <span className="font-bold text-lg text-gray-900">Oui</span>
                  <span className="text-sm text-gray-600 mt-1 text-center">Je suis membre d'une coopérative</span>
                </label>
                <label className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.lienCooperative === 'non'
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="lienCooperative"
                    value="non"
                    checked={formData.lienCooperative === 'non'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-4xl mb-2">❌</span>
                  <span className="font-bold text-lg text-gray-900">Non</span>
                  <span className="text-sm text-gray-600 mt-1 text-center">Pas encore membre</span>
                </label>
              </div>
              {errors.lienCooperative && <p className="mt-2 text-sm text-red-600">{errors.lienCooperative}</p>}
            </div>

            {formData.lienCooperative === 'oui' && (
              <div className="space-y-4 mt-4 p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-primary-green rounded-lg shadow-md">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">🎉</span>
                  <h4 className="text-lg font-bold text-primary-green">Félicitations! Accédez aux Avantages Coopératifs</h4>
                </div>
                <div>
                  <label htmlFor="nomCooperative" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la coopérative <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nomCooperative"
                    name="nomCooperative"
                    value={formData.nomCooperative}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                      errors.nomCooperative ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Coopérative Agricole de Ségou"
                  />
                  {errors.nomCooperative && <p className="mt-1 text-sm text-red-600">{errors.nomCooperative}</p>}
                </div>

                <div>
                  <label htmlFor="roleCooperative" className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle dans la coopérative <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="roleCooperative"
                    name="roleCooperative"
                    value={formData.roleCooperative}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                      errors.roleCooperative ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez votre rôle</option>
                    <option value="membre">Membre</option>
                    <option value="dirigeant">Dirigeant</option>
                    <option value="tresorier">Trésorier</option>
                    <option value="secretaire">Secrétaire</option>
                    <option value="autre">Autre</option>
                  </select>
                  {errors.roleCooperative && <p className="mt-1 text-sm text-red-600">{errors.roleCooperative}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quels avantages souhaitez-vous recevoir de votre coopérative ? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {soutiensCooperative.map((soutien) => {
                      const icons = {
                        'Intrants': '🌱',
                        'Formation': '📚',
                        'Financement': '💰',
                        'Logistique': '🚚',
                        'Commercialisation': '📦',
                        'Autres': '➕'
                      };
                      return (
                        <label
                          key={soutien}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.soutienCooperative.includes(soutien)
                              ? 'bg-primary-green text-white border-primary-green shadow-md transform scale-105'
                              : 'bg-white border-gray-300 hover:border-primary-orange hover:shadow'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.soutienCooperative.includes(soutien)}
                            onChange={() => handleCheckboxChange('soutienCooperative', soutien)}
                            className="sr-only"
                          />
                          <span className="text-2xl">{icons[soutien] || '✓'}</span>
                          <span className="text-sm font-medium">{soutien}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.soutienCooperative && <p className="mt-2 text-sm text-red-600">{errors.soutienCooperative}</p>}
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Note :</strong> Tous ces avantages sont disponibles sans prêt. Votre coopérative vous accompagne avec des ressources partagées et des formations gratuites.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.lienCooperative === 'non' && (
              <div className="mt-4 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h4 className="font-bold text-primary-blue mb-2">Rejoignez une Coopérative!</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Les membres de coopératives bénéficient d'avantages exclusifs : équipements partagés, formations gratuites, 
                      intrants à prix réduits, financement coopératif, et bien plus encore - tout sans prêt!
                    </p>
                    <p className="text-sm font-medium text-primary-green">
                      Contactez une coopérative dans votre région pour en savoir plus.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Cultures */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-primary-green mb-4">Cultures</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultures cultivées <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableCultures.map((culture) => (
                  <label
                    key={culture}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.cultures.includes(culture)
                        ? 'bg-primary-green text-white border-primary-green'
                        : 'bg-white border-gray-300 hover:border-primary-orange'
                    } ${errors.cultures ? 'border-red-500' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.cultures.includes(culture)}
                      onChange={() => handleCultureChange(culture)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{culture}</span>
                  </label>
                ))}
              </div>
              {errors.cultures && <p className="mt-2 text-sm text-red-600">{errors.cultures}</p>}
            </div>

            {/* Analyse de maladie des plantes */}
            <div className="mt-4">
              <PlantDiseaseAnalyzer
                onDiseaseDetected={(result) => {
                  setDiseaseDetection(result);
                }}
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objectif de production <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {objectifsProduction.map((objectif) => (
                  <label
                    key={objectif}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.objectifsProduction.includes(objectif)
                        ? 'bg-primary-blue text-white border-primary-blue'
                        : 'bg-white border-gray-300 hover:border-primary-orange'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.objectifsProduction.includes(objectif)}
                      onChange={() => handleCheckboxChange('objectifsProduction', objectif)}
                      className="mt-1 w-4 h-4 text-primary-orange focus:ring-primary-orange"
                    />
                    <span className="text-sm">{objectif}</span>
                  </label>
                ))}
              </div>
              {errors.objectifsProduction && <p className="mt-2 text-sm text-red-600">{errors.objectifsProduction}</p>}
            </div>

            {/* Message sur l'inspection saisonnière */}
            {formData.objectifsProduction.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>📋 Inspection Saisonnière :</strong> Votre produit sera inspecté pour respecter les normes 
                    du marché choisi. Planifiez avec votre coopérative pour la date d'inspection proposée pour 
                    certification (3 niveaux qualité : local, régional, international).
                  </p>
                </div>

                {/* Sélection du niveau de qualité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de qualité cible
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label
                      className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        qualityLevel === 'local'
                          ? 'border-primary-green bg-primary-green/10'
                          : 'border-gray-300 hover:border-primary-orange'
                      }`}
                    >
                      <input
                        type="radio"
                        name="qualityLevel"
                        value="local"
                        checked={qualityLevel === 'local'}
                        onChange={(e) => setQualityLevel(e.target.value)}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-2">⭐</div>
                      <span className="font-semibold text-gray-900">Local</span>
                      <span className="text-xs text-gray-600 mt-1 text-center">
                        Marché national, normes de base
                      </span>
                    </label>
                    <label
                      className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        qualityLevel === 'regional'
                          ? 'border-primary-orange bg-primary-orange/10'
                          : 'border-gray-300 hover:border-primary-orange'
                      }`}
                    >
                      <input
                        type="radio"
                        name="qualityLevel"
                        value="regional"
                        checked={qualityLevel === 'regional'}
                        onChange={(e) => setQualityLevel(e.target.value)}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-2">⭐⭐</div>
                      <span className="font-semibold text-gray-900">Régional</span>
                      <span className="text-xs text-gray-600 mt-1 text-center">
                        Export Afrique, certification requise
                      </span>
                    </label>
                    <label
                      className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        qualityLevel === 'international'
                          ? 'border-primary-blue bg-primary-blue/10'
                          : 'border-gray-300 hover:border-primary-orange'
                      }`}
                    >
                      <input
                        type="radio"
                        name="qualityLevel"
                        value="international"
                        checked={qualityLevel === 'international'}
                        onChange={(e) => setQualityLevel(e.target.value)}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-2">⭐⭐⭐</div>
                      <span className="font-semibold text-gray-900">International</span>
                      <span className="text-xs text-gray-600 mt-1 text-center">
                        Export Europe/USA, traçabilité complète
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Connexion aux Centres de Transformation */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-primary-green mb-4">
              Connexion aux Centres de Transformation
            </h3>
            <div className="mb-4">
              <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  name="connexionTransformation"
                  checked={formData.connexionTransformation}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-primary-orange focus:ring-primary-orange"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Je souhaite être connecté à un centre de transformation local ou une entrepreneure féminine pour valorisation
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Accédez aux centres de transformation et entrepreneures féminines de votre région
                  </p>
                </div>
              </label>
            </div>

            {formData.connexionTransformation && formData.region && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                  <p className="text-sm text-purple-800">
                    <strong>💡 Sans prêt :</strong> Votre coopérative ou centre local peut vous accompagner sans prêt. 
                    Contactez-les directement via l'app.
                  </p>
                </div>

                {availableProcessors.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Centres de Transformation et Entrepreneures Féminines Disponibles
                    </h4>
                    {availableProcessors.map((processor) => (
                      <div key={processor.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-orange transition-colors bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-semibold text-primary-green">{processor.nom}</h5>
                              {processor.genre === 'Féminine' && (
                                <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded">
                                  👩 Entrepreneure Féminine
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Propriétaire :</span> {processor.proprietaire}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Type :</span> {processor.type}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Capacité :</span> {processor.capacite}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Produits transformés :</span> {processor.produits.join(', ')}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Produits acceptés :</span> {processor.produitsAcceptes.join(', ')}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Localisation :</span> {processor.localisation}
                            </p>
                            <p className="text-sm text-primary-blue mt-2">
                              <span className="font-medium">Contact :</span> {processor.contact}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Aucun centre de transformation disponible dans cette région pour le moment. 
                      Contactez votre coopérative pour plus d'informations.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Élevage */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-primary-green mb-4">Élevage Intégré</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types d'élevage (si applicable)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {typesElevage.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.elevage.includes(type)
                        ? 'bg-primary-orange text-white border-primary-orange'
                        : 'bg-white border-gray-300 hover:border-primary-orange'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.elevage.includes(type)}
                      onChange={() => handleCheckboxChange('elevage', type)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{type}</span>
                  </label>
                ))}
              </div>
              {formData.elevage.includes('Autres') && (
                <div className="mt-4">
                  <input
                    type="text"
                    name="elevageAutres"
                    value={formData.elevageAutres}
                    onChange={handleChange}
                    placeholder="Précisez le type d'élevage"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent ${
                      errors.elevageAutres ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.elevageAutres && <p className="mt-1 text-sm text-red-600">{errors.elevageAutres}</p>}
                </div>
              )}
            </div>

            {formData.elevage.length > 0 && (
              <div className="space-y-4 mt-4 p-4 bg-orange-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Utilisez-vous les fientes pour fertilisant organique ?
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="fientesFertilisant"
                        value="oui"
                        checked={formData.fientesFertilisant === 'oui'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                      />
                      <span>Oui</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="fientesFertilisant"
                        value="non"
                        checked={formData.fientesFertilisant === 'non'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                      />
                      <span>Non</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Utilisez-vous les fientes pour production d'énergie (biogaz) ?
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="fientesBiogaz"
                        value="oui"
                        checked={formData.fientesBiogaz === 'oui'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                      />
                      <span>Oui</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="fientesBiogaz"
                        value="non"
                        checked={formData.fientesBiogaz === 'non'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                      />
                      <span>Non</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Besoins Spécifiques */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-primary-green mb-4">Besoins Spécifiques</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Accès à l'électricité <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accesElectricite"
                    value="oui"
                    checked={formData.accesElectricite === 'oui'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <span>Oui</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accesElectricite"
                    value="partiel"
                    checked={formData.accesElectricite === 'partiel'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <span>Partiel</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accesElectricite"
                    value="non"
                    checked={formData.accesElectricite === 'non'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <span>Non</span>
                </label>
              </div>
              {errors.accesElectricite && <p className="mt-2 text-sm text-red-600">{errors.accesElectricite}</p>}
            </div>

            {(formData.accesElectricite === 'non' || formData.accesElectricite === 'partiel') && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Besoin d'une solution solaire ?
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="besoinSolaire"
                      value="oui"
                      checked={formData.besoinSolaire === 'oui'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                    />
                    <span>Oui</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="besoinSolaire"
                      value="non"
                      checked={formData.besoinSolaire === 'non'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                    />
                    <span>Non</span>
                  </label>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Accès au stockage sec/froid <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accesStockage"
                    value="oui"
                    checked={formData.accesStockage === 'oui'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <span>Oui</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accesStockage"
                    value="non"
                    checked={formData.accesStockage === 'non'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <span>Non</span>
                </label>
              </div>
              {errors.accesStockage && <p className="mt-2 text-sm text-red-600">{errors.accesStockage}</p>}
            </div>

            {formData.accesStockage === 'non' && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Besoin de collecte directe par coopérative ?
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="besoinCollecte"
                      value="oui"
                      checked={formData.besoinCollecte === 'oui'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                    />
                    <span>Oui</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="besoinCollecte"
                      value="non"
                      checked={formData.besoinCollecte === 'non'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                    />
                    <span>Non</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Section Décisions Producteur */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-primary-green mb-4">Décisions Producteur</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Souhaitez-vous investir dans une coopérative/processeur ? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="investissementCooperative"
                    value="oui"
                    checked={formData.investissementCooperative === 'oui'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Oui</span>
                    <p className="text-sm text-gray-600">Je souhaite investir dans une coopérative ou un processeur local</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="investissementCooperative"
                    value="non"
                    checked={formData.investissementCooperative === 'non'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-orange focus:ring-primary-orange"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Non</span>
                    <p className="text-sm text-gray-600">Pas d'investissement prévu pour le moment</p>
                  </div>
                </label>
              </div>
              {formData.investissementCooperative === 'oui' && (
                <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm text-green-800">
                    <strong>💡 Information :</strong> Votre intérêt pour l'investissement sera partagé avec les administrateurs 
                    qui pourront vous mettre en relation avec des coopératives ou processeurs locaux selon votre capacité.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full btn-primary"
            >
              Enregistrer l'agriculteur
            </button>
          </div>
        </form>
      </div>

      {/* Section Solutions Recommandées */}
      {(recommendedSolutions && recommendedSolutions.length > 0) || diseaseDetection || landDetection ? (
        <div className="mt-8 space-y-4">
          <h3 className="text-2xl font-bold text-primary-green mb-4">
            💡 Solutions Recommandées
          </h3>

          {/* Résultats de détection de maladie */}
          {diseaseDetection && (
            <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500">
              <h4 className="text-xl font-bold text-red-800 mb-2">
                🔍 Maladie Détectée : {diseaseDetection.disease}
              </h4>
              <p className="text-gray-700 mb-3">
                Confiance de détection : <strong>{(diseaseDetection.confidence * 100).toFixed(1)}%</strong>
              </p>
              <div className="mb-4">
                <h5 className="font-semibold text-gray-900 mb-2">Solutions Recommandées :</h5>
                <ul className="space-y-1">
                  {diseaseDetection.solutions.map((solution, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <span className="text-primary-orange mr-2">→</span>
                      <span className="text-gray-700">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {diseaseDetection.thinkTank && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-primary-blue mb-2">📚 Solutions Think Tank :</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="p-2 bg-blue-50 rounded">
                      <span className="font-medium text-primary-blue">🌱 Fertilisant :</span>
                      <p className="text-gray-700 mt-1">{diseaseDetection.thinkTank.fertilisant}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <span className="font-medium text-green-700">💧 Irrigation :</span>
                      <p className="text-gray-700 mt-1">{diseaseDetection.thinkTank.irrigation}</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <span className="font-medium text-orange-700">🔄 Rotation :</span>
                      <p className="text-gray-700 mt-1">{diseaseDetection.thinkTank.rotation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Résultats de détection de terre */}
          {landDetection && (
            <div className="card bg-gradient-to-br from-blue-50 to-green-50 border-l-4 border-primary-blue">
              <h4 className="text-xl font-bold text-primary-blue mb-2">
                🛰️ Détection de Terres via Satellite
              </h4>
              <p className="text-gray-700 mb-3">
                Date d'analyse : <strong>{landDetection.dateDetection}</strong>
              </p>
              <div className="mb-3">
                <h5 className="font-semibold text-gray-900 mb-2">Cultures Détectées :</h5>
                <div className="space-y-2">
                  {landDetection.detections.map((detection, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🌾</span>
                        <span className="font-medium">{detection.culture}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-primary-green">{detection.superficie}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(detection.confiance * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>Superficie totale détectée :</strong>{' '}
                  <span className="font-bold text-primary-green text-lg">{landDetection.totalArea} ha</span>
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  💡 Ces données sont basées sur une analyse satellite. Vérifiez et ajustez si nécessaire.
                </p>
              </div>
            </div>
          )}

          {/* Solutions générales */}
          {recommendedSolutions && recommendedSolutions.length > 0 && recommendedSolutions.map((solution, index) => (
            <div key={index} className="card bg-gradient-to-br from-primary-green/10 to-primary-blue/10 border-l-4 border-primary-orange">
              <h4 className="text-xl font-bold text-primary-green mb-2">
                {solution.titre}
              </h4>
              <p className="text-gray-700 mb-4">{solution.description}</p>
              <ul className="space-y-2">
                {solution.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-primary-orange mr-2">→</span>
                    <span className="text-gray-700">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default FarmerRegistrationForm;
