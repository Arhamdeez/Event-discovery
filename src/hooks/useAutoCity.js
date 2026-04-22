import { useEffect, useRef, useState } from 'react';

const CACHE_KEY = 'event-discovery:autoCity:v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.value || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return String(parsed.value);
  } catch {
    return null;
  }
}

function writeCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    // ignore storage failures
  }
}

async function reverseGeocodeCity({ lat, lon }) {
  // Nominatim (OpenStreetMap) reverse geocoding: no API key required.
  // Keep it lightweight and tolerant to failures.
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('zoom', '10');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('reverse-geocode-failed');
  const data = await res.json();
  const addr = data?.address || {};
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.county ||
    addr.state_district ||
    addr.state ||
    null
  );
}

export function useAutoCity({ enabled = true } = {}) {
  const [city, setCity] = useState(() => readCache() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (didRun.current) return;
    didRun.current = true;

    const cached = readCache();
    if (cached) {
      setCity(cached);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const next = await reverseGeocodeCity({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          if (next) {
            writeCache(next);
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

  return { city, loading, error, setCity };
}

