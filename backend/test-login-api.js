/**
 * Script de test pour vérifier l'endpoint de login
 * Usage: node test-login-api.js
 * 
 * Note: Nécessite Node.js 18+ pour fetch natif
 * Pour Node.js < 18, installez node-fetch: npm install node-fetch
 */

// Utiliser fetch natif (Node.js 18+) ou node-fetch si disponible
let fetch;
try {
  // Essayer d'utiliser fetch natif (Node.js 18+)
  if (typeof globalThis.fetch !== 'undefined') {
    fetch = globalThis.fetch;
  } else {
    // Fallback vers node-fetch si disponible
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
  }
} catch (e) {
  console.error('❌ Erreur: fetch n\'est pas disponible. Installez node-fetch: npm install node-fetch');
  process.exit(1);
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login`;

const testCredentials = {
  email: 'admin@sahelagriconnect.org',
  password: 'admin123'
};

console.log('🧪 Test de l\'endpoint de login');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 URL: ${LOGIN_ENDPOINT}`);
console.log(`📧 Email: ${testCredentials.email}`);
console.log(`🔑 Password: ${testCredentials.password}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testLogin() {
  try {
    console.log('⏳ Envoi de la requête...\n');
    
    const response = await fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    });

    console.log(`📊 Statut HTTP: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    console.log('');

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCÈS - Connexion réussie!\n');
      console.log('📦 Réponse complète:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      
      if (data.token) {
        console.log('✅ Token JWT reçu:', data.token.substring(0, 50) + '...');
      }
      
      if (data.admin) {
        console.log('✅ Données admin:');
        console.log(`   - ID: ${data.admin.id}`);
        console.log(`   - Email: ${data.admin.email}`);
        console.log(`   - Name: ${data.admin.name}`);
        console.log(`   - Role: ${data.admin.role}`);
      } else if (data.user) {
        console.log('✅ Données user:');
        console.log(`   - ID: ${data.user.id}`);
        console.log(`   - Email: ${data.user.email}`);
        console.log(`   - Name: ${data.user.name}`);
        console.log(`   - Role: ${data.user.role}`);
      }
    } else {
      console.log('❌ ÉCHEC - Erreur de connexion\n');
      console.log('📦 Réponse d\'erreur:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      
      if (data.error) {
        console.log(`❌ Message d'erreur: ${data.error}`);
      }
      if (data.message) {
        console.log(`❌ Message: ${data.message}`);
      }
    }

    // Test de santé du serveur
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏥 Test de santé du serveur...\n');
    
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Health check:', JSON.stringify(healthData, null, 2));
    } catch (healthError) {
      console.log('❌ Health check échoué:', healthError.message);
    }

  } catch (error) {
    console.log('❌ ERREUR - Impossible de se connecter au serveur\n');
    console.log('📋 Détails de l\'erreur:');
    console.log(`   - Type: ${error.name}`);
    console.log(`   - Message: ${error.message}`);
    console.log(`   - Code: ${error.code || 'N/A'}`);
    console.log('');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 SOLUTION:');
      console.log('   1. Vérifiez que le backend est démarré: npm run dev (dans le dossier backend)');
      console.log('   2. Vérifiez que le port 3001 est disponible');
      console.log('   3. Vérifiez que MongoDB est connecté');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 SOLUTION:');
      console.log('   1. Vérifiez que l\'URL du backend est correcte');
      console.log('   2. En production, vérifiez que VITE_API_BASE_URL est configuré dans Vercel');
    }
    
    console.log('\n📝 Pour tester avec une URL différente:');
    console.log('   API_BASE_URL=https://votre-backend.onrender.com node test-login-api.js');
  }
}

testLogin();
