const MAX_TICKET_PRICE = 10000;

function hashString(input) {
  let h = 2166136261;
  const str = String(input || '');
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundTo50(value) {
  return Math.round(value / 50) * 50;
}

function eventScale(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('music')) return 1.22;
  if (c.includes('sports')) return 1.12;
  if (c.includes('arts')) return 1.08;
  if (c.includes('culture')) return 1.04;
  if (c.includes('community')) return 0.96;
  if (c.includes('workshop')) return 0.98;
  if (c.includes('tech')) return 0.9;
  if (c.includes('food')) return 0.82;
  return 1;
}

export function buildTicketTiers(eventLike) {
  const event = eventLike || {};
  const seed = hashString(`${event.id || ''}|${event.title || ''}|${event.category || ''}`);
  const rand = createRng(seed);
  const scale = eventScale(event.category);

  const baseGeneral = roundTo50(clamp((450 + rand() * 2200) * scale, 250, 3000));
  const standard = roundTo50(clamp(baseGeneral + (350 + rand() * 2200), baseGeneral + 200, 5500));
  const vip = roundTo50(clamp(standard + (700 + rand() * 2800), standard + 400, 8000));
  const box = roundTo50(clamp(vip + (800 + rand() * 3500), vip + 500, MAX_TICKET_PRICE));

  return [
    { segment: 'General', price: baseGeneral },
    { segment: 'Standard', price: standard },
    { segment: 'VIP', price: vip },
    { segment: 'Box', price: box },
  ];
}

