import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';
  const isAdmin = user.role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🏟️</span>
        <Link to="/" className="navbar-title">SportPortal</Link>
      </div>

      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>
          📋 Lessen
        </Link>
        <Link to="/mijn-lessen" className={isActive('/mijn-lessen')}>
          ✅ Mijn Inschrijvingen
        </Link>
        <Link to="/aanvragen" className={isActive('/aanvragen')}>
          📩 Aanvragen
        </Link>
        <Link to="/mededelingen" className={isActive('/mededelingen')}>
          📢 Mededelingen
        </Link>

        {isAdmin && (
          <>
            <span className="nav-divider">|</span>
            <Link to="/admin" className={isActive('/admin')}>
              ⚙️ Dashboard
            </Link>
            <Link to="/admin/lessen" className={isActive('/admin/lessen')}>
              📝 Lessen Beheer
            </Link>
            <Link to="/admin/gebruikers" className={isActive('/admin/gebruikers')}>
              👥 Gebruikers
            </Link>
            <Link to="/admin/aanvragen" className={isActive('/admin/aanvragen')}>
              📋 Aanvragen
            </Link>
            <Link to="/admin/mededelingen" className={isActive('/admin/mededelingen')}>
              📢 Mededelingen
            </Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        {isAdmin && <span className="admin-badge">🛡️ Admin</span>}
        <Link to="/profiel" className="user-name-link">
          👤 {user.name}
        </Link>
        <button onClick={logout} className="btn btn-logout">
          Uitloggen
        </button>
      </div>
    </nav>
  );
}
