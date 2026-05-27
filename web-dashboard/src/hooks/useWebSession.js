import { useCallback, useEffect, useMemo, useState } from 'react';
import { PORTAL_META, clearAllPortalStorage, clearRoleStorage } from '../lib/portalConfig';

const SYNC_KEYS = [
  'sac_user_email',
  'sac_user_name',
  'sac_user_phone',
  'sac_coop_email',
  'sac_coop_name',
  'sac_coop_status',
  'afriyield_investor_email',
  'afriyield_investor_name',
  'gov_token',
  'gov_admin',
  'ngo_token',
  'ngo_admin',
];

function readSessions() {
  const farmerEmail = localStorage.getItem('sac_user_email');
  const coopEmail = localStorage.getItem('sac_coop_email');
  const investorEmail = localStorage.getItem('afriyield_investor_email');

  // Legacy bug: investor registration also set sac_user_* — prefer investor portal.
  if (
    investorEmail &&
    farmerEmail &&
    investorEmail.toLowerCase() === farmerEmail.toLowerCase()
  ) {
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    localStorage.removeItem('sac_user_phone');
  }
  const farmerEmailClean = localStorage.getItem('sac_user_email');
  const investorToken = sessionStorage.getItem('afriyield_token');
  const govToken = localStorage.getItem('gov_token');
  const ngoToken = localStorage.getItem('ngo_token');
  let ngoAdmin = null;
  let govOrgType = 'government';
  try {
    const admin = JSON.parse(localStorage.getItem('gov_admin') || '{}');
    if (admin?.orgType === 'ngo') govOrgType = 'ngo';
  } catch {
    /* ignore */
  }
  try {
    ngoAdmin = JSON.parse(localStorage.getItem('ngo_admin') || 'null');
  } catch {
    ngoAdmin = null;
  }

  const cooperative = Boolean(coopEmail);
  const farmer = Boolean(farmerEmailClean) && !cooperative;
  const investor = Boolean(investorEmail);
  const government = Boolean(govToken) && govOrgType !== 'ngo';
  // NGO portal uses dedicated storage (preferred). Legacy: gov_token with orgType ngo.
  const ngo = Boolean(ngoToken) || (Boolean(govToken) && govOrgType === 'ngo');

  const sessions = {
    farmer: farmer
      ? {
          active: true,
          email: farmerEmailClean,
          name: localStorage.getItem('sac_user_name') || '',
          portalPath: PORTAL_META.farmer.portalPath,
        }
      : null,
    cooperative: cooperative
      ? {
          active: true,
          email: coopEmail,
          name: localStorage.getItem('sac_coop_name') || '',
          status: localStorage.getItem('sac_coop_status') || 'pending_payment',
          portalPath: PORTAL_META.cooperative.portalPath,
        }
      : null,
    investor: investor
      ? {
          active: true,
          email: investorEmail,
          name: localStorage.getItem('afriyield_investor_name') || '',
          hasPortalSession: Boolean(investorToken),
          portalPath: PORTAL_META.investor.portalPath,
        }
      : null,
    government: government
      ? {
          active: true,
          portalPath: PORTAL_META.government.portalPath,
        }
      : null,
    ngo: ngo
      ? {
          active: true,
          portalPath: PORTAL_META.ngo.portalPath,
          name: ngoAdmin?.name || '',
        }
      : null,
    processor: null,
  };

  const activeRoles = Object.entries(sessions)
    .filter(([, v]) => v?.active)
    .map(([role]) => role);

  let primaryRole = null;
  if (investor && !farmer && !cooperative) primaryRole = 'investor';
  else if (cooperative) primaryRole = 'cooperative';
  else if (farmer) primaryRole = 'farmer';
  else if (government) primaryRole = 'government';
  else if (ngo) primaryRole = 'ngo';
  else if (investor) primaryRole = 'investor';

  return { sessions, activeRoles, primaryRole };
}

/**
 * Unified web session: farmer/co-op (sac_*), investor (afriyield_*), gov (gov_*).
 * Investors must NOT use sac_user_* — that was causing farmer dashboard confusion.
 */
export function useWebSession() {
  const [snapshot, setSnapshot] = useState(readSessions);

  const sync = useCallback(() => setSnapshot(readSessions()), []);

  useEffect(() => {
    sync();
    const onStorage = (e) => {
      if (!e || SYNC_KEYS.includes(e.key) || e.key?.startsWith('afriyield')) sync();
    };
    const onCustom = () => sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener('sac_user_updated', onCustom);
    window.addEventListener('web_session_updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sac_user_updated', onCustom);
      window.removeEventListener('web_session_updated', onCustom);
    };
  }, [sync]);

  const signOutRole = useCallback(
    (role) => {
      clearRoleStorage(role);
      if (role === 'farmer' || role === 'cooperative') {
        ['sac_user_email', 'sac_user_name', 'sac_user_phone', 'sac_coop_email', 'sac_coop_name', 'sac_coop_status'].forEach(
          (k) => localStorage.removeItem(k),
        );
      }
      sync();
      window.dispatchEvent(new Event('sac_user_updated'));
      window.dispatchEvent(new Event('web_session_updated'));
    },
    [sync],
  );

  const signOutAll = useCallback(() => {
    clearAllPortalStorage();
    sync();
    window.dispatchEvent(new Event('sac_user_updated'));
    window.dispatchEvent(new Event('web_session_updated'));
  }, [sync]);

  const registerInvestor = useCallback((email, name) => {
    localStorage.setItem('afriyield_investor_email', email);
    if (name) localStorage.setItem('afriyield_investor_name', name);
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    localStorage.removeItem('sac_user_phone');
    sync();
    window.dispatchEvent(new Event('web_session_updated'));
  }, [sync]);

  return useMemo(
    () => ({
      ...snapshot,
      hasAnySession: snapshot.activeRoles.length > 0,
      signOutRole,
      signOutAll,
      registerInvestor,
      refresh: sync,
    }),
    [snapshot, signOutRole, signOutAll, registerInvestor, sync],
  );
}
