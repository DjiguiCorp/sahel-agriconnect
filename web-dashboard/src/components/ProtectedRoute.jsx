import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminToken } from '../utils/adminSession';

const ProtectedRoute = ({ children }) => {
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

  if (!isAuthenticated || !token) {
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
