import { useCallback, useEffect, useMemo, useState } from 'react';

export function useRegisteredUser() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userPhone, setUserPhone] = useState(null);
  const [userType, setUserType] = useState(null); // 'farmer' | 'cooperative'
  const [coopStatus, setCoopStatus] = useState(null); // 'pending_payment' | 'active'

  const sync = useCallback(() => {
    const farmerEmail = localStorage.getItem('sac_user_email');
    const coopEmail = localStorage.getItem('sac_coop_email');

    if (coopEmail) {
      setIsRegistered(true);
      setUserEmail(coopEmail);
      setUserName(localStorage.getItem('sac_coop_name'));
      setUserPhone(null);
      setUserType('cooperative');
      setCoopStatus(localStorage.getItem('sac_coop_status') || 'pending_payment');
    } else if (farmerEmail) {
      setIsRegistered(true);
      setUserEmail(farmerEmail);
      setUserName(localStorage.getItem('sac_user_name'));
      setUserPhone(localStorage.getItem('sac_user_phone'));
      setUserType('farmer');
      setCoopStatus(null);
    } else {
      setIsRegistered(false);
      setUserEmail(null);
      setUserName(null);
      setUserPhone(null);
      setUserType(null);
      setCoopStatus(null);
    }
  }, []);

  useEffect(() => {
    sync();
    const onStorage = (e) => {
      if (
        !e ||
        [
          'sac_user_email',
          'sac_user_name',
          'sac_user_phone',
          'sac_coop_email',
          'sac_coop_name',
          'sac_coop_status',
        ].includes(e.key)
      ) {
        sync();
      }
    };
    const onCustom = () => sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener('sac_user_updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sac_user_updated', onCustom);
    };
  }, [sync]);

  const registerUser = useCallback((email, name, phone) => {
    localStorage.setItem('sac_user_email', email);
    if (name) localStorage.setItem('sac_user_name', name);
    if (phone) localStorage.setItem('sac_user_phone', phone);
    window.dispatchEvent(new Event('sac_user_updated'));
  }, []);

  const registerCooperative = useCallback((email, name) => {
    localStorage.setItem('sac_coop_email', email);
    if (name) localStorage.setItem('sac_coop_name', name);
    localStorage.setItem('sac_coop_status', 'pending_payment');
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    localStorage.removeItem('sac_user_phone');
    window.dispatchEvent(new Event('sac_user_updated'));
  }, []);

  const activateCooperative = useCallback(() => {
    localStorage.setItem('sac_coop_status', 'active');
    window.dispatchEvent(new Event('sac_user_updated'));
  }, []);

  const clearUser = useCallback(() => {
    [
      'sac_user_email',
      'sac_user_name',
      'sac_user_phone',
      'sac_coop_email',
      'sac_coop_name',
      'sac_coop_status',
    ].forEach((k) => localStorage.removeItem(k));
    setIsRegistered(false);
    setUserEmail(null);
    setUserName(null);
    setUserPhone(null);
    setUserType(null);
    setCoopStatus(null);
    window.dispatchEvent(new Event('sac_user_updated'));
  }, []);

  return useMemo(
    () => ({
      isRegistered,
      userEmail,
      userName,
      userPhone,
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
    }),
    [
      isRegistered,
      userEmail,
      userName,
      userPhone,
      userType,
      coopStatus,
      registerUser,
      registerCooperative,
      activateCooperative,
      clearUser,
    ]
  );
}
