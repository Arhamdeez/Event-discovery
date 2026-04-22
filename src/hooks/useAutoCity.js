import { useEffect, useRef, useState } from 'react';
import {
  readAutoCityCache,
  readAutoLocationCache,
  writeAutoCityCache,
  writeAutoLocationCache,
  reverseGeocodeCity,
} from '../lib/autoCity';

export function useAutoCity({ enabled = true } = {}) {
  const [city, setCity] = useState(() => readAutoCityCache() || '');
  const [coords, setCoords] = useState(() => readAutoLocationCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (didRun.current) return;
    didRun.current = true;

    const cached = readAutoCityCache();
    if (cached) {
      setCity(cached);
    }
    const cachedCoords = readAutoLocationCache();
    if (cachedCoords) setCoords(cachedCoords);

    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const currentCoords = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          writeAutoLocationCache(currentCoords);
          setCoords(currentCoords);
          const next = await reverseGeocodeCity({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          if (next) {
            writeAutoCityCache(next);
            setCity(next);
          }
        } catch (e) {
          setError(e);
        } finally {
          setLoading(false);
        }
      },
      (e) => {
        setError(e);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 60 },
    );
  }, [enabled]);

  return { city, coords, loading, error, setCity };
}

