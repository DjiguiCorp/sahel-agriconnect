// Configuration de l'API backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:3001';

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
};

export { API_BASE_URL, WS_BASE_URL };

