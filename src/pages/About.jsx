import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import './StaticPages.css';

export default function About() {
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
              <h1>About Raunaq</h1>
              <p>
                Raunaq is for Pakistan — students, societies, and neighbourhoods discovering what’s on
                in their city: arena concerts, club and rooftop nights, festivals, meetups, food walks,
                and heritage experiences — all in one place.
              </p>
              <h2>What we’re building</h2>
              <p>
                Simple discovery by city and category, easy event creation, and a dashboard for what you
                host or join — with a calm, modern look that still feels at home from Karachi to Peshawar.
              </p>
            </div>
          </GlassSurface>
        </div>
      </main>
      <Footer />
    </div>
  );
}

