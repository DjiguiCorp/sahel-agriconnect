// Données mockées des coopératives par région
export const cooperativesByRegion = {
  // Mali
  'Sikasso, Mali': [
    {
      id: 1,
      nom: 'Coopérative Agricole de Sikasso',
      type: 'Coopérative',
      produits: ['Karité', 'Mangue', 'Cajou'],
      capacite: '50 tonnes/mois',
      contact: '+223 76 12 34 56'
    },
    {
      id: 2,
      nom: 'Union des Producteurs de Sikasso',
      type: 'Coopérative',
      produits: ['Sésame', 'Coton', 'Riz'],
      capacite: '30 tonnes/mois',
      contact: '+223 76 23 45 67'
    }
  ],
  'Gao, Mali': [
    {
      id: 3,
      nom: 'Coopérative du Nord Mali',
      type: 'Coopérative',
      produits: ['Mil', 'Sorgho', 'Arachide'],
      capacite: '25 tonnes/mois',
      contact: '+223 76 34 56 78'
    }
  ],
  'Mopti, Mali': [
    {
      id: 4,
      nom: 'Coopérative du Delta Central',
      type: 'Coopérative',
      produits: ['Riz', 'Mil', 'Sorgho'],
      capacite: '40 tonnes/mois',
      contact: '+223 76 45 67 89'
    }
  ],
  'Kayes, Mali': [
    {
      id: 5,
      nom: 'Coopérative de Kayes',
      type: 'Coopérative',
      produits: ['Coton', 'Arachide', 'Sésame'],
      capacite: '35 tonnes/mois',
      contact: '+223 76 56 78 90'
    }
  ],
  'Ségou, Mali': [
    {
      id: 6,
      nom: 'Coopérative de Ségou',
      type: 'Coopérative',
      produits: ['Riz', 'Coton', 'Arachide'],
      capacite: '45 tonnes/mois',
      contact: '+223 76 67 89 01'
    }
  ],
  'Bamako, Mali': [
    {
      id: 7,
      nom: 'Coopérative de Bamako',
      type: 'Coopérative',
      produits: ['Tous produits'],
      capacite: '100 tonnes/mois',
      contact: '+223 76 78 90 12'
    }
  ],
  // Burkina Faso
  'Bobo-Dioulasso, Burkina Faso': [
    {
      id: 8,
      nom: 'Coopérative de Bobo-Dioulasso',
      type: 'Coopérative',
      produits: ['Karité', 'Sésame', 'Cajou'],
      capacite: '60 tonnes/mois',
      contact: '+226 70 12 34 56'
    },
    {
      id: 9,
      nom: 'Union des Femmes Productrices de Bobo',
      type: 'Coopérative',
      produits: ['Beurre de karité', 'Huile de sésame'],
      capacite: '20 tonnes/mois',
      contact: '+226 70 23 45 67'
    }
  ],
  'Hauts-Bassins, Burkina Faso': [
    {
      id: 10,
      nom: 'Coopérative des Hauts-Bassins',
      type: 'Coopérative',
      produits: ['Coton', 'Sésame', 'Arachide'],
      capacite: '50 tonnes/mois',
      contact: '+226 70 34 56 78'
    }
  ],
  'Sahel, Burkina Faso': [
    {
      id: 11,
      nom: 'Coopérative du Sahel',
      type: 'Coopérative',
      produits: ['Mil', 'Sorgho', 'Arachide'],
      capacite: '30 tonnes/mois',
      contact: '+226 70 45 67 89'
    }
  ],
  'Ouagadougou, Burkina Faso': [
    {
      id: 12,
      nom: 'Coopérative Nationale de Ouagadougou',
      type: 'Coopérative',
      produits: ['Tous produits'],
      capacite: '120 tonnes/mois',
      contact: '+226 70 56 78 90'
    }
  ]
};

// Données mockées des centres de transformation et processeurs par région
export const processorsByRegion = {
  // Mali
  'Sikasso, Mali': [
    {
      id: 1,
      nom: 'Centre de Transformation de Karité - Sikasso',
      type: 'Centre de Transformation',
      proprietaire: 'Fatoumata Diallo',
      genre: 'Féminine',
      capacite: '15 tonnes/mois',
      produits: ['Beurre de karité', 'Huile de karité'],
      produitsAcceptes: ['Karité'],
      contact: '+223 76 12 34 56',
      localisation: 'Sikasso Centre'
    },
    {
      id: 2,
      nom: 'Unité de Transformation de Mangue',
      type: 'Processeur',
      proprietaire: 'Aminata Traoré',
      genre: 'Féminine',
      capacite: '10 tonnes/mois',
      produits: ['Jus de mangue', 'Confiture de mangue'],
      produitsAcceptes: ['Mangue'],
      contact: '+223 76 23 45 67',
      localisation: 'Sikasso Sud'
    }
  ],
  'Gao, Mali': [
    {
      id: 3,
      nom: 'Centre de Transformation Céréalière',
      type: 'Centre de Transformation',
      proprietaire: 'Mariam Ag Mohamed',
      genre: 'Féminine',
      capacite: '20 tonnes/mois',
      produits: ['Farine de mil', 'Farine de sorgho'],
      produitsAcceptes: ['Mil', 'Sorgho'],
      contact: '+223 76 34 56 78',
      localisation: 'Gao Centre'
    }
  ],
  'Mopti, Mali': [
    {
      id: 4,
      nom: 'Unité de Transformation du Riz',
      type: 'Processeur',
      proprietaire: 'Aissata Coulibaly',
      genre: 'Féminine',
      capacite: '25 tonnes/mois',
      produits: ['Riz décortiqué', 'Farine de riz'],
      produitsAcceptes: ['Riz'],
      contact: '+223 76 45 67 89',
      localisation: 'Mopti Centre'
    }
  ],
  'Kayes, Mali': [
    {
      id: 5,
      nom: 'Centre de Transformation de Coton',
      type: 'Centre de Transformation',
      proprietaire: 'Kadiatou Diallo',
      genre: 'Féminine',
      capacite: '30 tonnes/mois',
      produits: ['Huile de coton', 'Tourteau'],
      produitsAcceptes: ['Coton'],
      contact: '+223 76 56 78 90',
      localisation: 'Kayes Ouest'
    }
  ],
  'Ségou, Mali': [
    {
      id: 6,
      nom: 'Unité de Transformation Multi-Produits',
      type: 'Processeur',
      proprietaire: 'Mariam Diarra',
      genre: 'Féminine',
      capacite: '35 tonnes/mois',
      produits: ['Huile d\'arachide', 'Farine de riz'],
      produitsAcceptes: ['Arachide', 'Riz'],
      contact: '+223 76 67 89 01',
      localisation: 'Ségou Centre'
    }
  ],
  // Burkina Faso
  'Bobo-Dioulasso, Burkina Faso': [
    {
      id: 7,
      nom: 'Centre de Transformation de Karité - Bobo',
      type: 'Centre de Transformation',
      proprietaire: 'Aminata Ouédraogo',
      genre: 'Féminine',
      capacite: '20 tonnes/mois',
      produits: ['Beurre de karité', 'Savon au karité'],
      produitsAcceptes: ['Karité'],
      contact: '+226 70 12 34 56',
      localisation: 'Bobo-Dioulasso Centre'
    },
    {
      id: 8,
      nom: 'Unité de Transformation de Sésame',
      type: 'Processeur',
      proprietaire: 'Fatou Sanogo',
      genre: 'Féminine',
      capacite: '15 tonnes/mois',
      produits: ['Huile de sésame', 'Tahini'],
      produitsAcceptes: ['Sésame'],
      contact: '+226 70 23 45 67',
      localisation: 'Bobo-Dioulasso Est'
    }
  ],
  'Hauts-Bassins, Burkina Faso': [
    {
      id: 9,
      nom: 'Centre de Transformation de Coton',
      type: 'Centre de Transformation',
      proprietaire: 'Aissata Konaté',
      genre: 'Féminine',
      capacite: '25 tonnes/mois',
      produits: ['Huile de coton', 'Fibres de coton'],
      produitsAcceptes: ['Coton'],
      contact: '+226 70 34 56 78',
      localisation: 'Hauts-Bassins Centre'
    }
  ],
  'Sahel, Burkina Faso': [
    {
      id: 10,
      nom: 'Unité de Transformation Céréalière',
      type: 'Processeur',
      proprietaire: 'Mariam Traoré',
      genre: 'Féminine',
      capacite: '18 tonnes/mois',
      produits: ['Farine de mil', 'Farine de sorgho'],
      produitsAcceptes: ['Mil', 'Sorgho'],
      contact: '+226 70 45 67 89',
      localisation: 'Sahel Centre'
    }
  ],
  'Ouagadougou, Burkina Faso': [
    {
      id: 11,
      nom: 'Centre National de Transformation',
      type: 'Centre de Transformation',
      proprietaire: 'Fatoumata Ouédraogo',
      genre: 'Féminine',
      capacite: '50 tonnes/mois',
      produits: ['Tous produits transformés'],
      produitsAcceptes: ['Karité', 'Sésame', 'Cajou', 'Mangue', 'Arachide'],
      contact: '+226 70 56 78 90',
      localisation: 'Ouagadougou Centre'
    }
  ]
};

// Liste des régions disponibles
export const regions = [
  // Mali
  'Sikasso, Mali',
  'Gao, Mali',
  'Mopti, Mali',
  'Kayes, Mali',
  'Ségou, Mali',
  'Bamako, Mali',
  // Burkina Faso
  'Bobo-Dioulasso, Burkina Faso',
  'Hauts-Bassins, Burkina Faso',
  'Sahel, Burkina Faso',
  'Ouagadougou, Burkina Faso'
];

