import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-bg" />
      <div className="container footer-inner">
        <div className="footer-top">
          <Link to="/" className="footer-logo">
            Raunaq
          </Link>
          <nav className="footer-links">
            <Link to="/events">Explore</Link>
            <Link to="/#categories">Categories</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Raunaq. For students & communities.</p>
        </div>
      </div>
    </footer>
  );
}
