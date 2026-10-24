/**
 * Role-specific portals — Sahel AgriConnect vs AfriYield Exchange.
 * Single source of truth for nav, sign-in hub, and redirects.
 * Government & NGO portals are admin-gated (not public).
 */

export const ROLES = {
  farmer: 'farmer',
  cooperative: 'cooperative',
  investor: 'investor',
  processor: 'processor',
};

export const PORTAL_META = {
  farmer: {
    brand: 'sahel',
    icon: '🌾',
    portalPath: '/my-dashboard',
    registerPath: '/inscription',
    signInPath: '/farmer-signin',
    labelFr: 'Portail agriculteur',
    labelEn: 'Farmer portal',
    descFr: 'Superficie, cultures, besoins et marketplace',
    descEn: 'Land, crops, needs and marketplace',
    storageKeys: ['sac_user_email', 'sac_user_name', 'sac_user_phone'],
  },
  cooperative: {
    brand: 'sahel',
    icon: '🤝',
    portalPath: '/cooperative-portal',
    registerPath: '/cooperative-registration',
    signInPath: '/cooperative-portal',
    labelFr: 'Portail coopérative',
    labelEn: 'Cooperative portal',
    descFr: 'Membres, équipements et paiement annuel',
    descEn: 'Members, equipment and annual licensing',
    storageKeys: ['sac_coop_email', 'sac_coop_name', 'sac_coop_status'],
  },
  investor: {
    brand: 'afriyield',
    icon: '💰',
    portalPath: '/afri-yield/portal',
    registerPath: '/afri-yield/register',
    signInPath: '/afri-yield/portal',
    labelFr: 'Portail AfriYield',
    labelEn: 'AfriYield portal',
    descFr: 'KYC, investissements et portefeuille',
    descEn: 'KYC, investments and portfolio',
    storageKeys: [
      'afriyield_investor_email',
      'afriyield_investor_name',
      'afriyield_token',
    ],
  },
  processor: {
    brand: 'sahel',
    icon: '🏭',
    portalPath: '/processor-portal',
    registerPath: '/transformation-registration',
    signInPath: '/processor-portal',
    labelFr: 'Centre de transformation',
    labelEn: 'Transformation center',
    descFr: 'Capacité, produits et certification',
    descEn: 'Capacity, products and certification',
    storageKeys: [],
  },
};

/** Legacy admin-gated portal paths (not in public ROLES / PORTAL_META). */
const LEGACY_ADMIN_PORTAL_KEYS = {
  government: ['gov_token', 'gov_admin', 'auth_token_government'],
  ngo: ['ngo_token', 'ngo_admin', 'auth_token_ngo', 'gov_token', 'gov_admin'],
};

export function clearRoleStorage(role) {
  const keys = PORTAL_META[role]?.storageKeys || LEGACY_ADMIN_PORTAL_KEYS[role] || [];
  keys.forEach((k) => {
    try {
      if (k === 'afriyield_token') sessionStorage.removeItem(k);
      else localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
  if (role === 'farmer') {
    ['auth_token_farmer', 'auth_role'].forEach((k) => localStorage.removeItem(k));
  }
  if (role === 'investor') {
    ['auth_token_investor', 'auth_role'].forEach((k) => localStorage.removeItem(k));
  }
}

export function clearAllPortalStorage() {
  Object.keys(PORTAL_META).forEach(clearRoleStorage);
  Object.keys(LEGACY_ADMIN_PORTAL_KEYS).forEach(clearRoleStorage);
  localStorage.removeItem('auth_role');
}
