import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, BUILD_VERSION } from '../config/api';
import { AlertTriangle, Search, Lightbulb } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Environment variable diagnostics
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  const isPlaceholder = envApiUrl?.includes('votre-backend') || envApiUrl?.includes('placeholder');
  const hasEnvVar = !!envApiUrl && !isPlaceholder;
  const isProduction = import.meta.env.PROD;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/admin/central');
      } else {
        setError(result.error || t('admin.login.error'));
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-forest to-brand-sage py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-forest to-brand-sage rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">SA</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-forest mb-2">
              {t('admin.login.title')}
            </h1>
            <p className="text-gray-600">
              {t('admin.login.subtitle')}
            </p>
          </div>

          {/* Configuration Warning - Only show if there's an issue */}
          {(isPlaceholder || (!hasEnvVar && isProduction)) && (
            <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded text-yellow-800">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden />
                Configuration requise
              </p>
              <p className="text-sm mb-3">
                {isPlaceholder 
                  ? 'VITE_API_BASE_URL contient un placeholder. Configurez votre vraie URL Render dans Vercel.'
                  : 'VITE_API_BASE_URL n\'est pas défini. Configurez votre URL Render dans Vercel.'}
              </p>
              <div className="text-xs space-y-1">
                <p><strong>Étapes :</strong></p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Allez dans Vercel → Settings → Environment Variables</li>
                  <li>Ajoutez/modifiez <code className="bg-yellow-50 px-1 rounded">VITE_API_BASE_URL</code></li>
                  <li>Valeur : Votre URL Render (ex: https://sahel-agriconnect.onrender.com)</li>
                  <li>Redéployez : Deployments → Redeploy</li>
                </ol>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded text-red-800">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Debug Info - Only in production when there's an issue */}
          {isProduction && (isPlaceholder || !hasEnvVar) && (
            <div className="mb-6 p-3 bg-gray-50 border rounded text-xs">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 shrink-0" aria-hidden />
                Informations de débogage
              </p>
              <div className="space-y-1 font-mono">
                <p><strong>Build Version:</strong> {BUILD_VERSION}</p>
                <p><strong>VITE_API_BASE_URL:</strong> {envApiUrl || '(not set)'}</p>
                <p><strong>API_BASE_URL (used):</strong> {API_BASE_URL}</p>
                <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
                <p><strong>Has Env Var:</strong> {hasEnvVar ? 'Yes' : 'No'}</p>
                <p><strong>Is Placeholder:</strong> {isPlaceholder ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.login.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sage focus:border-transparent"
                placeholder="Email administrateur"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.login.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sage focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('admin.login.connecting') : t('admin.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
