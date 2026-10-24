import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminToken } from '../utils/adminSession';

/**
 * Admin-gated route.
 * `requiredRole="admin"` documents intent; only admin auth is supported.
 */
const ProtectedRoute = ({ children, requiredRole = 'admin' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
      </div>
    );
  }

  const token = getAdminToken();
  const isAdmin = Boolean(isAuthenticated && token);

  if (!isAdmin || requiredRole !== 'admin') {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/admin/login?return=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
