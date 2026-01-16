import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, BUILD_VERSION } from '../config/api';
import { testBackendConnection } from '../utils/testBackendConnection';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Environment variable diagnostics
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  const isPlaceholder = envApiUrl?.includes('votre-backend') || envApiUrl?.includes('placeholder');
  const hasEnvVar = !!envApiUrl && !isPlaceholder;
  const isProduction = import.meta.env.PROD;

  // Test backend connection on mount (production only)
  useEffect(() => {
    if (!isProduction || API_BASE_URL.includes('localhost')) return;
    
    setIsTestingConnection(true);
    const runConnectionTest = async () => {
      try {
        const testResult = await testBackendConnection(API_BASE_URL);
        setConnectionTest(testResult);
        
        if (!testResult.healthCheck?.success) {
          setError('Backend inaccessible. Vérifiez la configuration de VITE_API_BASE_URL dans Vercel.');
        } else {
          // Clear any previous errors if connection is successful
          setError('');
        }
      } catch (err) {
        console.error('Connection test error:', err);
        setConnectionTest({
          healthCheck: { success: false, error: err.message },
          errors: [err.message]
        });
      } finally {
        setIsTestingConnection(false);
      }
    };
    
    runConnectionTest();
  }, [isProduction]);

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

          {/* Configuration Warning - Only show if there's an issue */}
          {(isPlaceholder || (!hasEnvVar && isProduction)) && (
            <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded text-yellow-800">
              <p className="font-semibold mb-2">⚠️ Configuration Required</p>
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

          {/* Connection Test Results */}
          {connectionTest && (
            <div className={`mb-6 p-4 border-l-4 rounded text-sm ${
              connectionTest.healthCheck?.success 
                ? 'bg-green-50 border-green-500 text-green-800' 
                : 'bg-red-50 border-red-500 text-red-800'
            }`}>
              <p className="font-semibold mb-2">
                {isTestingConnection ? '🔄 Testing Connection...' : '🔍 Connection Status'}
              </p>
              {!isTestingConnection && (
                <div className="space-y-1 text-xs">
                  <p>Health Check: {connectionTest.healthCheck?.success ? '✅ OK' : `❌ ${connectionTest.healthCheck?.error || 'Failed'}`}</p>
                  {connectionTest.loginEndpoint && (
                    <p>Login Endpoint: {connectionTest.loginEndpoint.exists ? '✅ Accessible' : `❌ ${connectionTest.loginEndpoint.error || 'Not accessible'}`}</p>
                  )}
                  {connectionTest.cors && (
                    <p>CORS: {connectionTest.cors.success ? '✅ OK' : `❌ ${connectionTest.cors.error || 'Failed'}`}</p>
                  )}
                  {connectionTest.errors && connectionTest.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Errors:</p>
                      <ul className="list-disc list-inside ml-2">
                        {connectionTest.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Debug Info - Only in production when there's an issue */}
          {isProduction && (isPlaceholder || !hasEnvVar || connectionTest?.errors?.length > 0) && (
            <div className="mb-6 p-3 bg-gray-50 border rounded text-xs">
              <p className="font-semibold mb-2">🔍 Debug Information</p>
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
              disabled={isLoading || isTestingConnection}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('admin.login.connecting') : t('admin.login.submit')}
            </button>
          </form>

          {/* Demo Credentials */}
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
