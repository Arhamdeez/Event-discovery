import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/AuthContext';
import { categories } from '../data/mock';
import { EVENT_IMAGE_FALLBACK } from '../constants/images';
import './CreateEvent.css';

const defaultImage = EVENT_IMAGE_FALLBACK;

export default function CreateEvent() {
  const isEdit = false;
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, authLoading, addCreatedEvent } = useAuth();
  const [saveError, setSaveError] = useState(location.state?.saveError ?? null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    const form = e.target;
    const categorySlug = form.querySelector('#category').value;
    const categoryName = categories.find((c) => c.slug === categorySlug)?.name || categorySlug;
    const dateVal = form.querySelector('#date').value;
    const dateStr = dateVal ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const timeVal = form.querySelector('#time').value;
    const timeStr = timeVal ? new Date(`2000-01-01T${timeVal}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

    const event = {
      id: `user-${Date.now()}`,
      title: form.querySelector('#title').value.trim(),
      description: form.querySelector('#description').value.trim(),
      date: dateStr,
      time: timeStr,
      location: form.querySelector('#location').value.trim(),
      category: categoryName,
      attendeeCount: 0,
      image: form.querySelector('#image').value.trim() || defaultImage,
    };

    setSaving(true);
    try {
      await addCreatedEvent(event);
      // Only leave this page after Firestore commit succeeds so refresh keeps the event.
      navigate('/dashboard', { replace: true, state: { pendingCreatedEvent: event } });
    } catch (err) {
      setSaveError(err.message || 'Could not save the event.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="create-event-main">
          <div className="container">
            <p className="empty-state">Loading…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="events-page">
      <Navbar />
      <main className="create-event-main">
        <div className="container create-event-inner">
          <div className="create-event-header">
            <Link to="/dashboard" className="back-link">← Dashboard</Link>
            <h1>{isEdit ? 'Edit event' : 'Create event'}</h1>
          </div>
          <GlassSurface
            className="create-event-form-wrap"
            borderRadius={32}
            width="100%"
            backgroundOpacity={0.06}
            saturation={1.4}
            displace={0.4}
            style={{ height: 'auto' }}
          >
            <form className="create-event-form" onSubmit={handleSubmit} aria-busy={saving}>
            {saveError ? (
              <div className="create-event-error-row" style={{ marginBottom: '1rem' }}>
                <p className="auth-error" role="alert" style={{ marginBottom: '0.5rem' }}>{saveError}</p>
                <button type="button" className="btn btn-ghost" onClick={() => { setSaveError(null); navigate('.', { replace: true, state: {} }); }}>
                  Dismiss
                </button>
              </div>
            ) : null}
            <div className="form-row">
              <div className="input-wrap form-full">
                <label htmlFor="title">Title</label>
                <input id="title" type="text" className="input" placeholder="e.g. Chai & Code — Gulberg" required />
              </div>
            </div>
            <div className="input-wrap form-full">
              <label htmlFor="description">Description</label>
              <textarea id="description" className="textarea" placeholder="Describe your event — timing, dress code, language (Urdu/English), and what to bring." rows={4} />
            </div>
            <div className="form-row form-grid">
              <div className="input-wrap">
                <label htmlFor="category">Category</label>
                <select id="category" className="select" required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-wrap">
                <label htmlFor="date">Date</label>
                <input id="date" type="date" className="input" required />
              </div>
              <div className="input-wrap">
                <label htmlFor="time">Time</label>
                <input id="time" type="time" className="input" required />
              </div>
            </div>
            <div className="input-wrap form-full">
              <label htmlFor="location">Location</label>
              <input id="location" type="text" className="input" placeholder="e.g. Packages Mall, Lahore or F-7 Markaz, Islamabad" required />
            </div>
            <div className="input-wrap form-full">
              <label htmlFor="image">Event image URL</label>
              <input
                id="image"
                type="text"
                className="input"
                placeholder="https://... (optional)"
                inputMode="url"
                autoComplete="off"
              />
            </div>
            <div className="form-actions">
              <Link to="/dashboard" className="btn btn-ghost">Cancel</Link>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </form>
          </GlassSurface>
        </div>
      </main>
      <Footer />
    </div>
  );
}
