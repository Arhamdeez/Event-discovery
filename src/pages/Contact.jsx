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
                For feedback & support:{' '}
                <a href="mailto:l226994@lhr.nu.edu.pk?subject=Raunaq%20Support%20Request">
                  l226994@lhr.nu.edu.pk
                </a>
                .
                <br />
                For partnerships:{' '}
                <a href="mailto:l226619@lhr.nu.edu.pk?subject=Raunaq%20Partnership%20Inquiry">
                  l226619@lhr.nu.edu.pk
                </a>
                .
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

