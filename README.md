# Local Event Discovery Platform — MERN

A modern **liquid glass** event platform for students and community groups. Built with a **MERN backend** (`Express + MongoDB`) and a **React + Vite** frontend.

## Run

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Fill in `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`, then run:

```bash
# Terminal 1 (Gemini backend)
npm run server

# Terminal 2 (Vite frontend)
npm run dev
```

Open **http://localhost:5173** (the frontend proxies `/api/*` to the backend).

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

Core flows are API-backed: authentication, event CRUD/review, attendance, follow/unfollow, and event chat.
