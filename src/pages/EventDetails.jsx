import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/useAuth';
import { getEventById } from '../data/mock';
import { EVENT_IMAGE_FALLBACK, getEventImageByCategory } from '../constants/images';
import { buildTicketTiers } from '../lib/tickets';
import { resolveEventOrganizer } from '../lib/organizers';
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import './EventDetails.css';

function formatChatTime(value) {
  if (!value) return '';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function EventDetails() {
  const { id } = useParams();
  const {
    isLoggedIn,
    isAdmin,
    attendEvent,
    leaveEvent,
    attendedEventIds,
    createdEvents,
    user,
    followingIds,
    followOrganizer,
    unfollowOrganizer,
  } = useAuth();
  const [attendError, setAttendError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState('');
  const [organizerFollowersCount, setOrganizerFollowersCount] = useState(0);
  const [selectedTier, setSelectedTier] = useState('');
  const [remoteEvent, setRemoteEvent] = useState(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

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
  const primaryUrl = getEventImageByCategory(event?.category);
  const [bannerSrc, setBannerSrc] = useState(primaryUrl);
  const isAttending = event && attendedEventIds.includes(event.id);
  const canEdit = Boolean(event && createdEvents.some((e) => String(e.id) === String(event.id)));
  const reviewStatus = String(event?.reviewStatus || 'approved').toLowerCase();
  const isPublished = reviewStatus === 'approved';
  const ticketTiers = buildTicketTiers();
  const organizer = resolveEventOrganizer(event);
  const organizerId = String(event?.organizerId || '');
  const canFollowOrganizer = Boolean(isLoggedIn && organizerId && organizerId !== user?.uid);
  const isFollowingOrganizer = Boolean(organizerId && followingIds.includes(organizerId));

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
    setBannerSrc(primaryUrl);
  }, [primaryUrl, id]);

  useEffect(() => {
    if (!isAttending) setSelectedTier('');
  }, [isAttending, event?.id]);

  useEffect(() => {
    setFollowError('');
  }, [event?.id]);

  useEffect(() => {
    setChatError('');
    if (!db || !event?.id || !isLoggedIn || !isAttending) {
      setChatMessages([]);
      return undefined;
    }
    const messagesQuery = query(
      collection(db, 'events', event.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200),
    );
    return onSnapshot(
      messagesQuery,
      (snap) => {
        setChatMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          setChatMessages([]);
          setChatError('Chat permission denied. Publish the latest Firestore rules to enable real event chat.');
          return;
        }
        setChatMessages([]);
        setChatError('Could not load chat messages.');
      },
    );
  }, [event?.id, isLoggedIn, isAttending]);

  useEffect(() => {
    if (!db || !organizerId) {
      setOrganizerFollowersCount(0);
      return undefined;
    }
    return onSnapshot(
      collection(db, 'users', organizerId, 'followers'),
      (snap) => setOrganizerFollowersCount(snap.size),
      () => setOrganizerFollowersCount(0),
    );
  }, [organizerId]);

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

  if (!isPublished && !canEdit && !isAdmin) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="container section">
          <p>This event is under admin review and is not public yet.</p>
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
                    <p className="organizer-followers">{organizerFollowersCount} followers</p>
                    <a
                      className="organizer-email"
                      href={`mailto:${organizer.organizerEmail}`}
                    >
                      {organizer.organizerEmail}
                    </a>
                  </div>
                </div>
                {canFollowOrganizer ? (
                  <div className="organizer-follow-action">
                    {followError ? <p className="auth-error" role="alert">{followError}</p> : null}
                    <button
                      type="button"
                      className={`btn ${isFollowingOrganizer ? 'btn-ghost' : 'btn-primary'}`}
                      disabled={followLoading}
                      onClick={async () => {
                        setFollowError('');
                        setFollowLoading(true);
                        try {
                          if (isFollowingOrganizer) {
                            await unfollowOrganizer(organizerId);
                          } else {
                            await followOrganizer({
                              id: organizerId,
                              organizerEmail: organizer.organizerEmail,
                              organizerName: organizer.organizerName,
                            });
                          }
                        } catch (err) {
                          setFollowError(err.message || 'Could not update follow status.');
                        } finally {
                          setFollowLoading(false);
                        }
                      }}
                    >
                      {followLoading ? 'Please wait…' : isFollowingOrganizer ? 'Unfollow organizer' : 'Follow organizer'}
                    </button>
                  </div>
                ) : null}
              </div>
            </GlassSurface>
            {isAttending ? (
              <GlassSurface
                className="event-chat"
                borderRadius={20}
                width="100%"
                backgroundOpacity={0.06}
                saturation={1.4}
                displace={0.35}
                style={{ height: 'auto', marginTop: '1.5rem' }}
              >
                <div className="event-chat-inner">
                  <h3>Event chat</h3>
                  {chatError ? <p className="auth-error" role="alert">{chatError}</p> : null}
                  <div className="event-chat-messages">
                    {chatMessages.length === 0 ? (
                      <p className="event-chat-empty">No messages yet. Start the conversation.</p>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`event-chat-message ${message.uid === user?.uid ? 'event-chat-message--mine' : ''}`}
                        >
                          <div className="event-chat-message-head">
                            <strong>{message.senderName || 'Attendee'}</strong>
                            <span>{formatChatTime(message.createdAt)}</span>
                          </div>
                          <p>{message.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form
                    className="event-chat-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!event?.id || !isAttending) return;
                      const text = chatInput.trim();
                      if (!text || chatLoading) return;
                      setChatError('');
                      setChatLoading(true);
                      try {
                        await addDoc(collection(db, 'events', event.id, 'messages'), {
                          uid: user?.uid || '',
                          senderName: user?.email ? user.email.split('@')[0] : 'Attendee',
                          senderEmail: user?.email || '',
                          text,
                          createdAt: serverTimestamp(),
                          updatedAt: serverTimestamp(),
                        });
                        setChatInput('');
                      } catch (err) {
                        setChatError(err.message || 'Could not send message.');
                      } finally {
                        setChatLoading(false);
                      }
                    }}
                  >
                    <input
                      className="input"
                      type="text"
                      placeholder="Write a message…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      maxLength={800}
                    />
                    <button type="submit" className="btn btn-primary" disabled={chatLoading}>
                      {chatLoading ? 'Sending…' : 'Send'}
                    </button>
                  </form>
                </div>
              </GlassSurface>
            ) : null}
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
