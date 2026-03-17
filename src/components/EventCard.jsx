import { Link } from 'react-router-dom';
import GlassSurface from './GlassSurface';
import './EventCard.css';

export default function EventCard({ event, compact = false }) {
  const { id, title, date, time, location, image, category, attendeeCount } = event;
  const imageUrl = image || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=240&fit=crop`;

  return (
    <GlassSurface
      className="event-card-glass"
      borderRadius={24}
      width="100%"
      height="100%"
      backgroundOpacity={0.06}
      saturation={1.3}
      displace={0.3}
      style={{ minHeight: '320px' }}
    >
      <Link
        to={`/events/${id}`}
        className={`event-card ${compact ? 'event-card--compact' : ''}`}
      >
        <div className="event-card-image">
          <img src={imageUrl} alt={title} />
          {category && <span className="event-card-category">{category}</span>}
        </div>
        <div className="event-card-body">
          <h3 className="event-card-title">{title}</h3>
          <div className="event-card-meta">
            <span>{date}</span>
            {time && <span>{time}</span>}
            <span>{location}</span>
          </div>
          {attendeeCount != null && (
            <p className="event-card-attendees">{attendeeCount} attending</p>
          )}
        </div>
      </Link>
    </GlassSurface>
  );
}
