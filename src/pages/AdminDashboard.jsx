import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './AdminDashboard.css';

const PENDING_EVENTS = [
  { id: 'p1', title: 'Late Night Study Session', date: 'Mar 20', organizer: 'study@club.edu', status: 'pending' },
  { id: 'p2', title: 'Improv Comedy Night', date: 'Mar 25', organizer: 'comedy@club.edu', status: 'pending' },
];

const USERS = [
  { id: 'u1', email: 'alex@campus.edu', role: 'user', events: 3 },
  { id: 'u2', email: 'sam@campus.edu', role: 'user', events: 1 },
];

export default function AdminDashboard() {
  const [events, setEvents] = useState(PENDING_EVENTS);

  const handleApprove = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleReject = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="events-page">
      <Navbar />
      <main className="admin-main">
        <div className="container">
          <h1 className="admin-title">Admin dashboard</h1>

          <section className="admin-section glass">
            <h2>Pending events</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Organizer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-cell">No pending events.</td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev.id}>
                        <td>{ev.title}</td>
                        <td>{ev.date}</td>
                        <td>{ev.organizer}</td>
                        <td>
                          <div className="action-buttons">
                            <button type="button" className="btn btn-primary btn-approve" onClick={() => handleApprove(ev.id)}>
                              Approve
                            </button>
                            <button type="button" className="btn btn-ghost btn-reject" onClick={() => handleReject(ev.id)}>
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
          </section>

          <section className="admin-section glass">
            <h2>User management</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Events</th>
                  </tr>
                </thead>
                <tbody>
                  {USERS.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td><span className="role-badge">{u.role}</span></td>
                      <td>{u.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
