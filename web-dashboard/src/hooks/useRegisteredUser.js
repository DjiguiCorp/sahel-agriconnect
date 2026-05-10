import { useEffect, useState } from 'react';

export function useRegisteredUser() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userType, setUserType] = useState(null); // 'farmer' | 'cooperative'
  const [coopStatus, setCoopStatus] = useState(null); // 'pending_payment' | 'active'

  useEffect(() => {
    const sync = () => {
      const farmerEmail = localStorage.getItem('sac_user_email');
      const coopEmail = localStorage.getItem('sac_coop_email');

      if (coopEmail) {
        setIsRegistered(true);
        setUserEmail(coopEmail);
        setUserName(localStorage.getItem('sac_coop_name'));
        setUserType('cooperative');
        setCoopStatus(localStorage.getItem('sac_coop_status') || 'pending_payment');
      } else if (farmerEmail) {
        setIsRegistered(true);
        setUserEmail(farmerEmail);
        setUserName(localStorage.getItem('sac_user_name'));
        setUserType('farmer');
        setCoopStatus(null);
      } else {
        setIsRegistered(false);
        setUserEmail(null);
        setUserName(null);
        setUserType(null);
        setCoopStatus(null);
      }
    };

    sync();
    const onStorage = (e) => {
      if (
        !e ||
        ['sac_user_email', 'sac_user_name', 'sac_coop_email', 'sac_coop_name', 'sac_coop_status'].includes(e.key)
      )
        sync();
    };
    const onCustom = () => sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener('sac_user_updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sac_user_updated', onCustom);
    };
  }, []);

  // For farmers only
  const registerUser = (email, name) => {
    localStorage.setItem('sac_user_email', email);
    if (name) localStorage.setItem('sac_user_name', name);
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  // For cooperative leaders — sets pending_payment status, never activates portal automatically
  const registerCooperative = (email, name) => {
    localStorage.setItem('sac_coop_email', email);
    if (name) localStorage.setItem('sac_coop_name', name);
    localStorage.setItem('sac_coop_status', 'pending_payment');
    // Remove farmer key if it exists to avoid confusion
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  // Called by admin actions or payment confirmation webhook in future
  const activateCooperative = () => {
    localStorage.setItem('sac_coop_status', 'active');
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  const clearUser = () => {
    ['sac_user_email', 'sac_user_name', 'sac_coop_email', 'sac_coop_name', 'sac_coop_status'].forEach((k) =>
      localStorage.removeItem(k)
    );
    setIsRegistered(false);
    setUserEmail(null);
    setUserName(null);
    setUserType(null);
    setCoopStatus(null);
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  return {
    isRegistered,
    userEmail,
    userName,
    userType,
    coopStatus,
    isCooperative: userType === 'cooperative',
    isFarmer: userType === 'farmer',
    isCoopActive: userType === 'cooperative' && coopStatus === 'active',
    isCoopPendingPayment: userType === 'cooperative' && coopStatus === 'pending_payment',
    registerUser,
    registerCooperative,
    activateCooperative,
    clearUser,
  };
}

