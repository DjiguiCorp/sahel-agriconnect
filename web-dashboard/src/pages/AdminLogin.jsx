import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/admin/central');
    } else {
      // Afficher l'erreur avec des informations de debug en développement
      let errorMessage = result.error || t('admin.login.error');
      
      // En développement, ajouter des infos de debug
      if (import.meta.env.DEV && result.debug) {
        console.error('🔍 Debug info:', result.debug);
        errorMessage += ` (URL: ${result.debug.url})`;
      }
      
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-green to-primary-lightgreen py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-green to-primary-lightgreen rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">SA</span>
            </div>
            <h1 className="text-3xl font-bold text-primary-green mb-2">
              {t('admin.login.title')}
            </h1>
            <p className="text-gray-600">
              {t('admin.login.subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded text-red-800">
              <p className="font-semibold">{error}</p>
              {(import.meta.env.DEV || import.meta.env.MODE === 'development') && (
                <div className="mt-2 text-xs text-red-700 space-y-1">
                  <p><strong>💡 Debug Info:</strong></p>
                  <p>Vérifiez que :</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Le backend est démarré (http://localhost:3001)</li>
                    <li>VITE_API_BASE_URL est configuré (actuel: {import.meta.env.VITE_API_BASE_URL || 'NON DÉFINI → utilise localhost'})</li>
                    <li>L'endpoint est accessible : {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/auth/login</li>
                  </ul>
                  <p className="mt-2 text-xs">Ouvrez la console du navigateur (F12) pour plus de détails.</p>
                </div>
              )}
            </div>
          )}

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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                placeholder="admin@sahelagriconnect.org"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
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

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-primary-blue rounded">
            <p className="text-sm text-gray-700">
              <strong>💡 {t('admin.login.demo.title')} :</strong><br />
              {t('admin.login.demo.email')} : <code className="bg-gray-100 px-2 py-1 rounded">admin@sahelagriconnect.org</code><br />
              {t('admin.login.demo.password')} : <code className="bg-gray-100 px-2 py-1 rounded">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

