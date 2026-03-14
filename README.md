# Local Event Discovery Platform — UI

A modern **liquid glass** web UI for a local event discovery platform (students & community). Built with **React + Vite** and ready to plug into a MERN backend.

## Run

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing: hero, search, featured events, categories |
| `/events` | Events listing with filters & sort |
| `/events/:id` | Event details, organizer, “Attend” |
| `/login` | Login form |
| `/signup` | Sign up (email, password, confirm) |
| `/dashboard` | User dashboard: Created / Joined events, create button |
| `/events/new` | Create (or edit) event form |
| `/admin` | Admin: pending events (approve/reject), user table |

## Design

- **Liquid glass**: Frosted glass panels with `backdrop-filter`, soft gradients, light borders, and inner highlights.
- **Light theme** with primary blue (`#0c6b9e`), soft shadows, rounded cards.
- **Typography**: Outfit (headings), DM Sans (body).
- **Responsive** layout and grids; mobile-friendly nav.

## Structure

- `src/components/` — Navbar, Footer, EventCard
- `src/pages/` — One file per page + CSS
- `src/data/mock.js` — Mock events and categories for UI
- `src/index.css` — Design tokens and glass utilities

Forms and buttons are non-functional (no API); connect to your MERN backend as needed.
