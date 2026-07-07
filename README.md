# ODOC Digital Archive

Full-stack recreation of the ODOC platform — a public activity archive with an
admin panel — built with **Node.js, Express, EJS, Bootstrap 5, and GSAP**.

## Stack

- **Node.js + Express** — server & routing
- **EJS + express-ejs-layouts** — templating, with two layouts:
  - `views/layouts/guest.ejs` → navbar + footer (public site)
  - `views/layouts/admin.ejs` → sidebar + topbar (admin panel)
- **Bootstrap 5** (CDN) + custom `public/css/style.css` design system
- **GSAP** (CDN) — hero/page-load and scroll-reveal animations
- **Bootstrap Icons** (CDN)
- In-memory mock data store (`data/store.js`) — swap this out for a real
  database (MongoDB/Postgres/etc.) later; every route already reads/writes
  through this single module so it's a clean seam to replace.

## Project structure

```
odoc-archive/
├── server.js                 # App entry point
├── routes/
│   ├── guest.js               # "/", "/activity/:id"
│   └── admin.js                # "/admin/*"
├── data/
│   └── store.js               # Mock in-memory data + helpers
├── views/
│   ├── layouts/
│   │   ├── guest.ejs           # navbar + footer wrapper
│   │   └── admin.ejs           # sidebar + topbar wrapper
│   ├── partials/
│   │   ├── navbar.ejs
│   │   ├── footer.ejs
│   │   ├── sidebar.ejs
│   │   └── admin-topbar.ejs
│   ├── home.ejs                 # public landing / archive listing
│   ├── activity-detail.ejs      # public activity detail
│   ├── 404.ejs
│   └── admin/
│       ├── dashboard.ejs
│       ├── activities.ejs       # activity manager (table + filters)
│       ├── activity-form.ejs    # 4-step "Create Activity" wizard
│       ├── storage.ejs
│       ├── branding.ejs
│       ├── settings.ejs
│       └── users.ejs
└── public/
    ├── css/style.css
    └── js/
        ├── main.js              # GSAP reveal + guest theme toggle
        └── admin.js             # sidebar toggle, wizard logic, uploads
```

## Running it

```bash
npm install
npm start          # http://localhost:3000
# or, for auto-reload during development:
npm run dev
```

## Pages

**Guest (navbar + footer):**
- `/` — landing hero + filterable activity gallery
- `/activity/:id` — activity detail (overview, visual archive, documents,
  committee, milestones)

**Admin (sidebar + topbar):**
- `/admin` — dashboard (stats, recent activities, quick upload, system logs)
- `/admin/activities` — activity manager table with filters & pagination
- `/admin/activities/new` — 4-step activity creation wizard (Basic Info →
  Documentation → Committee → Review), posts to the mock store
- `/admin/storage` — Google Drive-style storage analytics
- `/admin/branding` — color palette / messaging editor with live preview
- `/admin/settings` — general, security, notifications, API & integrations
- `/admin/users` — placeholder

## Notes

- File uploads in the UI are cosmetic (drag/drop styling only) — no files are
  actually persisted. Wire up `multer` (already installed) if you want real
  uploads.
- All data resets on server restart since it's stored in memory.
- Colors/typography match the original ODOC screenshots (primary `#3155E7`),
  centralized as CSS variables in `public/css/style.css` for easy re-theming
  — the Branding page's color fields are meant to eventually drive these.
