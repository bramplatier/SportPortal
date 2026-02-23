import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

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
      </div>

      <div className="navbar-user">
        <span className="user-name">👤 {user.name}</span>
        <button onClick={logout} className="btn btn-logout">
          Uitloggen
        </button>
      </div>
    </nav>
  );
}
