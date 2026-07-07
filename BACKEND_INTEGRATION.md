# ODOC Backend Integration

Production backend integrated into the existing (final) EJS/Bootstrap/GSAP frontend.
Stack: **Node + Express + MongoDB (Mongoose) + JWT (access + rotated refresh) + bcrypt + Google Drive**.

## Architecture (flat root + layers)

```
config/        env, db, drive, logger
constants/     roles, statuses, cookies, mime
core/          ApiError, asyncHandler
helpers/       serializers (view-shape mapping), cookies, flash, slug, pagination, bytes, response
middlewares/   auth (JWT + refresh), security (helmet/sanitize), rateLimiter, csrf, upload, validate, locals, visitor, errorHandler, notFound
models/        User, Activity, Gallery, Document, Notification, Setting, Visitor, Log, Backup, RefreshToken
repositories/  base + per-collection data access (Repository Pattern)
services/      auth, token, drive, activity, gallery, document, dashboard, branding, settings, user, log (Service Layer)
validators/    auth, activity, user
controllers/   auth, guest, dashboard, activity, gallery, document, branding, settings, storage, user
routes/        guest, auth, admin, api
seeders/       seed.js
views/         + auth/login, auth/change-password, error, admin/forbidden (new; existing views untouched)
```

## Why the frontend didn't change

Controllers pass **the exact same locals** the existing views already read
(`activities`, `allActivities`, `activeFilter`, `activity`, `stats`, `branding`,
`settings`, `recentActivities`, `systemLogs`, `recentUploads`). The
`helpers/serializers.js` module maps Mongo documents into those shapes, so
templates render byte-for-byte the same. The 3 existing POST endpoints keep
their original URLs (`/admin/activities/new`, `/admin/branding`, `/admin/settings`).

## Setup

```bash
npm install
cp .env.example .env      # fill in MONGO_URI, JWT secrets, Google Drive creds
npm run seed              # seeds admins + branding/settings + 8 sample activities
npm start                 # or: npm run dev
```

Default admin accounts (from `.env`, `mustChangePassword` forces a reset on first login):

- Super Admin: `superadmin@odoc.archive` / `ChangeMe!Super123`
- Standard Admin: `admin@odoc.archive` / `ChangeMe!Admin123`

## Google Drive

Uploads stream directly to Drive (multer memory storage, no disk writes). Set
`GOOGLE_DRIVE_ENABLED=true` plus a service-account `GOOGLE_CLIENT_EMAIL` /
`GOOGLE_PRIVATE_KEY` and a shared `GOOGLE_DRIVE_ROOT_FOLDER_ID`. Each activity
gets its own Drive subfolder automatically. With Drive disabled, the app runs
normally and upload endpoints return a clear 500 until configured.

## API surface (JSON)

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`
- `GET /api/activities/search?q=&filter=&page=` (public instant search)
- `GET/POST/PUT/DELETE /api/admin/activities[...]`, `POST /api/admin/activities/:slug/duplicate`
- `POST /api/admin/activities/:slug/gallery`, `POST /api/admin/activities/:slug/documents` (multipart `files`)
- `PUT /api/admin/branding`, `PUT /api/admin/settings`
- `GET/POST/PUT/DELETE /api/admin/users` (Super Admin)
- `GET /api/admin/health`, `GET /api/admin/dashboard/stats`

## Security

Helmet + CSP, NoSQL sanitization, rate limiting (stricter on auth), HTTP-only
secure cookies, JWT access + rotated hashed refresh tokens, bcrypt, input
validation, upload MIME + size validation, audit logging, role-based access.

## Optional frontend hardening (additive, non-visual)

These are the only remaining touch-ups. All are additive (hidden inputs /
attributes only) and change nothing visually. Until applied, everything still
works: the 3 legacy form routes are CSRF-exempt (see `middlewares/csrf.js`
`IGNORE_PATHS`).

1. Add `<%- include('partials/csrf') %>` inside the three legacy `<form>`s
   (activity wizard, branding, settings), then remove those paths from
   `IGNORE_PATHS` to enforce CSRF everywhere.
2. To bind the admin topbar identity to the logged-in user, replace the static
   name/role in `views/partials/admin-topbar.ejs` with `currentUser.name` /
   `currentUser.roleLabel` (already provided in locals).
3. Wire the existing Edit/Delete/Duplicate buttons and upload drop zones to the
   JSON API endpoints above when you want in-place actions without full reloads.
