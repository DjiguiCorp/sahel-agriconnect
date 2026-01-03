import { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

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
    // Vérifier si l'utilisateur est déjà connecté (session stockée)
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.isAuthenticated && authData.user) {
          setIsAuthenticated(true);
          setUser(authData.user);
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const loginUrl = API_ENDPOINTS.AUTH.LOGIN;
      console.log('🔐 Tentative de connexion à:', loginUrl);
      
      // Vérifier si on utilise localhost en production (problème de configuration)
      if (import.meta.env.PROD && loginUrl.includes('localhost')) {
        throw new Error('Configuration manquante : VITE_API_BASE_URL n\'est pas défini dans Vercel. Le frontend utilise localhost qui n\'est pas accessible depuis mobile.');
      }
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        // Ajouter un timeout pour mobile
        signal: AbortSignal.timeout(30000) // 30 secondes
      }).catch((fetchError) => {
        // Gérer les erreurs de fetch spécifiquement
        if (fetchError.name === 'AbortError') {
          throw new Error('La connexion a pris trop de temps. Vérifiez votre connexion internet.');
        }
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le backend est accessible.');
        }
        throw fetchError;
      });

      // Vérifier si la réponse est valide (pas d'erreur réseau)
      if (!response) {
        throw new Error('Aucune réponse du serveur. Vérifiez que le backend est accessible.');
      }

      // Gérer les erreurs HTTP
      if (!response.ok) {
        // Essayer de lire le message d'erreur du serveur
        let errorMessage = 'Erreur de connexion au serveur';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Si la réponse n'est pas du JSON, utiliser le statut HTTP
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
        const userData = {
          email: email,
          name: data.user?.name || 'Administrateur Central',
          role: data.user?.role || 'admin'
        };
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('adminAuth', JSON.stringify({
          isAuthenticated: true,
          user: userData,
          token: data.token
        }));
        localStorage.setItem('adminToken', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Email ou mot de passe incorrect' };
      }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      console.error('📍 URL utilisée:', API_ENDPOINTS.AUTH.LOGIN);
      console.error('📍 API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'NON DÉFINI (utilise localhost)');
      
      // Message d'erreur plus informatif
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
          error: error.message
        }
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('adminAuth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

