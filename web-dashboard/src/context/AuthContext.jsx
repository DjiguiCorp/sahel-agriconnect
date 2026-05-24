import { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import {
  clearAdminSession,
  getAdminToken,
  isAdminTokenExpired,
} from '../utils/adminSession';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const storedAuth = localStorage.getItem('adminAuth');
      const token = localStorage.getItem('adminToken');

      if (!storedAuth || !token || isAdminTokenExpired(token)) {
        clearAdminSession();
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const authData = JSON.parse(storedAuth);
        if (!authData.isAuthenticated || !authData.user) {
          clearAdminSession();
          if (!cancelled) {
            setIsAuthenticated(false);
            setUser(null);
          }
          return;
        }

        const verifyUrl = API_ENDPOINTS.AUTH.VERIFY;
        if (verifyUrl && !verifyUrl.includes('undefined')) {
          const res = await fetchWithTimeout(verifyUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            clearAdminSession();
            if (!cancelled) {
              setIsAuthenticated(false);
              setUser(null);
            }
            return;
          }
          const data = await res.json().catch(() => ({}));
          if (data.admin?.name) {
            authData.user = {
              ...authData.user,
              name: data.admin.name,
              email: data.admin.email,
              role: data.admin.role,
            };
          }
        }

        if (!cancelled) {
          setIsAuthenticated(true);
          setUser(authData.user);
        }
      } catch {
        clearAdminSession();
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const loginUrl = API_ENDPOINTS.AUTH.LOGIN;

      if (import.meta.env.PROD && (!loginUrl || loginUrl.includes('localhost'))) {
        throw new Error('Configuration manquante : VITE_API_BASE_URL doit être défini dans Vercel avec votre URL Render.');
      }

      if (import.meta.env.PROD && loginUrl === '/api/auth/login') {
        throw new Error('Configuration invalide : VITE_API_BASE_URL n\'est pas correctement configuré dans Vercel.');
      }

      if (!loginUrl || loginUrl.includes('undefined')) {
        throw new Error('Configuration invalide : VITE_API_BASE_URL n\'est pas correctement configuré dans Vercel.');
      }

      const response = await fetchWithTimeout(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      }).catch((fetchError) => {
        if (fetchError.name === 'AbortError') {
          throw new Error('La connexion a pris trop de temps. Vérifiez votre connexion internet.');
        }
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le backend est accessible.');
        }
        throw fetchError;
      });

      if (!response) {
        throw new Error('Aucune réponse du serveur. Vérifiez que le backend est accessible.');
      }

      if (!response.ok) {
        let errorMessage = 'Erreur de connexion au serveur';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          if (response.status === 0) {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est accessible et que VITE_API_BASE_URL est configuré dans Vercel.';
          } else if (response.status >= 500) {
            errorMessage = 'Erreur serveur. Le backend peut être en cours de démarrage (attendez 30-60 secondes).';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (response.ok && data.token) {
        const adminData = data.admin || data.user;
        const userData = {
          email: email,
          name: adminData?.name || 'Administrateur Central',
          role: adminData?.role || 'admin',
        };
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem(
          'adminAuth',
          JSON.stringify({
            isAuthenticated: true,
            user: userData,
            token: data.token,
          }),
        );
        localStorage.setItem('adminToken', data.token);
        return { success: true };
      }

      const errorMsg = data.error || data.message || 'Email ou mot de passe incorrect';
      return { success: false, error: errorMsg };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erreur de connexion:', error);
      }

      let errorMessage = 'Erreur de connexion au serveur';

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le backend est accessible.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Erreur CORS. Le backend doit autoriser les requêtes depuis cette origine.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        debug: {
          url: API_ENDPOINTS.AUTH.LOGIN,
          apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'NON DÉFINI',
          error: error.message,
        },
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    clearAdminSession();
  };

  const hasValidToken = () => Boolean(getAdminToken());

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, hasValidToken }}>
      {children}
    </AuthContext.Provider>
  );
};
