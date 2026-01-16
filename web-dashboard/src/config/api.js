// Configuration de l'API backend
// En production, VITE_API_BASE_URL doit être défini dans Vercel
// CRITICAL FIX - Jan 16 2026 - Force rebuild to pick up env vars
// Adding timestamp to force Vite rebuild
const BUILD_TIMESTAMP = '2026-01-16T16:00:00Z';
console.log('🔧 Config API - Build Timestamp:', BUILD_TIMESTAMP);
console.log('🔧 Config API - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'NOT SET - using fallback');
console.log('🔧 Config API - VITE_WS_BASE_URL:', import.meta.env.VITE_WS_BASE_URL || 'NOT SET - using fallback');
console.log('🔧 Config API - All VITE_* env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

// CRITICAL: Check if we're using placeholder
if (import.meta.env.VITE_API_BASE_URL?.includes('votre-backend')) {
  console.error('❌ CRITICAL ERROR: VITE_API_BASE_URL contains placeholder "votre-backend"');
  console.error('❌ This means the environment variable is NOT correctly set in Vercel');
  console.error('✅ ACTION REQUIRED: Set VITE_API_BASE_URL in Vercel with your REAL Render URL');
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:3001';

console.log('🔧 Config API - Final API_BASE_URL:', API_BASE_URL);
console.log('🔧 Config API - Final WS_BASE_URL:', WS_BASE_URL);

// Log pour debug (uniquement en développement)
if (import.meta.env.DEV) {
  console.log('🔧 Configuration API:');
  console.log('  - API_BASE_URL:', API_BASE_URL);
  console.log('  - WS_BASE_URL:', WS_BASE_URL);
  console.log('  - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'NON DÉFINI');
}

// Avertissement si on utilise localhost en production
if (import.meta.env.PROD && API_BASE_URL.includes('localhost')) {
  console.error('❌ ERREUR CRITIQUE: API_BASE_URL pointe vers localhost en production!');
  console.error('❌ Cela empêche l\'accès depuis mobile.');
  console.error('✅ SOLUTION: Définissez VITE_API_BASE_URL dans Vercel → Settings → Environment Variables');
  console.error('✅ URL attendue: Votre URL Render (ex: https://sahel-agriconnect-backend-xxxx.onrender.com)');
  console.error('✅ Puis redéployez le frontend dans Vercel → Deployments → Redeploy');
}

export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
  },
  // Agriculteurs
  FARMERS: {
    BASE: `${API_BASE_URL}/api/farmers`,
    BY_ID: (id) => `${API_BASE_URL}/api/farmers/${id}`,
    STATS: `${API_BASE_URL}/api/farmers/stats/summary`,
  },
  // Processeurs
  PROCESSORS: {
    BASE: `${API_BASE_URL}/api/processors`,
    BY_REGION: (region) => `${API_BASE_URL}/api/processors?region=${region}`,
  },
  // Coopératives
  COOPERATIVES: {
    BASE: `${API_BASE_URL}/api/cooperatives`,
    BY_REGION: (region) => `${API_BASE_URL}/api/cooperatives?region=${region}`,
  },
  // Certifications
  CERTIFICATIONS: {
    BASE: `${API_BASE_URL}/api/certifications`,
    BY_ID: (id) => `${API_BASE_URL}/api/certifications/${id}`,
  },
  // Détection de maladies
  PLANT_DISEASE: `${API_BASE_URL}/api/detect-plant-disease`,
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`,
  // Centres agricoles
  CENTERS: {
    BASE: `${API_BASE_URL}/api/centers`,
    BY_ID: (id) => `${API_BASE_URL}/api/centers/${id}`,
    INVENTORY: (id) => `${API_BASE_URL}/api/centers/${id}/inventory`,
    STATS: (id) => `${API_BASE_URL}/api/centers/${id}/stats`,
  },
  // Avantages coopératifs
  PERKS: {
    BASE: `${API_BASE_URL}/api/perks`,
    REQUEST: `${API_BASE_URL}/api/perks/request`,
    BY_ID: (id) => `${API_BASE_URL}/api/perks/${id}`,
    APPROVE: (id) => `${API_BASE_URL}/api/perks/${id}/approve`,
    REJECT: (id) => `${API_BASE_URL}/api/perks/${id}/reject`,
    FULFILL: (id) => `${API_BASE_URL}/api/perks/${id}/fulfill`,
    STATS: `${API_BASE_URL}/api/perks/stats/usage`,
  },
  // Formations
  TRAININGS: {
    BASE: `${API_BASE_URL}/api/trainings`,
    SCHEDULE: `${API_BASE_URL}/api/trainings/schedule`,
    BY_ID: (id) => `${API_BASE_URL}/api/trainings/${id}`,
    BY_USER: (userId) => `${API_BASE_URL}/api/trainings/user/${userId}`,
    REGISTER: (id) => `${API_BASE_URL}/api/trainings/${id}/register`,
    ASSIGN_MENTOR: (id, sessionId) => `${API_BASE_URL}/api/trainings/${id}/sessions/${sessionId}/assign-mentor`,
    MENTORS: `${API_BASE_URL}/api/trainings/mentors/available`,
  },
  // Irrigation
  IRRIGATION: {
    BASE: `${API_BASE_URL}/api/irrigation`,
    ASSESS: `${API_BASE_URL}/api/irrigation/assess`,
    REGIONAL: `${API_BASE_URL}/api/irrigation/regional`,
    BY_ID: (id) => `${API_BASE_URL}/api/irrigation/${id}`,
    ASSESS_REQUEST: (id) => `${API_BASE_URL}/api/irrigation/${id}/assess`,
    UPGRADE_REQUEST: (id) => `${API_BASE_URL}/api/irrigation/${id}/upgrade-request`,
  },
  // Logistique
  LOGISTICS: {
    BASE: `${API_BASE_URL}/api/logistics`,
    SCHEDULE: `${API_BASE_URL}/api/logistics/schedule`,
    STATUS: (id) => `${API_BASE_URL}/api/logistics/status/${id}`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/api/logistics/${id}/update-status`,
    CAPACITY: `${API_BASE_URL}/api/logistics/capacity/planning`,
  },
  // Optimisation production
  OPTIMIZE: {
    PRODUCTION: `${API_BASE_URL}/api/optimize/production`,
    BY_ID: (id) => `${API_BASE_URL}/api/optimize/production/${id}`,
    REGIONAL: `${API_BASE_URL}/api/optimize/regional`,
    FEEDBACK: (id) => `${API_BASE_URL}/api/optimize/production/${id}/feedback`,
  },
};

export { API_BASE_URL, WS_BASE_URL };

