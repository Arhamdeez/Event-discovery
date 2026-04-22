const CACHE_KEY = 'event-discovery:autoCity:v1';
const LOCATION_CACHE_KEY = 'event-discovery:autoLocation:v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function readAutoCityCache() {
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

export function writeAutoCityCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    // ignore storage failures
  }
}

export function readAutoLocationCache() {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    const lat = Number(parsed.lat);
    const lon = Number(parsed.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      lat,
      lon,
      accuracy: Number(parsed.accuracy) || null,
    };
  } catch {
    return null;
  }
}

export function writeAutoLocationCache({ lat, lon, accuracy }) {
  try {
    localStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({ lat, lon, accuracy: accuracy ?? null, ts: Date.now() }),
    );
  } catch {
    // ignore storage failures
  }
}

export async function reverseGeocodeCity({ lat, lon }) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  // Use a slightly closer zoom so we can capture locality/suburb (e.g. Valencia).
  url.searchParams.set('zoom', '14');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('reverse-geocode-failed');
  const data = await res.json();
  const addr = data?.address || {};
  const city = (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.county ||
    addr.state_district ||
    addr.state ||
    ''
  ).toString().trim();
  const locality = (
    addr.suburb ||
    addr.neighbourhood ||
    addr.residential ||
    addr.quarter ||
    addr.city_district ||
    ''
  ).toString().trim();

  if (locality && city && locality.toLowerCase() !== city.toLowerCase()) {
    return `${locality}, ${city}`;
  }
  return city || locality || null;
}

export async function detectAndCacheAutoCity({ preferCache = true } = {}) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.geolocation) {
    return '';
  }

  if (preferCache) {
    const cached = readAutoCityCache();
    if (cached) return cached;
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 60 },
    );
  });

  writeAutoLocationCache({
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    accuracy: position.coords.accuracy,
  });

  const city = await reverseGeocodeCity({
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  });

  if (city) writeAutoCityCache(city);
  return city || '';
}

