import { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/AuthContext';
import { getEventById } from '../data/mock';
import './Dashboard.css';

const TABS = [
  { id: 'created', label: 'Created Events' },
  { id: 'joined', label: 'Joined Events' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('created');
  const { isLoggedIn, createdEvents, attendedEventIds } = useAuth();

  const joinedEvents = useMemo(() => {
    return attendedEventIds
      .map((id) => getEventById(id) || createdEvents.find((e) => e.id === id))
      .filter(Boolean);
  }, [attendedEventIds, createdEvents]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="events-page">
      <Navbar />
      <main className="dashboard-main">
        <div className="container">
          <div className="dashboard-header">
            <h1>My events</h1>
            <Link to="/events/new" className="btn btn-primary">Create new event</Link>
          </div>
          <GlassSurface
            className="dashboard-tabs"
            borderRadius={16}
            width="auto"
            backgroundOpacity={0.06}
            saturation={1.3}
            displace={0.3}
            style={{ height: 'auto', display: 'inline-flex', marginBottom: '2rem' }}
          >
            <div className="dashboard-tabs-inner">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </GlassSurface>
          <div className="dashboard-content">
            {activeTab === 'created' && (
              <div className="event-grid">
                {createdEvents.length ? createdEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                )) : (
                  <p className="empty-state">You haven&apos;t created any events yet. <Link to="/events/new">Create one</Link>.</p>
                )}
              </div>
            )}
            {activeTab === 'joined' && (
              <div className="event-grid">
                {joinedEvents.length ? joinedEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                )) : (
                  <p className="empty-state">You haven&apos;t joined any events yet. Explore and attend events!</p>
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
