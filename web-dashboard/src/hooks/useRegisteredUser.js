import { useEffect, useState } from 'react';

export function useRegisteredUser() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const sync = () => {
      const email = localStorage.getItem('sac_user_email');
      const name = localStorage.getItem('sac_user_name');
      if (email) {
        setIsRegistered(true);
        setUserEmail(email);
        setUserName(name);
      } else {
        setIsRegistered(false);
        setUserEmail(null);
        setUserName(null);
      }
    };

    sync();

    const onStorage = (e) => {
      if (!e || e.key === 'sac_user_email' || e.key === 'sac_user_name') sync();
    };
    const onCustom = () => sync();

    window.addEventListener('storage', onStorage);
    window.addEventListener('sac_user_updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sac_user_updated', onCustom);
    };
  }, []);

  const registerUser = (email, name) => {
    localStorage.setItem('sac_user_email', email);
    if (name) localStorage.setItem('sac_user_name', name);
    setIsRegistered(true);
    setUserEmail(email);
    setUserName(name);
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  const clearUser = () => {
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    setIsRegistered(false);
    setUserEmail(null);
    setUserName(null);
    window.dispatchEvent(new Event('sac_user_updated'));
  };

  return { isRegistered, userEmail, userName, registerUser, clearUser };
}

