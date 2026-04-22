import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-bg" />
      <div className="container footer-inner">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              Raunaq
            </Link>
            <p className="footer-about">
              Discover local events, communities, and experiences in one simple place.
            </p>
          </div>

          <nav className="footer-groups" aria-label="Footer">
            <div className="footer-group">
              <h3>Company</h3>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-group">
              <h3>Explore</h3>
              <Link to="/events">Events</Link>
              <Link to="/events/new">Host an Event</Link>
            </div>
            <div className="footer-group">
              <h3>Account</h3>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
            </div>
            <div className="footer-group">
              <h3>Legal</h3>
              <Link to="/privacy">Privacy</Link>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Raunaq. Built for students and communities.</p>
        </div>
      </div>
    </footer>
  );
}
