import { useEffect, useState } from 'react';

export function useRegisteredUser() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userPhone, setUserPhone] = useState(null);

  useEffect(() => {
    const sync = () => {
      const email = localStorage.getItem('sac_user_email');
      const name = localStorage.getItem('sac_user_name');
      const phone = localStorage.getItem('sac_user_phone');
      if (email) {
        setIsRegistered(true);
        setUserEmail(email);
        setUserName(name);
        setUserPhone(phone || null);
      } else {
        setIsRegistered(false);
        setUserEmail(null);
        setUserName(null);
        setUserPhone(null);
      }
    };

    sync();

    const onStorage = (e) => {
      if (
        !e ||
        e.key === 'sac_user_email' ||
        e.key === 'sac_user_name' ||
        e.key === 'sac_user_phone'
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

  const registerUser = (email, name, phone) => {
    localStorage.setItem('sac_user_email', email);
    if (name) localStorage.setItem('sac_user_name', name);
    if (phone !== undefined) {
      if (phone) localStorage.setItem('sac_user_phone', phone);
      else localStorage.removeItem('sac_user_phone');
    }
    setIsRegistered(true);
    setUserEmail(email);
    setUserName(name);
    setUserPhone(localStorage.getItem('sac_user_phone') || null);
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  const clearUser = () => {
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    localStorage.removeItem('sac_user_phone');
    setIsRegistered(false);
    setUserEmail(null);
    setUserName(null);
    setUserPhone(null);
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  return { isRegistered, userEmail, userName, userPhone, registerUser, clearUser };
}

