import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import GlassSurface from '../components/GlassSurface';
import { mockFeaturedEvents, categories } from '../data/mock';
import './Landing.css';

export default function Landing() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity.trim()) params.set('city', searchCity.trim());
    if (searchCategory) params.set('category', searchCategory);
    if (searchDate) params.set('date', searchDate);
    navigate(`/events${params.toString() ? `?${params.toString()}` : ''}`);
  };

  useEffect(() => {
    if (hash === '#categories') {
      const el = document.getElementById('categories');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [hash]);

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
          <GlassSurface
            className="hero-search"
            borderRadius={24}
            width="100%"
            backgroundOpacity={0.06}
            saturation={1.4}
            displace={0.4}
            style={{ height: 'auto', minHeight: 'unset' }}
          >
            <form className="hero-search-form" onSubmit={handleSearchSubmit}>
              <div className="search-row">
                <input
                  type="text"
                  className="input search-input"
                  placeholder="City or area"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
                <select
                  className="select search-select"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                >
                  <option value="">Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="input search-date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-lg">Search</button>
              </div>
            </form>
          </GlassSurface>
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
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
          <div className="section-cta">
            <Link to="/events" className="btn btn-glass btn-lg">View all events</Link>
          </div>
        </div>
      </section>

      <section id="categories" className="section categories-section">
        <div className="container">
          <h2 className="section-title">
            <span>Browse</span>
            Categories
          </h2>
          <div className="categories-grid">
            {categories.map((cat) => (
              <GlassSurface
                key={cat.id}
                borderRadius={24}
                width="100%"
                backgroundOpacity={0.06}
                saturation={1.3}
                displace={0.25}
                style={{ height: 'auto' }}
                className="category-card-wrap"
              >
                <Link to={`/events?category=${cat.slug}`} className="category-card">
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                </Link>
              </GlassSurface>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
