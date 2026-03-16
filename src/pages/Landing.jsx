import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import { mockFeaturedEvents, categories } from '../data/mock';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <Navbar />

      <section className="hero">
        <div className="container hero-inner">
          <h1 className="hero-title">
            Discover events near you.
            <br />
            <span className="hero-title-accent">Create. Join. Connect.</span>
          </h1>
          <p className="hero-subtitle">
            Local events for students and communities — from meetups to workshops.
          </p>
          <div className="hero-search glass">
            <div className="search-row">
              <input type="text" className="input search-input" placeholder="City or area" />
              <select className="select search-select">
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <input type="date" className="input search-date" />
              <button type="button" className="btn btn-primary btn-lg">Search</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section featured">
        <div className="container">
          <h2 className="section-title">
            <span>Featured</span>
            Featured events
          </h2>
          <div className="event-grid">
            {mockFeaturedEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} featured />
            ))}
          </div>
          <div className="section-cta">
            <Link to="/events" className="btn btn-glass btn-lg">View all events</Link>
          </div>
        </div>
      </section>

      <section className="section categories-section">
        <div className="container">
          <h2 className="section-title">
            <span>Browse</span>
            Categories
          </h2>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/events?category=${cat.slug}`} className="category-card glass-card">
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
