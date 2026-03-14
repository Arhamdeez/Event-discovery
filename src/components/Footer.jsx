import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-bg" />
      <div className="container footer-inner">
        <div className="footer-top">
          <Link to="/" className="footer-logo">
            <span className="logo-icon">◇</span>
            Local Events
          </Link>
          <nav className="footer-links">
            <Link to="/events">Explore</Link>
            <Link to="/events?categories=1">Categories</Link>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a href="#privacy">Privacy</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Local Events. For students & communities.</p>
        </div>
      </div>
    </footer>
  );
}
