import Joi from 'joi';

// Validation pour l'enregistrement d'un agriculteur
export const validateFarmer = (req, res, next) => {
  const schema = Joi.object({
    nom: Joi.string().required().trim().min(2).max(100),
    telephone: Joi.string().required().trim().min(8).max(20),
    latitude: Joi.string().required(),
    longitude: Joi.string().required(),
    superficie: Joi.number().required().min(0),
    cultures: Joi.array().items(Joi.string()).min(1).required(),
    region: Joi.string().required(),
    typeExploitation: Joi.string().valid('Familiale', 'Commerciale/Indépendante').required(),
    lienCooperative: Joi.string().valid('Oui', 'Non').default('Non'),
    nomCooperative: Joi.string().allow('').optional(),
    roleCooperative: Joi.string().allow('').optional(),
    soutienCooperative: Joi.array().items(Joi.string()).optional(),
    objectifsProduction: Joi.array().items(
      Joi.string().valid('Souveraineté alimentaire locale', 'Export régional', 'Export international')
    ).min(1).required(),
    connexionTransformation: Joi.boolean().default(false),
    elevage: Joi.array().items(Joi.string()).optional(),
    elevageAutres: Joi.string().allow('').optional(),
    fientesFertilisant: Joi.string().valid('Oui', 'Non', '').optional(),
    fientesBiogaz: Joi.string().valid('Oui', 'Non', '').optional(),
    accesElectricite: Joi.string().valid('Oui', 'Partiel', 'Non').required(),
    besoinSolaire: Joi.string().valid('Oui', 'Non', '').optional(),
    accesStockage: Joi.string().valid('Oui', 'Non').required(),
    besoinCollecte: Joi.string().valid('Oui', 'Non', '').optional(),
    investissementCooperative: Joi.string().valid('Oui', 'Non').default('Non'),
    qualityLevel: Joi.string().valid('local', 'regional', 'international', 'Non spécifié').optional(),
    diseaseDetection: Joi.object().optional(),
    landDetection: Joi.object().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Données invalides', 
      details: error.details.map(d => d.message) 
    });
  }
  next();
};

// Validation pour la mise à jour d'un agriculteur
export const validateFarmerUpdate = (req, res, next) => {
  const schema = Joi.object({
    statut: Joi.string().valid('Actif', 'En attente', 'Inactif').optional(),
    defis: Joi.array().items(Joi.string()).optional(),
    solutions: Joi.array().items(Joi.object({
      titre: Joi.string(),
      description: Joi.string(),
      details: Joi.array().items(Joi.string())
    })).optional()
  }).min(1);

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Données invalides', 
      details: error.details.map(d => d.message) 
    });
  }
  next();
};

// Validation pour l'inscription d'un processeur
export const validateProcessor = (req, res, next) => {
  const schema = Joi.object({
    nom: Joi.string().required().trim().min(2).max(100),
    telephone: Joi.string().required().trim().min(8).max(20),
    email: Joi.string().email().optional().allow(''),
    region: Joi.string().required(),
    latitude: Joi.string().required(),
    longitude: Joi.string().required(),
    capaciteMax: Joi.number().required().min(0),
    produitsTransformes: Joi.array().items(Joi.string()).min(1).required(),
    produitsAcceptes: Joi.array().items(Joi.string()).min(1).required(),
    genreProprietaire: Joi.string().valid('masculin', 'feminin', '').optional(),
    proprietaire: Joi.string().allow('').optional(),
    type: Joi.string().valid('Coopérative', 'Privé', 'Public').default('Privé'),
    statut: Joi.string().valid('Opérationnelle', 'En construction', 'Inactive').default('Opérationnelle'),
    partenaires: Joi.array().items(Joi.string()).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Données invalides', 
      details: error.details.map(d => d.message) 
    });
  }
  next();
};

// Validation pour une demande de certification
export const validateCertification = (req, res, next) => {
  const schema = Joi.object({
    farmerId: Joi.string().required(),
    produit: Joi.string().required().trim().min(2),
    quantite: Joi.string().required(),
    niveau: Joi.string().valid('local', 'regional', 'international').required(),
    notes: Joi.string().allow('').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Données invalides', 
      details: error.details.map(d => d.message) 
    });
  }
  next();
};

