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
                Raunaq helps students and communities discover, create, and join local events — from
                meetups to workshops — with a focus on simple planning and meaningful connections.
              </p>
              <h2>What we’re building</h2>
              <p>
                A clean event discovery experience with strong filters, a dashboard for your created
                and joined events, and a design language that feels modern and calm.
              </p>
            </div>
          </GlassSurface>
        </div>
      </main>
      <Footer />
    </div>
  );
}

