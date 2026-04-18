import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import GlassSurface from '../components/GlassSurface';
import { mockEventsList, categories } from '../data/mock';
import { usePublicFirestoreEvents } from '../hooks/usePublicFirestoreEvents';
import './EventsList.css';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'upcoming', label: 'Upcoming' },
];

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function mergeLiveWithMock(live, mock) {
  const ids = new Set(live.map((e) => String(e.id)));
  return [...live, ...mock.filter((m) => !ids.has(String(m.id)))];
}

function createdAtMillis(ev) {
  const v = ev.createdAt;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  return 0;
}

/** Remount when URL query changes so filter fields stay in sync (back/forward) without a sync effect. */
function EventsListBody({ searchParams, setSearchParams, liveEvents, sort, setSort }) {
  const [city, setCity] = useState(() => searchParams.get('city') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [dateFilter, setDateFilter] = useState(() => searchParams.get('date') || '');

  const filteredEvents = useMemo(() => {
    let list = mergeLiveWithMock(liveEvents, mockEventsList);
    if (city.trim()) {
      const q = city.trim().toLowerCase();
      list = list.filter((ev) => (ev.location || '').toLowerCase().includes(q));
    }
    if (category) {
      const selectedCat = categories.find((c) => c.slug === category);
      if (selectedCat) {
        list = list.filter((ev) => ev.category === selectedCat.name);
      }
    }
    if (dateFilter) {
      list = list.filter((ev) => {
        const eventDate = parseEventDate(ev.date);
        return eventDate && eventDate >= dateFilter;
      });
    }
    if (sort === 'latest') {
      list = [...list].sort((a, b) => createdAtMillis(b) - createdAtMillis(a));
    } else if (sort === 'popular') {
      list = [...list].sort((a, b) => (b.attendeeCount ?? 0) - (a.attendeeCount ?? 0));
    } else if (sort === 'upcoming') {
      list = [...list].sort((a, b) => {
        const da = parseEventDate(a.date);
        const db = parseEventDate(b.date);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.localeCompare(db);
      });
    }
    return list;
  }, [city, category, dateFilter, sort, liveEvents]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (category) params.set('category', category);
    if (dateFilter) params.set('date', dateFilter);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="container events-layout">
      <GlassSurface
        className="filters-sidebar"
        borderRadius={16}
        width="100%"
        backgroundOpacity={0.06}
        saturation={1.4}
        displace={0.3}
        style={{ height: 'auto', minHeight: '200px' }}
      >
        <div className="filters-sidebar-inner">
          <h3 className="filters-title">Filters</h3>
          <div className="input-wrap">
            <label>City</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Lahore, Karachi, Islamabad"
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
          <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={applyFilters}>
            Apply
          </button>
        </div>
      </GlassSurface>
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
          {filteredEvents.length > 0 ? (
            filteredEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))
          ) : (
            <p className="events-empty">No events match your search. Try different filters or <button type="button" className="btn btn-ghost" onClick={() => { setCity(''); setCategory(''); setDateFilter(''); setSearchParams(''); }}>clear filters</button>.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsList() {
  const liveEvents = usePublicFirestoreEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('latest');

  return (
    <div className="events-page">
      <Navbar />
      <main className="events-main">
        <EventsListBody
          key={searchParams.toString()}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          liveEvents={liveEvents}
          sort={sort}
          setSort={setSort}
        />
      </main>
      <Footer />
    </div>
  );
}
