import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import { mockEventsList, categories } from '../data/mock';
import './EventsList.css';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'upcoming', label: 'Upcoming' },
];

export default function EventsList() {
  const [sort, setSort] = useState('latest');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  return (
    <div className="events-page">
      <Navbar />
      <main className="events-main">
        <div className="container events-layout">
          <aside className="filters-sidebar glass">
            <h3 className="filters-title">Filters</h3>
            <div className="input-wrap">
              <label>City</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Boston"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="input-wrap">
              <label>Category</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="input-wrap">
              <label>Date</label>
              <input
                type="date"
                className="input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Apply
            </button>
          </aside>
          <div className="events-content">
            <div className="events-header">
              <h1>Explore events</h1>
              <div className="sort-wrap">
                <label className="sort-label">Sort by</label>
                <select
                  className="select sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="event-grid">
              {mockEventsList.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
