const ORGANIZER_POOL = [
  { name: 'City Connect Collective', email: 'hello@cityconnect.pk' },
  { name: 'Pulse Events Pakistan', email: 'team@pulsepk.live' },
  { name: 'Rooftop Nights Co.', email: 'bookings@rooftopnights.pk' },
  { name: 'Campus Circuit', email: 'events@campuscircuit.pk' },
  { name: 'Metro Meetup House', email: 'host@metromeetup.pk' },
  { name: 'Heritage Routes', email: 'walks@heritageroutes.pk' },
  { name: 'Festival Lane', email: 'tickets@festivallane.pk' },
  { name: 'Chai & Community', email: 'hello@chai-community.pk' },
];

function hashString(input) {
  let h = 2166136261;
  const str = String(input || '');
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function resolveEventOrganizer(eventLike) {
  const event = eventLike || {};
  if (event.organizerName || event.organizerEmail) {
    const existingName = event.organizerName || event.organizerEmail || 'Raunaq Host';
    return {
      organizerName: existingName,
      organizerEmail: event.organizerEmail || 'events@raunaq.app',
      organizerInitial: (event.organizerInitial || existingName).toString().charAt(0).toUpperCase(),
    };
  }

  const key = `${event.id || ''}|${event.title || ''}|${event.category || ''}`;
  const idx = hashString(key) % ORGANIZER_POOL.length;
  const selected = ORGANIZER_POOL[idx];

  return {
    organizerName: selected.name,
    organizerEmail: selected.email,
    organizerInitial: selected.name.charAt(0).toUpperCase(),
  };
}

