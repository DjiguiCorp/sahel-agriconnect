// Configuration de l'API backend
// CRITICAL: Vercel must inject VITE_API_BASE_URL during build
// Force rebuild: Build timestamp updated to invalidate cache

// Build timestamp - Change this to force Vercel rebuild
const BUILD_VERSION = '2026-01-16-v2.0';

// Get API URL from environment variable
const ENV_API_URL = import.meta.env.VITE_API_BASE_URL;

// Detect if we're using placeholder or invalid URL
const isPlaceholder = ENV_API_URL?.includes('votre-backend') || ENV_API_URL?.includes('placeholder');
const isInvalidLocalhost = import.meta.env.PROD && (ENV_API_URL?.includes('localhost') || !ENV_API_URL);

// Fallback: Try to detect backend URL from common Render patterns
// This is a fallback if env var is not set correctly
const detectBackendURL = () => {
  // Common Render URL patterns for this project
  const possibleURLs = [
    'https://sahel-agriconnect.onrender.com',
    'https://sahel-agriconnect-backend.onrender.com',
  ];
  
  // Return first valid URL (in production, this should be overridden by env var)
  return possibleURLs[0];
};

// Determine final API URL
let API_BASE_URL;
if (isPlaceholder || isInvalidLocalhost) {
  // In production, if placeholder or localhost, use fallback detection
  if (import.meta.env.PROD) {
    API_BASE_URL = detectBackendURL();
    console.error('⚠️ WARNING: VITE_API_BASE_URL is not correctly set. Using fallback URL:', API_BASE_URL);
    console.error('⚠️ ACTION REQUIRED: Set VITE_API_BASE_URL in Vercel with your Render backend URL');
  } else {
    API_BASE_URL = 'http://localhost:3001';
  }
} else if (ENV_API_URL) {
  API_BASE_URL = ENV_API_URL.replace(/\/$/, ''); // Remove trailing slash
} else {
  API_BASE_URL = import.meta.env.PROD ? detectBackendURL() : 'http://localhost:3001';
}

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL;

// Critical error checks in production
if (import.meta.env.PROD) {
  if (API_BASE_URL.includes('localhost')) {
    console.error('❌ CRITICAL ERROR: API_BASE_URL points to localhost in production.');
    console.error('❌ Configure VITE_API_BASE_URL in Vercel → Settings → Environment Variables');
  }
  if (isPlaceholder) {
    console.error('❌ CRITICAL ERROR: VITE_API_BASE_URL contains placeholder "votre-backend".');
    console.error('❌ Set VITE_API_BASE_URL in Vercel with your actual Render backend URL.');
  }
}

// Debug logs only in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    BUILD_VERSION,
    ENV_API_URL,
    API_BASE_URL,
    WS_BASE_URL,
    isPlaceholder,
    isInvalidLocalhost,
  });
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

export { API_BASE_URL, WS_BASE_URL, BUILD_VERSION };
