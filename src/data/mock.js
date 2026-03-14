export const categories = [
  { id: 1, name: 'Music', slug: 'music', icon: '♪' },
  { id: 2, name: 'Tech', slug: 'tech', icon: '◈' },
  { id: 3, name: 'Sports', slug: 'sports', icon: '⚑' },
  { id: 4, name: 'Workshops', slug: 'workshops', icon: '◆' },
  { id: 5, name: 'Arts', slug: 'arts', icon: '◇' },
  { id: 6, name: 'Food', slug: 'food', icon: '◎' },
  { id: 7, name: 'Community', slug: 'community', icon: '◉' },
];

export const mockFeaturedEvents = [
  {
    id: '1',
    title: 'Campus Tech Meetup — Spring Edition',
    date: 'Mar 22, 2026',
    time: '6:00 PM',
    location: 'Student Center, Room 204',
    category: 'Tech',
    attendeeCount: 48,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=240&fit=crop',
  },
  {
    id: '2',
    title: 'Live Acoustic Night',
    date: 'Mar 24, 2026',
    time: '8:00 PM',
    location: 'The Loft Café',
    category: 'Music',
    attendeeCount: 32,
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=240&fit=crop',
  },
  {
    id: '3',
    title: 'Intro to Web3 & Blockchain',
    date: 'Mar 26, 2026',
    time: '2:00 PM',
    location: 'Engineering Hall',
    category: 'Workshops',
    attendeeCount: 24,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=240&fit=crop',
  },
];

export const mockEventsList = [
  ...mockFeaturedEvents,
  {
    id: '4',
    title: 'Community Run & Wellness',
    date: 'Mar 28, 2026',
    time: '7:00 AM',
    location: 'Riverside Park',
    category: 'Sports',
    attendeeCount: 89,
    image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=400&h=240&fit=crop',
  },
  {
    id: '5',
    title: 'Street Art & Murals Walk',
    date: 'Mar 30, 2026',
    time: '10:00 AM',
    location: 'Downtown Arts District',
    category: 'Arts',
    attendeeCount: 15,
    image: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400&h=240&fit=crop',
  },
  {
    id: '6',
    title: 'Food Festival — Local Vendors',
    date: 'Apr 2, 2026',
    time: '12:00 PM',
    location: 'City Square',
    category: 'Food',
    attendeeCount: 120,
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=240&fit=crop',
  },
];

export function getEventById(id) {
  return mockEventsList.find((e) => e.id === id) || mockFeaturedEvents.find((e) => e.id === id);
}
