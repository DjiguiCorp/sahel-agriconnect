// Diagnostic utility to check environment variables
// This helps identify if VITE_API_BASE_URL is correctly set

export const diagnoseEnvironment = () => {
  const diagnostics = {
    mode: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV,
    viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    viteWsBaseUrl: import.meta.env.VITE_WS_BASE_URL,
    hasApiUrl: !!import.meta.env.VITE_API_BASE_URL,
    isPlaceholder: import.meta.env.VITE_API_BASE_URL?.includes('votre-backend'),
    isLocalhost: import.meta.env.VITE_API_BASE_URL?.includes('localhost'),
    allEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
  };

  console.group('🔍 Environment Diagnostics');
  console.log('Mode:', diagnostics.mode);
  console.log('Is Production:', diagnostics.isProduction);
  console.log('VITE_API_BASE_URL:', diagnostics.viteApiBaseUrl || 'NOT SET');
  console.log('Has API URL:', diagnostics.hasApiUrl);
  console.log('Is Placeholder:', diagnostics.isPlaceholder);
  console.log('Is Localhost:', diagnostics.isLocalhost);
  console.log('All VITE_* keys:', diagnostics.allEnvKeys);
  console.groupEnd();

  return diagnostics;
};
