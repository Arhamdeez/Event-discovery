import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/useAuth';
import { getEventById } from '../data/mock';
import { usePublicFirestoreEvents } from '../hooks/usePublicFirestoreEvents';
import './Dashboard.css';

const TABS = [
  { id: 'created', label: 'Created Events' },
  { id: 'joined', label: 'Joined Events' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('created');
  const [followBusyId, setFollowBusyId] = useState('');
  const [followError, setFollowError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isLoggedIn,
    authLoading,
    createdEvents,
    attendedEventIds,
    user,
    logout,
    followersCount,
    followingIds,
    followableOrganizers,
    followOrganizer,
    unfollowOrganizer,
  } = useAuth();
  const publicEvents = usePublicFirestoreEvents();

  const pendingCreatedEvent = location.state?.pendingCreatedEvent;
  const pendingId = pendingCreatedEvent?.id;

  const displayCreatedEvents = useMemo(() => {
    if (!pendingId || !pendingCreatedEvent) return createdEvents;
    if (createdEvents.some((e) => e.id === pendingId)) return createdEvents;
    return [pendingCreatedEvent, ...createdEvents];
  }, [pendingId, pendingCreatedEvent, createdEvents]);

  useEffect(() => {
    if (!pendingId) return;
    if (createdEvents.some((e) => e.id === pendingId)) {
      navigate('/dashboard', { replace: true, state: {} });
    }
  }, [pendingId, createdEvents, navigate]);

  const joinedEvents = useMemo(() => {
    return attendedEventIds
      .map(
        (id) =>
          getEventById(id) ||
          createdEvents.find((e) => e.id === id) ||
          publicEvents.find((e) => e.id === id),
      )
      .filter(Boolean);
  }, [attendedEventIds, createdEvents, publicEvents]);

  const handleFollowToggle = async (organizer) => {
    if (!organizer?.id) return;
    setFollowError('');
    setFollowBusyId(organizer.id);
    try {
      if (followingIds.includes(organizer.id)) {
        await unfollowOrganizer(organizer.id);
      } else {
        await followOrganizer(organizer);
      }
    } catch (err) {
      setFollowError(err.message || 'Could not update follow status.');
    } finally {
      setFollowBusyId('');
    }
  };

  if (authLoading) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="dashboard-main">
          <div className="container">
            <p className="empty-state">Loading…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="dashboard-main">
          <div className="container">
            <GlassSurface
              className="dashboard-auth-card"
              borderRadius={20}
              width="100%"
              backgroundOpacity={0.06}
              saturation={1.3}
              displace={0.3}
              style={{ height: 'auto' }}
            >
              <div className="dashboard-auth-card-inner">
                <h1>Dashboard</h1>
                <p>Sign in to manage your created events and joined events in one place.</p>
                <div className="dashboard-auth-actions">
                  <Link to="/login" className="btn btn-primary">Sign in</Link>
                  <Link to="/signup" className="btn btn-ghost">Create account</Link>
                </div>
              </div>
            </GlassSurface>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="events-page">
      <Navbar />
      <main className="dashboard-main">
        <div className="container">
          <GlassSurface
            className="dashboard-account-card"
            borderRadius={16}
            width="100%"
            backgroundOpacity={0.06}
            saturation={1.3}
            displace={0.3}
            style={{ height: 'auto', marginBottom: '1rem' }}
          >
            <div className="dashboard-account-inner">
              <div>
                <p className="dashboard-account-label">Signed in as</p>
                <p className="dashboard-account-email">{user?.email || 'User'}</p>
                <p className="dashboard-followers-count">Followers: {followersCount}</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Sign out
              </button>
            </div>
          </GlassSurface>
          <GlassSurface
            className="dashboard-follow-card"
            borderRadius={16}
            width="100%"
            backgroundOpacity={0.06}
            saturation={1.3}
            displace={0.3}
            style={{ height: 'auto', marginBottom: '1rem' }}
          >
            <div className="dashboard-follow-inner">
              <div>
                <h2>Who to follow</h2>
                <p>Follow active organizers to get notified when their events are approved.</p>
              </div>
              {followError ? (
                <p className="auth-error dashboard-follow-error" role="alert">{followError}</p>
              ) : null}
              <div className="dashboard-follow-list">
                {followableOrganizers.length ? followableOrganizers.map((organizer) => {
                  const isFollowing = followingIds.includes(organizer.id);
                  return (
                    <div key={organizer.id} className="dashboard-follow-item">
                      <div>
                        <strong>{organizer.organizerName || 'Organizer'}</strong>
                        {organizer.organizerEmail ? (
                          <p>{organizer.organizerEmail}</p>
                        ) : (
                          <p>User ID: {organizer.id}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`btn ${isFollowing ? 'btn-ghost' : 'btn-primary'}`}
                        disabled={followBusyId === organizer.id}
                        onClick={() => handleFollowToggle(organizer)}
                      >
                        {followBusyId === organizer.id
                          ? 'Please wait…'
                          : isFollowing
                            ? 'Unfollow'
                            : 'Follow'}
                      </button>
                    </div>
                  );
                }) : (
                  <p className="empty-state" style={{ padding: '0.25rem 0 0' }}>
                    No organizers available right now.
                  </p>
                )}
              </div>
            </div>
          </GlassSurface>
          <div className="dashboard-header">
            <div>
              <h1>My events</h1>
              {pendingId && !createdEvents.some((e) => e.id === pendingId) ? (
                <p className="dashboard-sync-hint">Finishing save to the cloud…</p>
              ) : null}
            </div>
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
                {displayCreatedEvents.length ? displayCreatedEvents.map((ev) => (
                  <div key={ev.id} className="dashboard-event-tile">
                    <EventCard event={ev} />
                    <div className="dashboard-event-actions">
                      <Link to={`/events/${ev.id}/edit`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                    </div>
                  </div>
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
