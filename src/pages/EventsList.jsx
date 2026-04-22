import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import GlassSurface from '../components/GlassSurface';
import { mockEventsList, categories } from '../data/mock';
import { usePublicFirestoreEvents } from '../hooks/usePublicFirestoreEvents';
import { useAutoCity } from '../hooks/useAutoCity';
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

function includesQuery(ev, q) {
  if (!q) return true;
  const hay = [
    ev.title,
    ev.description,
    ev.category,
    ev.location,
    ev.organizerName,
    ev.organizerEmail,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cityTokens(value) {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const tokens = normalized.split(' ').filter((t) => t.length > 2);
  const knownCities = [
    'lahore',
    'karachi',
    'islamabad',
    'peshawar',
    'rawalpindi',
    'multan',
    'quetta',
    'faisalabad',
    'hyderabad',
    'gujranwala',
    'sialkot',
  ];
  const knownMatch = knownCities.find((c) => normalized.includes(c));
  const merged = knownMatch ? [knownMatch, ...tokens] : tokens;
  return [...new Set(merged)];
}

export default function EventsList() {
  const liveEvents = usePublicFirestoreEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('latest');
  const { city: autoCity, coords: autoCoords, loading: autoCityLoading } = useAutoCity({ enabled: !searchParams.get('city') });
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [city, setCity] = useState(() => searchParams.get('city') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [dateFilter, setDateFilter] = useState(() => searchParams.get('date') || '');

  function haversineKm(a, b) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
  }

  const filteredEvents = useMemo(() => {
    let list = mergeLiveWithMock(liveEvents, mockEventsList);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((ev) => includesQuery(ev, q));
    }
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
  }, [query, city, category, dateFilter, sort, liveEvents]);

  const referenceCity = city.trim() || autoCity.trim();
  const nearbyRadiusKm = 5;
  const splitByLocation = useMemo(() => {
    const isNearbyEvent = (event, cityLabel) => {
      const location = normalizeText(event?.location);
      if (!location) return false;
      const tokens = cityTokens(cityLabel);
      return tokens.some((token) => location.includes(token));
    };

    const hasCoords = Boolean(autoCoords?.lat && autoCoords?.lon && !city.trim());
    if (!referenceCity && !hasCoords) {
      return { nearbyEvents: [], remainingEvents: filteredEvents };
    }
    const nearbyEvents = filteredEvents.filter((ev) => {
      if (hasCoords) {
        const evLat = Number(ev?.lat);
        const evLon = Number(ev?.lon);
        if (!Number.isFinite(evLat) || !Number.isFinite(evLon)) return false;
        const d = haversineKm(
          { lat: autoCoords.lat, lon: autoCoords.lon },
          { lat: evLat, lon: evLon },
        );
        return d <= nearbyRadiusKm;
      }
      if (referenceCity) return isNearbyEvent(ev, referenceCity);
      return false;
    });
    const nearbyIds = new Set(nearbyEvents.map((e) => String(e.id)));
    const remainingEvents = filteredEvents.filter((ev) => !nearbyIds.has(String(ev.id)));
    return { nearbyEvents, remainingEvents };
  }, [filteredEvents, referenceCity, autoCoords, city]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city.trim()) params.set('city', city.trim());
    if (category) params.set('category', category);
    if (dateFilter) params.set('date', dateFilter);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="events-page">
      <Navbar />
      <main className="events-main">
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
                <label>Search</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. football, concert, meetup"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="input-wrap">
                <label>City</label>
                <input
                  type="text"
                  className="input"
                  placeholder={autoCity ? `Detected: ${autoCity} (or type your city)` : 'e.g. Lahore, Karachi, Islamabad'}
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
            {referenceCity || (autoCoords?.lat && autoCoords?.lon) ? (
              <>
                <div className="events-split-head">
                  <h2>Events near {referenceCity || 'your location'} (within {nearbyRadiusKm} km)</h2>
                  {autoCityLoading ? <span>Detecting your location…</span> : null}
                </div>
                <div className="event-grid">
                  {splitByLocation.nearbyEvents.length > 0 ? (
                    splitByLocation.nearbyEvents.map((ev) => (
                      <EventCard key={ev.id} event={ev} />
                    ))
                  ) : (
                    <p className="events-empty">No nearby events found right now.</p>
                  )}
                </div>

                <div className="events-split-head">
                  <h2>Other events</h2>
                </div>
                <div className="event-grid">
                  {splitByLocation.remainingEvents.length > 0 ? (
                    splitByLocation.remainingEvents.map((ev) => (
                      <EventCard key={ev.id} event={ev} />
                    ))
                  ) : (
                    <p className="events-empty">No remaining events found.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="event-grid">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))
                ) : (
                  <p className="events-empty">No events match your search. Try different filters or <button type="button" className="btn btn-ghost" onClick={() => { setQuery(''); setCity(''); setCategory(''); setDateFilter(''); setSearchParams(''); }}>clear filters</button>.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
