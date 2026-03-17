import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import './StaticPages.css';

export default function Privacy() {
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
              <h1>Privacy</h1>
              <p>
                Raunaq stores only what’s needed to run the app (like login state and your created /
                joined events). We don’t sell personal data.
              </p>
              <h2>What we store</h2>
              <ul>
                <li>Your email (for signed-in display)</li>
                <li>Events you create</li>
                <li>Events you’ve joined</li>
              </ul>
              <h2>Questions</h2>
              <p>
                If you have privacy questions, contact{' '}
                <a href="mailto:privacy@raunaq.app">privacy@raunaq.app</a>.
              </p>
            </div>
          </GlassSurface>
        </div>
      </main>
      <Footer />
    </div>
  );
}

