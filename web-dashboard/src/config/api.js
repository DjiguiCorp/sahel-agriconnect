// Configuration de l'API backend
const BUILD_VERSION = '2026-03-27-v3.1';
const ENV_API_URL = import.meta.env.VITE_API_BASE_URL;
const isPlaceholder = ENV_API_URL?.includes('votre-backend') || ENV_API_URL?.includes('placeholder');
const isMissingProdApiUrl = import.meta.env.PROD && (!ENV_API_URL || isPlaceholder || ENV_API_URL.includes('localhost'));
/** En dev, sans VITE_API_BASE_URL : URLs relatives /api/* → proxy Vite vers le backend (évite CORS et erreurs de config). */
const devUseRelativeApi = import.meta.env.DEV && !String(ENV_API_URL ?? '').trim();
const isInvalidLocalhost = Boolean(ENV_API_URL?.includes('localhost') && import.meta.env.PROD);

const API_BASE_URL = isMissingProdApiUrl
  ? ''
  : devUseRelativeApi
    ? ''
    : (ENV_API_URL?.replace(/\/$/, '') || 'http://localhost:3001');

const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || API_BASE_URL || '').replace(/\/$/, '');

// Critical error checks in production
if (import.meta.env.PROD && isMissingProdApiUrl) {
  console.error('❌ CRITICAL ERROR: VITE_API_BASE_URL is missing or invalid in production.');
  console.error('❌ Set VITE_API_BASE_URL in Vercel with your actual Render backend URL and redeploy.');
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
  INVESTORS: {
    REGISTER: `${API_BASE_URL}/api/investors/register`,
    BASE: `${API_BASE_URL}/api/investors`,
    STATUS: (id) => `${API_BASE_URL}/api/investors/${id}/status`,
  },
  OPPORTUNITIES: {
    BASE: `${API_BASE_URL}/api/opportunities`,
    ALL: `${API_BASE_URL}/api/opportunities/all`,
    BY_ID: (id) => `${API_BASE_URL}/api/opportunities/${id}`,
    MEETING_REQUEST: (id) => `${API_BASE_URL}/api/opportunities/${id}/meeting-request`,
    MEETING_REQUESTS: `${API_BASE_URL}/api/opportunities/meeting-requests`,
  },
};

export { API_BASE_URL, WS_BASE_URL, BUILD_VERSION };
