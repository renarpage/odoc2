# ODOC Digital Archive: Developer Handoff

**Repo:** github.com/renarpage/odoc2
**Branch:** all work is merged to `main`
**Stack:** Node.js / Express + EJS + Bootstrap 5 + GSAP, MongoDB (Mongoose),
JWT auth, Google Drive storage. Neumorphic theme, primary `#3155E7`.

---

## Project

ODOC (One Door One Click) is a public digital archive for OSIS SMAVO school
activities. The guest side (landing + activity detail) is public; an admin
panel manages everything behind JWT auth.

## Architecture (flat root + layered)

```
routes → controllers → services → repositories → models
```

- `config/` — env, db (cached mongoose), drive, logger (winston)
- `constants/` — roles, statuses, cookies, allowed upload ext/mime
- `core/` — ApiError, asyncHandler
- `helpers/` — serializers (map Mongo docs to view shapes), driveUrl, cookies,
  flash, pagination, response, bytes, slug
- `models/` — User, Activity, Gallery, Document, Notification, Setting, Visitor,
  Log, Backup, RefreshToken, Otp, UploadJob
- `repositories/` — base + per-collection data access
- `services/` — auth, token, passwordReset, drive, activity, gallery, document,
  dashboard, storage, settings, user, log, uploadJob
- `middlewares/` — auth, security, rateLimiter, csrf, upload (multer memory),
  maintenance, locals, visitor, errorHandler, notFound
- `controllers/` — auth, guest, dashboard, activity, gallery, document, media,
  settings, user, storage, **directUpload**
- `routes/` — guest, auth, admin, api
- `views/` — EJS (layouts, partials, admin, guest); **no inline `<style>`/
  `<script>`** — assets live in `public/css` & `public/js`
- `seeders/seed.js`

---

## What changed today (2026-07-11)

This session hardened the app for cheap/serverless hosting and moved all
ephemeral state into MongoDB. Highlights, newest first:

### 1. Direct browser-to-Drive uploads (always on)
File bytes no longer pass through the app server. The browser uploads each
file straight to Google Drive via a **resumable upload session**; the server
only issues the session and saves metadata.

- **Why:** avoids serverless request-body limits (Vercel ~4.5MB) AND keeps
  heavy uploads from taxing the process on any host (VPS included).
- **Flag:** `res.locals.directUpload = true` (always) → `views/layouts/admin.ejs`
  renders `<body data-direct-upload="true">` → `public/js/direct-upload.js`
  activates.
- **Flow (`public/js/direct-upload.js`):** on activity form submit with files:
  (1) create/update the activity via the JSON API to get its slug;
  (2) `POST /api/admin/activities/:slug/uploads/init` → returns a Drive session
  URL; (3) browser `PUT`s the file bytes to that URL (progress overlay);
  (4) `POST .../uploads/complete` shares the file + saves metadata.
- **Backend added (all additive, old paths untouched):**
  - `config/drive.js` → `getAuthClient()` (mints access tokens)
  - `services/driveService.js` → `createResumableSession()`, `finalizeFile()`
    (share "anyone with link" + read metadata). `uploadBuffer()` refactored to
    reuse `finalizeFile()`; behavior unchanged.
  - `services/gallery|documentService.js` → `attachUploaded(slug, driveId, ctx)`
  - `controllers/directUploadController.js` → `initUpload`, `completeUpload`
  - `routes/api.js` → `POST /admin/activities/:slug/uploads/init | /complete`
- **Fallback:** the server-side multipart routes
  (`POST /api/admin/activities/:slug/gallery|documents`) still exist and work.

> ⚠️ NOT yet runtime-tested. Verify: (a) Drive must be connected (Admin >
> Storage) or uploads fail; (b) confirm Google returns CORS headers for the
> browser `PUT` to the session URL — first thing to check if uploads fail;
> (c) confirm `activityService.create` parses committee/milestone arrays the
> same from JSON as from the form POST.

### 2. Persistent state (was in-memory)
| Concern            | Before        | Now                                   |
| ------------------ | ------------- | ------------------------------------- |
| Password-reset OTP | in-memory Map | `Otp` collection (TTL auto-expire)    |
| Upload jobs        | in-memory Map | `UploadJob` collection (TTL 60s done) |

Both models use MongoDB TTL indexes for auto-cleanup. Callers updated to await
the now-async service methods (`authController`, `dashboardController`).

### 3. Serverless-safe runtime
- `config/env.js` → `SERVERLESS` flag (auto-detects Vercel/Lambda).
- `config/db.js` → connection cached on `globalThis` (reused across warm
  invocations; avoids exhausting the Atlas connection limit).
- `config/logger.js` → skips file transports on serverless (read-only FS).
- `server.js` → only `app.listen` on a long-running host; always exports `app`.
  Adds a public `GET /healthz` (before auth/maintenance) for uptime pings.
- `services/uploadJobService.js` → runs inline (awaited) on serverless, detached
  (`setImmediate`) on a long-running host.
- `api/index.js` + `vercel.json` → Vercel entrypoint & routing.

### 4. Deployment assets
- `render.yaml` (one-click Render blueprint), `DEPLOYMENT.md` (Render +
  UptimeRobot). Note: Render/Railway now generally require a card; a debit card
  works. Any static-IP host lets you whitelist a single Atlas IP instead of
  `0.0.0.0/0`.

### 5. Docs & cleanup (earlier today)
- README/package.json rewritten to match the real backend; removed unused deps.
- ESLint + Prettier + EditorConfig + MIT LICENSE + CHANGELOG.
- Extracted inline CSS/JS from views into `public/css` & `public/js`.
- Boxed section-header comments across backend modules.
- Removed the Branding feature and the `ODOC.rar` artifact.

---

## Features

- **Auth:** JWT access + rotated refresh (HttpOnly cookies), bcrypt, RBAC
  (`super_admin`, `standard_admin`), forced first-login password change.
- **Forgot password (OTP):** 6-digit code printed to the server console, stored
  in `Otp` (10-min TTL, 5-attempt cap, 30s resend cooldown, anti-enumeration).
- **Activities:** full CRUD + duplicate, draft/publish, visibility; media via
  direct-to-Drive upload; live dashboard progress panel polls
  `GET /api/admin/upload-jobs`.
- **Google Drive:** OAuth (personal Drive, recommended) or service-account
  fallback. Images via `lh3.googleusercontent.com/d/{id}`, videos via Drive
  `/preview`, ZIP download via `archiver`.
- **System settings:** general, SEO/meta, content limits, notifications, SMTP
  (+ test), webhook, backup, and a site-wide maintenance mode (admins bypass).
- **User management:** super admin full CRUD; standard admin read-only.

---

## Run locally

```bash
npm install
cp .env.example .env      # fill MONGO_URI, JWT secrets, Google OAuth creds
npm run seed              # admins + settings + sample activities
npm start                 # http://localhost:3000
```

Default seeded logins (force change on first login):
`superadmin@odoc.archive / ChangeMe!Super123`,
`admin@odoc.archive / ChangeMe!Admin123`.

## Environment (.env)

Key vars: `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `APP_URL`,
`COOKIE_SECURE`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`,
`STORAGE_CAPACITY_GB`, `SERVERLESS`, `SEED_*`. See `.env.example`.

## Tooling

ESLint + Prettier + EditorConfig. `npm run lint`, `npm run format`.

## Critical gotchas

1. **CSP** (`middlewares/security.js`): icon webfont from cdnjs must stay in
   `font-src`; CDNs in `connect-src`. No inline `on*` handlers.
2. **Drive images:** use the lh3 host + `referrerpolicy="no-referrer"`.
3. **Uploads:** validate by **extension**, not MIME. Direct-upload sends bytes
   browser→Drive; the server sees only metadata.
4. **CSS caching:** admin assets use `?v=N`; bump `N` on CSS/JS changes.

## Open items / not verified

- **Direct upload not runtime-tested** (see warning above). CORS on the Drive
  `PUT` and JSON-vs-form field parsing are the two things to confirm.
- OTP delivery is console-only; SMTP fields exist but email sending isn't wired.
- Media pixel dimensions (WxH) not captured on upload.
- For multi-instance heavy load, consider a real job queue instead of the
  DB-backed job doc.
