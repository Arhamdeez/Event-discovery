import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar glass">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">◇</span>
          <span>Local Events</span>
        </Link>
        <nav className="navbar-links">
          <Link to="/events">Explore Events</Link>
          <Link to="/events?categories=1">Categories</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/login" className="nav-ghost">Login</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/login" className="nav-ghost">Login</Link>
          <Link to="/signup" className="btn btn-primary btn-signup">Sign Up</Link>
        </nav>
      </div>
    </header>
  );
}
