import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/AuthContext';
import { getEventById } from '../data/mock';
import './EventDetails.css';

export default function EventDetails() {
  const { id } = useParams();
  const { isLoggedIn, attendEvent, attendedEventIds, createdEvents } = useAuth();
  const event = getEventById(id) || createdEvents.find((e) => e.id === id);
  const imageUrl = event?.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop';
  const isAttending = event && attendedEventIds.includes(event.id);

  if (!event) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="container section">
          <p>Event not found.</p>
          <Link to="/events">Back to events</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="events-page">
      <Navbar />
      <main className="event-details">
        <div className="event-banner">
          <img src={imageUrl} alt={event.title} />
          <div className="event-banner-overlay" />
          <span className="event-banner-category">{event.category}</span>
        </div>
        <div className="container event-details-inner">
          <div className="event-details-main">
            <h1 className="event-details-title">{event.title}</h1>
            <div className="event-details-meta">
              <span>{event.date}</span>
              <span>{event.time}</span>
              <span>{event.location}</span>
            </div>
            <GlassSurface
              className="event-details-body"
              borderRadius={20}
              width="100%"
              backgroundOpacity={0.06}
              saturation={1.4}
              displace={0.35}
              style={{ height: 'auto', marginBottom: '1.5rem' }}
            >
              <div className="event-details-body-inner">
                <h3>About this event</h3>
                <p>
                  Join us for an engaging session that brings together students and professionals.
                  This event is designed to foster connections and share knowledge in a relaxed setting.
                  Refreshments will be provided. All experience levels welcome.
                </p>
              </div>
            </GlassSurface>
            <GlassSurface
              className="organizer"
              borderRadius={20}
              width="100%"
              backgroundOpacity={0.06}
              saturation={1.4}
              displace={0.35}
              style={{ height: 'auto' }}
            >
              <div className="organizer-inner">
                <h3>Organizer</h3>
                <div className="organizer-info">
                  <div className="organizer-avatar">C</div>
                  <div>
                    <strong>Campus Events Team</strong>
                    <span className="organizer-email">events@campus.edu</span>
                  </div>
                </div>
              </div>
            </GlassSurface>
          </div>
          <aside className="event-details-sidebar">
            <GlassSurface
              className="sidebar-card"
              borderRadius={20}
              width="100%"
              backgroundOpacity={0.06}
              saturation={1.4}
              displace={0.35}
              style={{ height: 'auto' }}
            >
              <div className="sidebar-card-inner">
                <p className="attendee-count">
                  <strong>{event.attendeeCount ?? 0}</strong> attending
                </p>
                {!isLoggedIn ? (
                  <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                    Sign in to attend
                  </Link>
                ) : isAttending ? (
                  <p className="attending-badge">You&apos;re attending</p>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    onClick={() => attendEvent(event.id)}
                  >
                    Attend event
                  </button>
                )}
                <Link to="/events" className="back-link">← Back to events</Link>
              </div>
            </GlassSurface>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
