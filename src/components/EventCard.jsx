import { Link } from 'react-router-dom';
import './EventCard.css';
import ElectricBorder from './ElectricBorder';

export default function EventCard({ event, compact, featured = false }) {
  const { id, title, date, time, location, image, category, attendeeCount } = event;
  const imageUrl = image || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=240&fit=crop`;

  const card = (
    <Link
      to={`/events/${id}`}
      className={`event-card glass-card ${compact ? 'event-card--compact' : ''}`}
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
  );

  if (!featured) {
    return card;
  }

  return (
    <ElectricBorder
      color="#7df9ff"
      speed={1}
      chaos={0.12}
      borderRadius={24}
      thickness={2}
      style={{ borderRadius: 24 }}
    >
      {card}
    </ElectricBorder>
  );
}
