import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getEventById } from '../data/mock';
import './EventDetails.css';

export default function EventDetails() {
  const { id } = useParams();
  const event = getEventById(id);
  const imageUrl = event?.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop';

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
            <div className="event-details-body glass">
              <h3>About this event</h3>
              <p>
                Join us for an engaging session that brings together students and professionals.
                This event is designed to foster connections and share knowledge in a relaxed setting.
                Refreshments will be provided. All experience levels welcome.
              </p>
            </div>
            <div className="organizer glass">
              <h3>Organizer</h3>
              <div className="organizer-info">
                <div className="organizer-avatar">C</div>
                <div>
                  <strong>Campus Events Team</strong>
                  <span className="organizer-email">events@campus.edu</span>
                </div>
              </div>
            </div>
          </div>
          <aside className="event-details-sidebar">
            <div className="sidebar-card glass">
              <p className="attendee-count">
                <strong>{event.attendeeCount ?? 0}</strong> attending
              </p>
              <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Attend event
              </button>
              <Link to="/events" className="back-link">← Back to events</Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
