import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/AuthContext';
import { getEventById } from '../data/mock';
import { EVENT_IMAGE_FALLBACK } from '../constants/images';
import { buildTicketTiers } from '../lib/tickets';
import { resolveEventOrganizer } from '../lib/organizers';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import './EventDetails.css';

export default function EventDetails() {
  const { id } = useParams();
  const { user, isLoggedIn, attendEvent, leaveEvent, attendedEventIds, createdEvents } = useAuth();
  const [attendError, setAttendError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
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
    queueMicrotask(() => setRemoteLoaded(false));
    return onSnapshot(
      doc(db, 'events', id),
      (snap) => {
        setRemoteLoaded(true);
        setRemoteEvent(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      },
      () => {
        setRemoteLoaded(true);
        setRemoteEvent(null);
      },
    );
  }, [id, createdEvents]);

  const event = remoteEvent ? { ...localEvent, ...remoteEvent } : localEvent;
  const primaryUrl = event?.image || EVENT_IMAGE_FALLBACK;
  const [bannerSrc, setBannerSrc] = useState(primaryUrl);
  const isAttending = event && attendedEventIds.includes(event.id);
  const canEdit = Boolean(event && createdEvents.some((e) => String(e.id) === String(event.id)));
  const ticketTiers = event?.ticketTiers?.length ? event.ticketTiers : buildTicketTiers(event);
  const organizer = resolveEventOrganizer(event);

  const handleGetTicket = () => {
    if (!selectedTier) {
      setAttendError('Select a ticket tier first.');
      return;
    }
    const params = new URLSearchParams({
      event: String(event?.title || 'event'),
      tier: selectedTier,
    });
    window.location.assign(`https://bookme.com?${params.toString()}`);
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- sync banner with resolved image URL */
    setBannerSrc(primaryUrl);
  }, [primaryUrl, id]);

  useEffect(() => {
    if (!isAttending) setSelectedTier('');
  }, [isAttending, event?.id]);

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
            {canEdit ? (
              <div style={{ margin: '0.75rem 0 1.25rem' }}>
                <Link to={`/events/${event.id}/edit`} className="btn btn-ghost">
                  Edit this event
                </Link>
              </div>
            ) : null}
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
                    {organizer.organizerInitial}
                  </div>
                  <div>
                    <strong>{organizer.organizerName}</strong>
                    <a
                      className="organizer-email"
                      href={`mailto:${organizer.organizerEmail}`}
                    >
                      {organizer.organizerEmail}
                    </a>
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
                {event.ticketName || event.ticketPrice != null ? (
                  <p className="ticket-summary">
                    <strong>{event.ticketName || 'Ticket'}</strong>
                    {event.ticketPrice != null ? ` · PKR ${event.ticketPrice}` : ''}
                  </p>
                ) : null}
                <div className="ticket-tiers">
                  {ticketTiers.map((tier) => (
                    <div key={tier.segment} className="ticket-tier-row">
                      <label className="ticket-tier-check">
                        <input
                          type="checkbox"
                          checked={selectedTier === tier.segment}
                          disabled={!isAttending}
                          onChange={() => {
                            setAttendError('');
                            setSelectedTier((prev) => (prev === tier.segment ? '' : tier.segment));
                          }}
                        />
                        <span>{tier.segment}</span>
                      </label>
                      <strong>PKR {tier.price}</strong>
                    </div>
                  ))}
                </div>
                {!isLoggedIn ? (
                  <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                    Sign in to attend
                  </Link>
                ) : isAttending ? (
                  <>
                    <p className="attending-badge">You&apos;re attending</p>
                    {selectedTier ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        onClick={handleGetTicket}
                      >
                        Get ticket
                      </button>
                    ) : (
                      <p className="ticket-hint">Select one ticket tier to unlock Get ticket.</p>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-lg"
                      style={{ width: '100%' }}
                      disabled={actionLoading}
                      onClick={async () => {
                        setAttendError('');
                        setActionLoading(true);
                        try {
                          await leaveEvent(event.id);
                        } catch (err) {
                          setAttendError(err.message || 'Could not remove attendance.');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      Remove me from event
                    </button>
                  </>
                ) : (
                  <>
                    {attendError ? <p className="auth-error" role="alert" style={{ marginBottom: '0.75rem' }}>{attendError}</p> : null}
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={actionLoading}
                      onClick={async () => {
                        setAttendError('');
                        setActionLoading(true);
                        try {
                          await attendEvent(event);
                        } catch (err) {
                          setAttendError(err.message || 'Could not save RSVP.');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      {actionLoading ? 'Please wait…' : 'Attend event'}
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
