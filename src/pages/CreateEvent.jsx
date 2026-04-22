import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import { useAuth } from '../context/useAuth';
import { categories } from '../data/mock';
import { EVENT_IMAGE_FALLBACK } from '../constants/images';
import './CreateEvent.css';

const defaultImage = EVENT_IMAGE_FALLBACK;

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toTimeInputValue(timeStr) {
  if (!timeStr) return '';
  const m = String(timeStr).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return '';
  let h = Number(m[1]);
  const min = Number(m[2] || '0');
  const ampm = m[3].toUpperCase();
  if (ampm === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  const hh = String(h).padStart(2, '0');
  const mm = String(min).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function CreateEvent() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, authLoading, addCreatedEvent, updateCreatedEvent, createdEvents } = useAuth();
  const [saveError, setSaveError] = useState(location.state?.saveError ?? null);
  const [saving, setSaving] = useState(false);

  const existing = useMemo(() => {
    if (!isEdit) return null;
    return createdEvents.find((e) => String(e.id) === String(id)) || null;
  }, [isEdit, createdEvents, id]);

  const initialCategorySlug = useMemo(() => {
    if (!existing?.category) return '';
    return categories.find((c) => c.name === existing.category)?.slug || '';
  }, [existing]);

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
    const ticketName = form.querySelector('#ticketName').value.trim();
    const ticketPriceRaw = form.querySelector('#ticketPrice').value.trim();
    const ticketUrl = form.querySelector('#ticketUrl').value.trim();
    const ticketPrice = ticketPriceRaw ? Number(ticketPriceRaw) : null;

    const event = {
      id: isEdit ? existing?.id || id : `user-${Date.now()}`,
      title: form.querySelector('#title').value.trim(),
      description: form.querySelector('#description').value.trim(),
      date: dateStr,
      time: timeStr,
      location: form.querySelector('#location').value.trim(),
      category: categoryName,
      attendeeCount: isEdit ? (existing?.attendeeCount ?? 0) : 0,
      image: form.querySelector('#image').value.trim() || defaultImage,
      ticketName: ticketName || undefined,
      ticketPrice: Number.isFinite(ticketPrice) ? ticketPrice : undefined,
      ticketUrl: ticketUrl || undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        if (!existing) throw new Error('You can only edit events you created.');
        await updateCreatedEvent(event);
      } else {
        await addCreatedEvent(event);
      }
      // Only leave this page after Firestore commit succeeds so refresh keeps the event.
      navigate('/dashboard', { replace: true, state: isEdit ? {} : { pendingCreatedEvent: event } });
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

  if (isEdit && !existing) {
    return (
      <div className="events-page">
        <Navbar />
        <main className="create-event-main">
          <div className="container">
            <p className="empty-state">Event not found (or you don’t have permission to edit it).</p>
            <Link to="/dashboard">Back to dashboard</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
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
                <input
                  id="title"
                  type="text"
                  className="input"
                  placeholder="e.g. Chai & Code — Gulberg"
                  defaultValue={existing?.title || ''}
                  required
                />
              </div>
            </div>
            <div className="input-wrap form-full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="textarea"
                placeholder="Describe your event — timing, dress code, language (Urdu/English), and what to bring."
                rows={4}
                defaultValue={existing?.description || ''}
              />
            </div>
            <div className="form-row form-grid">
              <div className="input-wrap">
                <label htmlFor="category">Category</label>
                <select id="category" className="select" defaultValue={initialCategorySlug} required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-wrap">
                <label htmlFor="date">Date</label>
                <input id="date" type="date" className="input" defaultValue={toDateInputValue(existing?.date)} required />
              </div>
              <div className="input-wrap">
                <label htmlFor="time">Time</label>
                <input id="time" type="time" className="input" defaultValue={toTimeInputValue(existing?.time)} required />
              </div>
            </div>
            <div className="input-wrap form-full">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                className="input"
                placeholder="e.g. Packages Mall, Lahore or F-7 Markaz, Islamabad"
                defaultValue={existing?.location || ''}
                required
              />
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
                defaultValue={existing?.image && existing.image !== defaultImage ? existing.image : ''}
              />
            </div>
            <div className="form-row form-grid">
              <div className="input-wrap">
                <label htmlFor="ticketName">Add ticket (name)</label>
                <input
                  id="ticketName"
                  type="text"
                  className="input"
                  placeholder="e.g. General Admission"
                  defaultValue={existing?.ticketName || ''}
                />
              </div>
              <div className="input-wrap">
                <label htmlFor="ticketPrice">Ticket price (PKR)</label>
                <input
                  id="ticketPrice"
                  type="number"
                  className="input"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 500"
                  defaultValue={existing?.ticketPrice ?? ''}
                />
              </div>
              <div className="input-wrap">
                <label htmlFor="ticketUrl">Ticket link (optional)</label>
                <input
                  id="ticketUrl"
                  type="url"
                  className="input"
                  placeholder="https://your-ticket-link"
                  defaultValue={existing?.ticketUrl || ''}
                />
              </div>
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
