import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar-shell">
      <div className="container navbar-shell-inner">
        <div className="navbar glass navbar-pill">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">◇</span>
            <span>Local Events</span>
          </Link>
          <nav className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/events">Explore Events</Link>
            <Link to="/events?categories=1">Categories</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/admin">Admin</Link>
          </nav>
          <div className="navbar-cta">
            <Link to="/signup" className="btn btn-primary btn-signup">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
