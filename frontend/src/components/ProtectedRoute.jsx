import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Beschermde route: redirect naar login als gebruiker niet is ingelogd.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Laden...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
