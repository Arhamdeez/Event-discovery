import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/useAuth';
import { auth, db } from '../lib/firebase';
import './AdminDashboard.css';

function millis(value) {
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  return 0;
}

export default function AdminDashboard() {
  const [allEvents, setAllEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState('');
  const { isLoggedIn, isAdmin, authLoading, user, adminEmails = [] } = useAuth();

  useEffect(() => {
    if (!db || !isLoggedIn || !isAdmin) return undefined;
    const unsubEvents = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => millis(b.updatedAt) - millis(a.updatedAt));
        setAllEvents(list);
      },
      () => {
        setActionError('Could not load event submissions.');
      },
    );
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsers(
          snap.docs.map((d) => ({
            id: d.id,
            email: d.data()?.email || '',
          })),
        );
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          setActionError('Could not load users: permission denied. Deploy the latest Firestore rules, then sign out and sign in with an admin email.');
          return;
        }
        setActionError(`Could not load users: ${err?.message || 'unknown error.'}`);
      },
    );
    return () => {
      unsubEvents();
      unsubUsers();
    };
  }, [isLoggedIn, isAdmin]);

  const eventCountsByOrganizer = useMemo(() => {
    return allEvents.reduce((acc, ev) => {
      const organizerId = String(ev.organizerId || '');
      if (!organizerId) return acc;
      if (!acc[organizerId]) {
        acc[organizerId] = { total: 0, pending: 0, approved: 0, rejected: 0 };
      }
      acc[organizerId].total += 1;
      const status = String(ev.reviewStatus || 'approved').toLowerCase();
      if (status === 'pending') acc[organizerId].pending += 1;
      else if (status === 'rejected') acc[organizerId].rejected += 1;
      else acc[organizerId].approved += 1;
      return acc;
    }, {});
  }, [allEvents]);

  const pendingEvents = allEvents.filter((ev) => String(ev.reviewStatus || 'approved').toLowerCase() === 'pending');

  const adminEmailSet = new Set(adminEmails.map((email) => String(email || '').toLowerCase()));

  const handleReview = async (event, nextStatus) => {
    if (!db || !event?.id) return;
    setActionError('');
    setProcessingId(event.id);
    try {
      const batch = writeBatch(db);
      const eventRef = doc(db, 'events', event.id);
      batch.set(
        eventRef,
        {
          reviewStatus: nextStatus,
          reviewedBy: user?.email || '',
          reviewedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      if (event.organizerId) {
        const userEventRef = doc(db, 'users', String(event.organizerId), 'createdEvents', event.id);
        batch.set(
          userEventRef,
          {
            reviewStatus: nextStatus,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
      await batch.commit();
      if (nextStatus === 'approved' && auth?.currentUser && event.organizerId) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          const response = await fetch('/api/notify-approved-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              eventId: event.id,
              organizerId: String(event.organizerId),
              organizerName: event.organizerName || '',
              title: event.title || 'Untitled event',
              date: event.date || '',
              time: event.time || '',
              location: event.location || '',
            }),
          });
          if (!response.ok) {
            const bodyText = await response.text();
            let payload = {};
            try {
              payload = bodyText ? JSON.parse(bodyText) : {};
            } catch {
              payload = {};
            }
            throw new Error(
              payload.error
                || bodyText
                || `Notification request failed (HTTP ${response.status}).`,
            );
          }
          const notifyPayload = await response.json().catch(() => ({}));
          const sent = Number(notifyPayload.sent || 0);
          const failed = Number(notifyPayload.failed || 0);
          const reason = String(notifyPayload.reason || '');
          if (failed > 0) {
            throw new Error(
              `Email delivery failed for ${failed} recipient(s). Sent: ${sent}. ${reason}`.trim(),
            );
          }
          if (sent === 0) {
            throw new Error(
              reason || 'No emails were sent. Verify that the organizer has followers with email addresses.',
            );
          }
        } catch (notifyErr) {
          setActionError(`Event approved, but email notification failed: ${notifyErr.message || 'unknown error.'}`);
        }
      }
    } catch (err) {
      setActionError(err.message || 'Could not update review status.');
    } finally {
      setProcessingId('');
    }
  };

  if (authLoading) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="admin-main">
          <div className="container">
            <p className="empty-state">Loading…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to={isLoggedIn ? '/' : '/login'} replace />;
  }

  return (
    <div className="events-page">
      <Navbar />
      <main className="admin-main">
        <div className="container">
          <h1 className="admin-title">Admin dashboard</h1>
          {actionError ? <p className="admin-error" role="alert">{actionError}</p> : null}

          <GlassSurface
            className="admin-section"
            borderRadius={20}
            width="100%"
            backgroundOpacity={0.06}
            saturation={1.4}
            displace={0.35}
            style={{ height: 'auto', marginBottom: '2rem' }}
          >
            <div className="admin-section-inner">
              <h2>Pending events</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Organizer</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-cell">No pending events.</td>
                      </tr>
                    ) : (
                      pendingEvents.map((ev) => (
                        <tr key={ev.id}>
                          <td>{ev.title}</td>
                          <td>{ev.date}</td>
                          <td>{ev.organizerEmail || 'Unknown organizer'}</td>
                          <td>{ev.category || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="btn btn-primary btn-approve"
                                disabled={processingId === ev.id}
                                onClick={() => handleReview(ev, 'approved')}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-reject"
                                disabled={processingId === ev.id}
                                onClick={() => handleReview(ev, 'rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassSurface>

          <GlassSurface
            className="admin-section"
            borderRadius={20}
            width="100%"
            backgroundOpacity={0.06}
            saturation={1.4}
            displace={0.35}
            style={{ height: 'auto' }}
          >
            <div className="admin-section-inner">
              <h2>User management</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Events</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-cell">No users found.</td>
                      </tr>
                    ) : users.map((u) => {
                      const role = adminEmailSet.has(String(u.email || '').toLowerCase()) ? 'admin' : 'user';
                      const counts = eventCountsByOrganizer[u.id] || { total: 0, pending: 0 };
                      return (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td><span className="role-badge">{role}</span></td>
                          <td>{counts.total}</td>
                          <td>{counts.pending}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassSurface>
        </div>
      </main>
      <Footer />
    </div>
  );
}
