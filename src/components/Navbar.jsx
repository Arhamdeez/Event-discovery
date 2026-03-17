import { Link } from 'react-router-dom';
import GlassSurface from './GlassSurface';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, user, logout, isAdmin } = useAuth();

  return (
    <header className="navbar-shell">
      <div className="container navbar-shell-inner">
        <GlassSurface
          className="navbar navbar-pill"
          borderRadius={24}
          width="100%"
          backgroundOpacity={0.08}
          saturation={1.5}
          displace={0.5}
          style={{ height: 64 }}
        >
          <div className="navbar-inner">
            <Link to="/" className="navbar-logo">
              Raunaq
            </Link>
            <nav className="navbar-links">
              <Link to="/">Home</Link>
              <Link to="/events">Explore Events</Link>
              <Link to="/#categories">Categories</Link>
              {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
              {isAdmin && <Link to="/admin">Admin</Link>}
            </nav>
            <div className="navbar-cta">
              {isLoggedIn ? (
                <>
                  <span className="navbar-user-email">{user?.email}</span>
                  <button type="button" className="btn btn-ghost btn-signup" onClick={logout}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost nav-ghost">Login</Link>
                  <Link to="/signup" className="btn btn-primary btn-signup">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </GlassSurface>
      </div>
    </header>
  );
}
