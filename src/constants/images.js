/** Verified Unsplash URL — used when event image is missing or fails to load */
export const EVENT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=720&fit=crop&q=80';

/**
 * One shared image per category to keep visuals consistent
 * across events of the same type.
 */
export const EVENT_CATEGORY_IMAGES = {
  music: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=720&fit=crop&q=80',
  tech: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=720&fit=crop&q=80',
  sports: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&h=720&fit=crop&q=80',
  workshops: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=720&fit=crop&q=80',
  arts: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=720&fit=crop&q=80',
  food: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&h=720&fit=crop&q=80',
  community: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=720&fit=crop&q=80',
  culture: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=1200&h=720&fit=crop&q=80',
  gaming: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=720&fit=crop&q=80',
};

export function getEventImageByCategory(category) {
  const key = String(category || '').trim().toLowerCase();
  return EVENT_CATEGORY_IMAGES[key] || EVENT_IMAGE_FALLBACK;
}
