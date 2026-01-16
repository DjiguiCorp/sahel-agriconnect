// Utility to test backend connection
// This helps diagnose connection issues

export const testBackendConnection = async (apiBaseUrl) => {
  const results = {
    healthCheck: null,
    loginEndpoint: null,
    cors: null,
    errors: []
  };

  try {
    // Test 1: Health Check
    try {
      const healthUrl = `${apiBaseUrl}/api/health`;
      console.log('🔍 Testing health endpoint:', healthUrl);
      
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results.healthCheck = {
          success: true,
          data: healthData,
          status: healthResponse.status
        };
        console.log('✅ Health check successful:', healthData);
      } else {
        results.healthCheck = {
          success: false,
          status: healthResponse.status,
          statusText: healthResponse.statusText
        };
        results.errors.push(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
        console.error('❌ Health check failed:', healthResponse.status, healthResponse.statusText);
      }
    } catch (error) {
      results.healthCheck = {
        success: false,
        error: error.message
      };
      results.errors.push(`Health check error: ${error.message}`);
      console.error('❌ Health check error:', error);
    }

    // Test 2: CORS Check
    try {
      const corsUrl = `${apiBaseUrl}/api/health`;
      const corsResponse = await fetch(corsUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
        },
        signal: AbortSignal.timeout(10000)
      });

      results.cors = {
        success: corsResponse.ok || corsResponse.status === 204,
        status: corsResponse.status,
        headers: {
          'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
        }
      };
      console.log('🔍 CORS check:', results.cors);
    } catch (error) {
      results.cors = {
        success: false,
        error: error.message
      };
      results.errors.push(`CORS check error: ${error.message}`);
      console.error('❌ CORS check error:', error);
    }

    // Test 3: Login Endpoint (without credentials)
    try {
      const loginUrl = `${apiBaseUrl}/api/auth/login`;
      console.log('🔍 Testing login endpoint:', loginUrl);
      
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
        signal: AbortSignal.timeout(10000)
      });

      // We expect 401 (unauthorized) which means the endpoint exists
      results.loginEndpoint = {
        exists: true,
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        accessible: loginResponse.status !== 0
      };
      console.log('🔍 Login endpoint test:', results.loginEndpoint);
    } catch (error) {
      results.loginEndpoint = {
        exists: false,
        error: error.message
      };
      results.errors.push(`Login endpoint error: ${error.message}`);
      console.error('❌ Login endpoint error:', error);
    }

  } catch (error) {
    results.errors.push(`General error: ${error.message}`);
    console.error('❌ General test error:', error);
  }

  return results;
};
