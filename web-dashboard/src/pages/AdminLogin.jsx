import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { testBackendConnection } from '../utils/testBackendConnection';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Test backend connection on mount
  useEffect(() => {
    if (!import.meta.env.PROD || API_BASE_URL.includes('localhost')) return;
    
    const runConnectionTest = async () => {
      const testResult = await testBackendConnection(API_BASE_URL);
      setConnectionTest(testResult);
      
      if (!testResult.healthCheck?.success) {
        setError(`Backend inaccessible. Vérifiez que VITE_API_BASE_URL est configuré dans Vercel.`);
      }
    };
    
    runConnectionTest();
  }, []);

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
              <div className="mt-3 text-sm text-red-700 space-y-2">
                <p><strong>💡 Solutions :</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><strong>Vérifiez Vercel :</strong> Settings → Environment Variables → VITE_API_BASE_URL doit être configuré avec votre URL Render</li>
                  <li><strong>Redéployez :</strong> Deployments → Redeploy après modification des variables</li>
                  <li><strong>Videz le cache :</strong> Videz le cache du navigateur</li>
                </ul>
                <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                  <p><strong>🔍 Debug Info :</strong></p>
                  <p><strong>API URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'NON DÉFINI (utilise localhost)'}</p>
                  <p><strong>API_BASE_URL (config):</strong> {API_BASE_URL}</p>
                  <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
                  <p><strong>Build Time:</strong> {new Date().toLocaleString()}</p>
                  
                  {connectionTest && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p><strong>🔍 Connection Test Results:</strong></p>
                      <p>Health Check: {connectionTest.healthCheck?.success ? '✅ OK' : `❌ Failed (${connectionTest.healthCheck?.error || connectionTest.healthCheck?.status})`}</p>
                      <p>Login Endpoint: {connectionTest.loginEndpoint?.exists ? '✅ Accessible' : `❌ Not accessible (${connectionTest.loginEndpoint?.error})`}</p>
                      <p>CORS: {connectionTest.cors?.success ? '✅ OK' : `❌ Failed`}</p>
                      {connectionTest.errors.length > 0 && (
                        <div className="mt-1">
                          <p><strong>Errors:</strong></p>
                          <ul className="list-disc list-inside">
                            {connectionTest.errors.map((err, idx) => (
                              <li key={idx} className="text-xs">{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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

