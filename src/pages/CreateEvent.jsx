import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { categories } from '../data/mock';
import './CreateEvent.css';

export default function CreateEvent() {
  const isEdit = false;

  return (
    <div className="events-page">
      <Navbar />
      <main className="create-event-main">
        <div className="container create-event-inner">
          <div className="create-event-header">
            <Link to="/dashboard" className="back-link">← Dashboard</Link>
            <h1>{isEdit ? 'Edit event' : 'Create event'}</h1>
          </div>
          <form className="create-event-form glass">
            <div className="form-row">
              <div className="input-wrap form-full">
                <label htmlFor="title">Title</label>
                <input id="title" type="text" className="input" placeholder="Event name" required />
              </div>
            </div>
            <div className="input-wrap form-full">
              <label htmlFor="description">Description</label>
              <textarea id="description" className="textarea" placeholder="What's your event about?" rows={4} />
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
              <input id="location" type="text" className="input" placeholder="Venue or address" required />
            </div>
            <div className="input-wrap form-full">
              <label htmlFor="image">Event image URL</label>
              <input id="image" type="url" className="input" placeholder="https://..." />
            </div>
            <div className="form-actions">
              <Link to="/dashboard" className="btn btn-ghost">Cancel</Link>
              <button type="submit" className="btn btn-primary btn-lg">
                {isEdit ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
