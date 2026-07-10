# ODOC Digital Archive: Developer Handoff

**Repo:** github.com/renarpage/odoc2  
**Branch:** all work is merged to `main`  
**Stack:** Node.js / Express + EJS + Bootstrap 5 + GSAP, MongoDB (Mongoose), JWT auth, Google Drive storage.

## Project

ODOC (One Door One Click) is a public digital archive for OSIS SMAVO school
activities. Guest side (landing + activity detail) is public; an admin panel
manages everything. It began as a finished frontend backed by an in-memory
`data/store.js`. The task was to build a production backend behind it **without
changing the visual design** (neumorphism theme, primary `#3155E7`).

## Architecture (flat root + layered)

- `config/` — env, db (mongoose), drive (OAuth + service account), logger (winston)
- `constants/` — roles, statuses, cookies, allowed upload ext/mime
- `core/` — ApiError, asyncHandler
- `helpers/` — **serializers** (maps Mongo docs to the exact shapes the EJS views
  already expect — the plug-and-play seam), driveUrl, capacity, cookies, flash,
  bytes, pagination, response
- `models/` — User, Activity, Gallery, Document, Notification, Setting, Visitor,
  Log, Backup, RefreshToken
- `repositories/` — base + per-collection data access (Repository Pattern)
- `services/` — auth, token, passwordReset, drive, activity, gallery, document,
  dashboard, storage, branding, settings, user, log, uploadJob
- `middlewares/` — auth (JWT + silent refresh + RBAC), security (helmet/CSP/
  sanitize), rateLimiter, csrf, upload (multer memory), validate, locals,
  visitor, errorHandler, notFound
- `validators/`, `controllers/`, `routes/` (guest, auth, admin, api)
- `seeders/seed.js`, `views/`

## Features implemented

### Auth
- JWT access + rotated refresh tokens (hashed, HttpOnly cookies), bcrypt.
- RBAC: `super_admin`, `standard_admin`. Forced password change on first login.
- **Forgot password via 6-digit OTP printed to the server console**
  (`services/passwordResetService.js`): in-memory, 10 min expiry, 5-attempt cap,
  30s resend cooldown, anti user-enumeration responses. Flow: `/forgot-password`
  -> code to console -> `/reset-password` -> set new password.

### Activities
- Full CRUD + duplicate, draft/publish, visibility.
- Fields: title, category, status, start/end date, location, organizer,
  division, tags, summary, description (multi-paragraph), cover, gallery,
  documents, committee, milestones. Admin form fields match the public detail
  page 1:1.
- **Create redirects to the dashboard instantly**; cover/gallery/document
  uploads run in a **background job** (`services/uploadJobService.js`, in-memory)
  with a live progress panel on the dashboard that polls
  `GET /api/admin/upload-jobs`.

### Google Drive
- **OAuth to a personal account** is the recommended mode (real storage quota,
  no "service accounts have no quota" errors); service account is a fallback.
  Connect / disconnect at Admin > Storage.
- Display images via `https://lh3.googleusercontent.com/d/{id}` — NOT
  `uc?export=view` (that 302s to a scan page and fails inside `<img>`).
- Videos play inline via the Drive `/preview` iframe.
- **ZIP download**: `GET /api/activities/:slug/media.zip?ids=a,b,c` streams the
  selected (or all) gallery files as one archive (`archiver`).
- Uploaded files are set to "anyone with link" automatically.

### Storage capacity resolution (helpers/capacity.js)
Real Drive quota limit -> `storageCapacityGB` (Settings/DB) ->
`STORAGE_CAPACITY_GB` env -> 15 GB default. (Previously hardcoded to 1 TB.)

### Guest UI
- Instant client-side filter + pagination (9/page), no reload.
- Equal-height activity cards, 3-line clamped descriptions.
- Activity detail: hero shows organizer/division/tags/summary. Media Archive
  grid capped to ~4 rows with a `+N more` tile that opens the media modal.
- **Media modal**: hero preview (image or playable video) + thumbnail grid with
  per-file checkbox select, Select All, per-file download, and Download Selected
  (ZIP). Custom **fullscreen overlay** (image + video) with a close button that
  works on mobile (native fullscreen API is unreliable on iOS).

### Neumorphic controls
Native `<select>` option lists and the native date picker cannot be themed, so
`public/js/neu-controls.js` enhances them into a custom neumorphic dropdown and
a flatpickr date picker. Underlying elements stay in the DOM so form submit and
`onchange` handlers keep working.

## Critical gotchas (learned the hard way)

1. **CSP** (`middlewares/security.js`):
   - Bootstrap Icons webfont loads from cdnjs -> must be in `font-src`.
   - CDN sourcemaps need the CDNs in `connect-src`.
   - `script-src-attr 'none'` **blocks inline `on*` attributes**. All image
     load/error and click logic MUST live in a `<script>`, never inline.
2. **Drive images**: use the lh3 host, add `referrerpolicy="no-referrer"`.
3. **Video hero**: an exact 16:9 frame clips the Drive control bar; the playing
   state uses aspect-ratio 16:10 (16:11 on mobile).
4. **Uploads**: validate by **file extension**, not MIME (browsers send
   `application/x-zip-compressed`, `application/octet-stream`, etc.). Validate
   client-side on selection so unsupported files are rejected immediately.
   Per-request file cap is 200 (`MAX_FILES_PER_REQUEST`).
5. **CSS caching**: admin assets use `?v=N` cache-busting; bump `N` when you
   change CSS/JS, and hard-refresh (Ctrl+Shift+R).
6. **Global section centering**: `section { min-height:80vh; justify-content:
   center }` re-centers content vertically, which makes the layout jump when a
   filter changes the number of visible cards. Override with `flex-start` on
   such sections (already done for `#archive`).

## Environment (.env)

`NODE_ENV`, `PORT`, `APP_URL`, `MONGO_URI`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `BCRYPT_ROUNDS`,
`COOKIE_SECURE`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`,
`STORAGE_CAPACITY_GB`, `MAX_FILES_PER_REQUEST`, `MAX_UPLOAD_BYTES`,
`RATE_LIMIT_*`, and `SEED_*` admin credentials. See `.env.example`.

```bash
npm install
cp .env.example .env      # fill MONGO_URI, JWT secrets, Google OAuth creds
npm run seed              # seeds admins + branding/settings + 8 sample activities
npm start                 # http://localhost:3000
```

Default seeded logins (force password change on first login):
`superadmin@odoc.archive / ChangeMe!Super123`, `admin@odoc.archive / ChangeMe!Admin123`.

## Open items / not verified

- The app has not been executed in this environment. Needs `npm install`, a live
  MongoDB, and Drive connected to verify end-to-end.
- OTP store and upload jobs are **in-memory** (single-process; lost on restart).
  Move to Redis/DB for multi-instance deployments.
- OTP delivery is console-only; SMTP settings fields exist but email sending is
  not wired.
- Media pixel dimensions (WxH) are not captured on upload.
