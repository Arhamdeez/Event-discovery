import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlassSurface from './GlassSurface';
import { EVENT_IMAGE_FALLBACK } from '../constants/images';
import './EventCard.css';

export default function EventCard({ event, compact = false }) {
  const { id, title, date, time, location, image, category, attendeeCount } = event;
  const primaryUrl = image || EVENT_IMAGE_FALLBACK;
  const [imgSrc, setImgSrc] = useState(primaryUrl);

  useEffect(() => {
    setImgSrc(primaryUrl);
  }, [primaryUrl]);

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
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setImgSrc(EVENT_IMAGE_FALLBACK)}
          />
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
