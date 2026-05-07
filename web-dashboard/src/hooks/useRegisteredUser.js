import { useEffect, useState } from 'react';

export function useRegisteredUser() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('sac_user_email');
    const name = localStorage.getItem('sac_user_name');
    if (email) {
      setIsRegistered(true);
      setUserEmail(email);
      setUserName(name);
    }
  }, []);

  const registerUser = (email, name) => {
    localStorage.setItem('sac_user_email', email);
    if (name) localStorage.setItem('sac_user_name', name);
    setIsRegistered(true);
    setUserEmail(email);
    setUserName(name);
  };

  const clearUser = () => {
    localStorage.removeItem('sac_user_email');
    localStorage.removeItem('sac_user_name');
    setIsRegistered(false);
    setUserEmail(null);
    setUserName(null);
  };

  return { isRegistered, userEmail, userName, registerUser, clearUser };
}

