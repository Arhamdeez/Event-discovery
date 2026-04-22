export const categories = [
  { id: 1, name: 'Music', slug: 'music', icon: '♪' },
  { id: 2, name: 'Tech', slug: 'tech', icon: '◈' },
  { id: 3, name: 'Sports', slug: 'sports', icon: '⚑' },
  { id: 4, name: 'Workshops', slug: 'workshops', icon: '◆' },
  { id: 5, name: 'Arts', slug: 'arts', icon: '◇' },
  { id: 6, name: 'Food', slug: 'food', icon: '◎' },
  { id: 7, name: 'Community', slug: 'community', icon: '◉' },
  { id: 8, name: 'Culture', slug: 'culture', icon: '۞' },
];

export const mockFeaturedEvents = [
  {
    id: '1',
    title: 'Chai, Code & Open Source — Lahore',
    date: 'Mar 22, 2026',
    time: '6:00 PM',
    location: 'Arfa Software Technology Park, Lahore',
    category: 'Tech',
    attendeeCount: 48,
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=480&fit=crop&q=80',
    description:
      'A relaxed evening for developers and students: serious talk about Git, open source, and freelancing. Urdu & English mix welcome. Bring your laptop or just your questions.',
    organizerName: 'Lahore Dev Community',
    organizerEmail: 'hello@lahoredev.pk',
    organizerInitial: 'L',
  },
  {
    id: '2',
    title: 'Arena Pulse — Live Pop & Punjabi Night',
    date: 'Mar 24, 2026',
    time: '8:30 PM',
    location: 'Punjab Stadium vicinity, Lahore',
    category: 'Music',
    attendeeCount: 4200,
    image:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=480&fit=crop&q=80',
    description:
      'Full production concert night: headline acts, lights, and a big singalong crowd. Gates open early; food stalls outside. Tickets scanned at entry — dress sharp, phones up for the drops.',
    organizerName: 'Pulse Live PK',
    organizerEmail: 'tickets@pulselive.pk',
    organizerInitial: 'P',
  },
  {
    id: '3',
    title: 'Velvet Sky — Rooftop DJ & Dance',
    date: 'Mar 26, 2026',
    time: '9:00 PM',
    location: 'Dolmen Mall Clifton rooftop, Karachi',
    category: 'Music',
    attendeeCount: 380,
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=480&fit=crop&q=80',
    description:
      'House and desi remix sets till late: LED rig, dance floor, and skyline views. 18+ event; smart casual. Table bookings via DM — come ready to actually use the dance floor.',
    organizerName: 'Karachi Night Series',
    organizerEmail: 'guestlist@kns.pk',
    organizerInitial: 'K',
  },
];

export const mockEventsList = [
  ...mockFeaturedEvents,
  {
    id: '4',
    title: 'Gully Cricket Tournament — Model Town',
    date: 'Mar 28, 2026',
    time: '7:00 AM',
    location: 'Model Town Park, Lahore',
    category: 'Sports',
    attendeeCount: 89,
    image:
      'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&h=480&fit=crop&q=80',
    description:
      'Tape-ball league finals and friendly matches. Teams of 6; kit or casual both fine. Nashta stalls nearby — come early for the cool morning breeze.',
    organizerName: 'Model Town Sports Club',
    organizerEmail: 'mtsc.lhr@gmail.com',
    organizerInitial: 'M',
  },
  {
    id: '5',
    title: 'Mic Drop Karachi — Comedy & Live Band',
    date: 'Mar 30, 2026',
    time: '7:30 PM',
    location: 'Arts Council of Pakistan, Karachi',
    category: 'Arts',
    attendeeCount: 220,
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=480&fit=crop&q=80',
    description:
      'Stand-up sets followed by a live band — theatre seating and standing zone. Drinks and snacks at the lobby bar. Urdu and English acts; doors close 15 min after start.',
    organizerName: 'Karachi Live Stage',
    organizerEmail: 'boxoffice@kls.pk',
    organizerInitial: 'S',
  },
  {
    id: '6',
    title: 'Burns Road Food Walk — Biryani & Kebab Night',
    date: 'Apr 2, 2026',
    time: '7:00 PM',
    location: 'Burns Road, Saddar, Karachi',
    category: 'Food',
    attendeeCount: 120,
    image:
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=480&fit=crop&q=80',
    description:
      'Guided evening through Karachi’s legendary food street: seekh kebab, nihari stops, and biryani debates. Comfy shoes; we’ll split bills locally (cash handy).',
    organizerName: 'Karachi Food Walks',
    organizerEmail: 'walks@khi.food',
    organizerInitial: 'F',
  },
  {
    id: '7',
    title: 'Spring Fest — Stages, Food Trucks & DJs',
    date: 'Apr 5, 2026',
    time: '4:00 PM',
    location: 'Fatima Jinnah Park (F-9), Islamabad',
    category: 'Community',
    attendeeCount: 2100,
    image:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=480&fit=crop&q=80',
    description:
      'Outdoor festival: multiple music stages, food trucks, flea market, and a late DJ tent. Family zone till sunset; ticket tiers on the website. Parking at designated lots only.',
    organizerName: 'Islamabad Fest Collective',
    organizerEmail: 'hello@isbfest.pk',
    organizerInitial: 'I',
  },
  {
    id: '8',
    title: 'Heritage Walk — Wazir Khan to Delhi Gate',
    date: 'Apr 8, 2026',
    time: '9:00 AM',
    location: 'Wazir Khan Mosque, Old Lahore',
    category: 'Culture',
    attendeeCount: 42,
    image:
      'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800&h=480&fit=crop&q=80',
    description:
      'Slow walk through Old Lahore: Mughal-era lanes, spice markets, and Walled City stories. Modest dress; comfortable shoes essential.',
    organizerName: 'Lahore Heritage Walks',
    organizerEmail: 'walks@lahoreheritage.pk',
    organizerInitial: 'H',
  },
  {
    id: '9',
    title: 'Peshawar — Chai & Startup Stories',
    date: 'Apr 12, 2026',
    time: '5:00 PM',
    location: 'Qissa Khwani Bazaar, Peshawar',
    category: 'Tech',
    attendeeCount: 28,
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=480&fit=crop&q=80',
    description:
      'Builders and students meet over green tea. Short talks on freelancing and SaaS — bilingual, Pashto-friendly Q&A.',
    organizerName: 'KP Tech Meetup',
    organizerEmail: 'hello@kptech.pk',
    organizerInitial: 'P',
  },
  {
    id: '10',
    title: 'Mehfil-e-Sama — Qawwali Night',
    date: 'Apr 14, 2026',
    time: '8:00 PM',
    location: 'Alhamra Arts Council, The Mall Road, Lahore',
    category: 'Culture',
    attendeeCount: 132,
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=480&fit=crop&q=80',
    description:
      'Traditional qawwali and Sufi kalam in a seated mehfil. Family-friendly; adab during performance. Light refreshments after the first set.',
    organizerName: 'Alhamra Cultural Society',
    organizerEmail: 'events@alhamra.org.pk',
    organizerInitial: 'A',
  },
  {
    id: '11',
    title: 'Truck Art & Miniature Painting Workshop',
    date: 'Apr 18, 2026',
    time: '2:00 PM',
    location: 'Lok Virsa Museum, Shakarparian, Islamabad',
    category: 'Workshops',
    attendeeCount: 36,
    image:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=480&fit=crop&q=80',
    description:
      'Pakistani truck art motifs on mini panels — florals, eagles, calligraphy. Materials included; take your piece home.',
    organizerName: 'Lok Virsa Workshops',
    organizerEmail: 'workshops@lokvirsa.gov.pk',
    organizerInitial: 'V',
  },
  {
    id: '12',
    title: 'Clifton Afterdark — Beach Lounge & Acoustic',
    date: 'Apr 20, 2026',
    time: '6:30 PM',
    location: 'Clifton Beach strip, Karachi',
    category: 'Music',
    attendeeCount: 156,
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=480&fit=crop&q=80',
    description:
      'Sunset acoustic sets then a chilled DJ set by the sea — lounge seating, fairy lights, and mocktails. Smart casual; sea breeze guaranteed.',
    organizerName: 'Sea Breeze Events',
    organizerEmail: 'hello@seabreeze.pk',
    organizerInitial: 'C',
  },
];

export function getEventById(id) {
  return mockEventsList.find((e) => e.id === id) || mockFeaturedEvents.find((e) => e.id === id);
}
