import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import './StaticPages.css';

export default function Contact() {
  return (
    <div className="static-page">
      <Navbar />
      <main className="static-page-main">
        <div className="container static-page-container">
          <GlassSurface
            className="static-page-surface"
            borderRadius={24}
            width="100%"
            backgroundOpacity={0.06}
            saturation={1.35}
            displace={0.3}
            style={{ height: 'auto' }}
          >
            <div className="static-page-content">
              <h1>Contact</h1>
              <p>
                For feedback, support, or partnerships, email us at{' '}
                <a href="mailto:hello@raunaq.app">hello@raunaq.app</a>.
              </p>
              <p className="static-page-note">
                If you’re reporting an issue, include the page URL and what you expected vs what
                happened.
              </p>
            </div>
          </GlassSurface>
        </div>
      </main>
      <Footer />
    </div>
  );
}

