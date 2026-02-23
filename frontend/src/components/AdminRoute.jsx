import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Admin route guard: redirect naar home als de gebruiker geen admin is.
 * Combineert authenticatie + admin-rolcontrole.
 */
export default function AdminRoute({ children }) {
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

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
