import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/AuthContext';
import { getEventById } from '../data/mock';
import { EVENT_IMAGE_FALLBACK } from '../constants/images';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import './EventDetails.css';

export default function EventDetails() {
  const { id } = useParams();
  const { isLoggedIn, attendEvent, attendedEventIds, createdEvents } = useAuth();
  const [attendError, setAttendError] = useState('');
  const [remoteEvent, setRemoteEvent] = useState(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const localEvent = id ? getEventById(id) || createdEvents.find((e) => e.id === id) : null;

  useEffect(() => {
    if (!id || !db) {
      queueMicrotask(() => {
        setRemoteLoaded(true);
        setRemoteEvent(null);
      });
      return undefined;
    }
    const local = getEventById(id) || createdEvents.find((e) => e.id === id);
    if (local) {
      queueMicrotask(() => {
        setRemoteLoaded(true);
        setRemoteEvent(null);
      });
      return undefined;
    }
    queueMicrotask(() => setRemoteLoaded(false));
    let alive = true;
    getDoc(doc(db, 'events', id))
      .then((snap) => {
        if (!alive) return;
        setRemoteLoaded(true);
        if (snap.exists()) setRemoteEvent({ id: snap.id, ...snap.data() });
        else setRemoteEvent(null);
      })
      .catch(() => {
        if (!alive) return;
        setRemoteLoaded(true);
        setRemoteEvent(null);
      });
    return () => {
      alive = false;
    };
  }, [id, createdEvents]);

  const event = localEvent || remoteEvent;
  const primaryUrl = event?.image || EVENT_IMAGE_FALLBACK;
  const [bannerSrc, setBannerSrc] = useState(primaryUrl);
  const isAttending = event && attendedEventIds.includes(event.id);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- sync banner with resolved image URL */
    setBannerSrc(primaryUrl);
  }, [primaryUrl, id]);

  if (!event && !remoteLoaded) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="container section">
          <p>Loading event…</p>
        </main>
        <Footer />
      </div>
    );
  }

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
          <img
            src={bannerSrc}
            alt={event.title}
            decoding="async"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setBannerSrc(EVENT_IMAGE_FALLBACK)}
          />
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
                  {event.description ||
                    'Join us for an engaging session with students and communities across Pakistan. All experience levels welcome.'}
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
                  <div className="organizer-avatar">
                    {(event.organizerInitial || event.organizerName || 'R').toString().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{event.organizerName || 'Raunaq Host'}</strong>
                    <span className="organizer-email">
                      {event.organizerEmail || 'events@raunaq.app'}
                    </span>
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
                  <>
                    {attendError ? <p className="auth-error" role="alert" style={{ marginBottom: '0.75rem' }}>{attendError}</p> : null}
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      onClick={async () => {
                        setAttendError('');
                        try {
                          await attendEvent(event.id);
                        } catch (err) {
                          setAttendError(err.message || 'Could not save RSVP.');
                        }
                      }}
                    >
                      Attend event
                    </button>
                  </>
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
