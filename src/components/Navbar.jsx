import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassSurface from './GlassSurface';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

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
          style={{ minHeight: 64, height: 'auto' }}
        >
          <div className="navbar-inner">
            <Link to="/" className="navbar-logo" onClick={closeMenu}>
              Raunaq
            </Link>
            <button
              type="button"
              className="navbar-menu-btn"
              aria-expanded={menuOpen}
              aria-controls="navbar-mobile-drawer"
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
            <nav className="navbar-links">
              <Link to="/" onClick={closeMenu}>Home</Link>
              <Link to="/events" onClick={closeMenu}>Explore Events</Link>
              <Link to="/#categories" onClick={closeMenu}>Categories</Link>
              {isLoggedIn && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}
              {isAdmin && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
            </nav>
            <div className="navbar-cta">
              {isLoggedIn ? (
                <span className="navbar-user-email">{user?.email}</span>
              ) : (
                <Link to="/login" className="btn btn-primary" onClick={closeMenu}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </GlassSurface>
      </div>
      <div className={`navbar-mobile-overlay ${menuOpen ? 'navbar-mobile-overlay--open' : ''}`} aria-hidden={!menuOpen} onClick={closeMenu} />
      <aside
        id="navbar-mobile-drawer"
        className={`navbar-mobile-drawer ${menuOpen ? 'navbar-mobile-drawer--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="navbar-mobile-header">
          <span>Menu</span>
          <button type="button" className="navbar-mobile-close" onClick={closeMenu} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="navbar-mobile-links">
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/events" onClick={closeMenu}>Explore Events</Link>
          <Link to="/#categories" onClick={closeMenu}>Categories</Link>
          {isLoggedIn && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}
          {isAdmin && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
        </nav>
        <div className="navbar-mobile-cta">
          {isLoggedIn ? (
            <p className="navbar-mobile-email">{user?.email}</p>
          ) : (
            <Link to="/login" className="btn btn-primary" onClick={closeMenu}>
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </header>
  );
}
