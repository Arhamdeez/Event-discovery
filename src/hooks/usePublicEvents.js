import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export function usePublicEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiRequest('/api/events');
        if (!cancelled) {
          setEvents(data?.events || []);
        }
      } catch {
        // Keep previously fetched events if API request fails.
      }
    };
    load();
    const interval = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return events;
}
