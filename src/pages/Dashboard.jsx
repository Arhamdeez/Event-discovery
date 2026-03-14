import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import { mockFeaturedEvents, mockEventsList } from '../data/mock';
import './Dashboard.css';

const TABS = [
  { id: 'created', label: 'Created Events' },
  { id: 'joined', label: 'Joined Events' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('created');
  const createdEvents = mockFeaturedEvents.slice(0, 2);
  const joinedEvents = mockEventsList.slice(0, 3);

  return (
    <div className="events-page">
      <Navbar />
      <main className="dashboard-main">
        <div className="container">
          <div className="dashboard-header">
            <h1>My events</h1>
            <Link to="/events/new" className="btn btn-primary">Create new event</Link>
          </div>
          <div className="dashboard-tabs glass">
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
          <div className="dashboard-content">
            {activeTab === 'created' && (
              <div className="event-grid">
                {createdEvents.length ? createdEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                )) : (
                  <p className="empty-state">You haven't created any events yet.</p>
                )}
              </div>
            )}
            {activeTab === 'joined' && (
              <div className="event-grid">
                {joinedEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
