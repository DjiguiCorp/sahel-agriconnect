import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const initAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sahel-agriconnect');
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@sahelagriconnect.org' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin déjà existant:', existingAdmin.email);
      process.exit(0);
    }

    // Créer l'admin par défaut
    const admin = new Admin({
      email: process.env.ADMIN_EMAIL || 'admin@sahelagriconnect.org',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: 'Administrateur Central',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin créé avec succès:');
    console.log('   Email:', admin.email);
    console.log('   Mot de passe:', process.env.ADMIN_PASSWORD || 'admin123');
    console.log('   ⚠️  Changez le mot de passe en production !');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

initAdmin();

