import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cooperative from '../models/Cooperative.js';
import Processor from '../models/Processor.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sahel-agriconnect');
    console.log('✅ Connecté à MongoDB');

    // Coopératives
    const cooperatives = [
      {
        nom: 'Coopérative Agricole de Sikasso',
        localisation: 'Sikasso, Mali',
        region: 'Sikasso, Mali',
        responsable: 'Amadou Diallo',
        contact: 'contact@coopkoutiala.org',
        membres: 45,
        statut: 'Fonctionnelle',
        outils: {
          tracteurs: 2,
          sechoirs: 3,
          stockage: 'Oui',
          irrigationSolaire: 'Partiel',
          transformation: 'Oui'
        },
        produits: ['Coton', 'Maïs'],
        capacite: '500 agriculteurs'
      },
      {
        nom: 'Union des Producteurs de Sikasso',
        localisation: 'Sikasso, Mali',
        region: 'Sikasso, Mali',
        responsable: 'Fatou Traoré',
        contact: 'info@manguesikasso.org',
        membres: 32,
        statut: 'Fonctionnelle',
        outils: {
          tracteurs: 1,
          sechoirs: 2,
          stockage: 'Oui',
          irrigationSolaire: 'Non',
          transformation: 'Non'
        },
        produits: ['Mangue'],
        capacite: '200 agriculteurs'
      },
      {
        nom: 'Coopérative de Bobo-Dioulasso',
        localisation: 'Bobo-Dioulasso, Burkina Faso',
        region: 'Bobo-Dioulasso, Burkina Faso',
        responsable: 'Ibrahim Konaté',
        contact: 'contact@coopbobo.org',
        membres: 58,
        statut: 'Fonctionnelle',
        outils: {
          tracteurs: 3,
          sechoirs: 4,
          stockage: 'Oui',
          irrigationSolaire: 'Oui',
          transformation: 'Oui'
        },
        produits: ['Sésame', 'Coton'],
        capacite: '600 agriculteurs'
      }
    ];

    // Processeurs
    const processors = [
      {
        nom: 'Centre de Transformation de Karité "Djiguiya"',
        telephone: '+223 XX XX XX XX',
        email: 'fatou@djiguiya.org',
        region: 'Sikasso, Mali',
        latitude: '12.6392',
        longitude: '-8.0029',
        capaciteMax: 10,
        produitsTransformes: ['Beurre de karité'],
        produitsAcceptes: ['Karité'],
        genreProprietaire: 'feminin',
        proprietaire: 'Fatoumata Traoré',
        type: 'Coopérative',
        statut: 'Opérationnelle',
        partenaires: ['AES', 'Djigui']
      },
      {
        nom: 'Unité de Décorticage de Riz de Sikasso',
        telephone: '+223 XX XX XX XX',
        email: 'moussa@rizsikasso.com',
        region: 'Sikasso, Mali',
        latitude: '12.6392',
        longitude: '-8.0029',
        capaciteMax: 20,
        produitsTransformes: ['Riz décortiqué'],
        produitsAcceptes: ['Riz paddy'],
        genreProprietaire: 'masculin',
        proprietaire: 'Moussa Konaté',
        type: 'Privé',
        statut: 'Opérationnelle',
        partenaires: ['AES']
      }
    ];

    // Supprimer les données existantes (optionnel)
    await Cooperative.deleteMany({});
    await Processor.deleteMany({});

    // Insérer les données
    await Cooperative.insertMany(cooperatives);
    await Processor.insertMany(processors);

    console.log('✅ Données de test insérées avec succès');
    console.log(`   - ${cooperatives.length} coopératives`);
    console.log(`   - ${processors.length} processeurs`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

seedData();

