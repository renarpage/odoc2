# ODOC Digital Archive: Developer Handoff

**Repo:** github.com/renarpage/odoc2
**Branch:** all work is merged to `main`
**Stack:** Node.js / Express + EJS + Bootstrap 5 + GSAP, MongoDB (Mongoose),
JWT auth, Google Drive storage. Neumorphic theme, primary `#3155E7`.
**Last updated:** 2026-07-11

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
- `helpers/` — serializers, driveUrl, cookies, flash, pagination, response,
  bytes, slug
- `models/` — User, Activity, Gallery, Document, Notification, Setting, Visitor,
  Log, Backup, RefreshToken, Otp, UploadJob
- `repositories/` — base + per-collection data access
- `services/` — auth, token, passwordReset, drive, activity, gallery, document,
  dashboard, storage, settings, user, log, uploadJob
- `middlewares/` — auth, security (helmet/CSP), rateLimiter, csrf, upload
  (multer memory), maintenance, locals, visitor, errorHandler, notFound
- `controllers/` — auth, guest, dashboard, activity, gallery, document, media,
  settings, user, storage, directUpload
- `routes/` — guest, auth, admin, api
- `views/` — EJS (layouts, partials, admin, guest); no inline `<style>`/
  `<script>` — assets in `public/css` & `public/js`
- `seeders/seed.js`

---

## Upload model (READ THIS FIRST)

Uploads are **direct browser-to-Drive, always on** (`res.locals.directUpload =
true` in `middlewares/locals.js`). File bytes never pass through the app
server on any host.

**Flow** (`public/js/direct-upload.js`, active because
`<body data-direct-upload="true">`):
1. On activity form submit with files, create/update the activity via the JSON
   API (`POST /api/admin/activities` or `PUT .../:slug`) to get the slug.
2. `POST /api/admin/activities/:slug/uploads/init` `{kind,name,mimeType}` →
   server opens a Drive **resumable session** and returns `{ sessionUrl }`.
3. Browser `PUT`s the file bytes straight to `sessionUrl` (progress overlay).
4. `POST /api/admin/activities/:slug/uploads/complete` `{kind,driveId}` → server
   shares the file ("anyone with link") + saves metadata
   (`gallery|documentService.attachUploaded`, or sets `activity.cover`).

**Server-side multipart routes still exist** as a fallback and are unchanged:
`POST /api/admin/activities/:slug/gallery|documents` (multer memory).

**Key backend pieces:**
- `config/drive.js` → `getAuthClient()` mints access tokens (OAuth or JWT).
- `services/driveService.js` → `createResumableSession({name,mimeType,folderId,
  origin})`, `finalizeFile(fileId)`, `uploadBuffer(...)` (server path, reuses
  `finalizeFile`).
- `controllers/directUploadController.js` → `initUpload`, `completeUpload`.

---

## Today's changes (2026-07-11), newest first

1. **CORS fix for direct upload.** `createResumableSession` now sends an
   `Origin` header (threaded from the request via `initUpload`, falling back to
   `env.APP_URL`). Google only returns a CORS-enabled session URL when the
   session-open request declares the origin; without it the browser `PUT`
   succeeded server-side (HTTP 200) but the browser blocked reading the
   response (`No 'Access-Control-Allow-Origin'`).
2. **CSP fix for direct upload.** `middlewares/security.js` `connect-src` now
   allows `https://www.googleapis.com`, `https://*.googleapis.com`, and
   `https://lh3.googleusercontent.com`. Previously the browser blocked the
   upload request as a CSP violation.
3. **Direct upload made always-on** (`locals.js`), so heavy uploads don't tax
   the server process on ANY host (VPS included), not just serverless.
4. **Direct browser-to-Drive upload feature** added (see "Upload model").
   Additive; server-side multipart paths untouched.
5. **Persistent state (was in-memory):**
   | Concern            | Now                                   |
   | ------------------ | ------------------------------------- |
   | Password-reset OTP | `Otp` collection (TTL auto-expire)    |
   | Upload jobs        | `UploadJob` collection (TTL 60s done) |
   Callers updated to await the now-async methods (`authController`,
   `dashboardController`).
6. **Serverless-safe runtime:** `SERVERLESS` env flag (auto-detects Vercel);
   cached Mongo connection on `globalThis`; console-only logging on read-only
   FS; `server.js` only `listen`s on a long-running host and always exports
   `app`; public `GET /healthz`; `uploadJobService` runs inline on serverless,
   detached otherwise; `api/index.js` + `vercel.json`.
7. **Deployment assets:** `render.yaml`, `DEPLOYMENT.md` (Render + UptimeRobot).
8. **Docs & cleanup (earlier):** README/package.json rewritten; ESLint +
   Prettier + EditorConfig + MIT LICENSE + CHANGELOG; inline CSS/JS extracted
   from views; boxed comment headers across backend; Branding feature and
   `ODOC.rar` removed.

---

## ⚠️ Potential errors / not fully verified (start here when debugging)

**Direct upload has been iterated on but is not confirmed working end-to-end.**
Progress so far: CSP blocker fixed, CORS `Origin` fix applied. If upload still
fails, check in this order:

1. **CORS on the PUT (most likely).** Symptom: console shows
   `net::ERR_FAILED 200 (OK)` + `No 'Access-Control-Allow-Origin'`. The bytes
   reach Google but the browser rejects the response. The `Origin`-header fix
   targets this; if it persists, verify the value of `Origin`/`APP_URL` sent
   from `initUpload` matches the browser origin exactly (scheme + host + port,
   e.g. `http://localhost:3000`), and confirm the `location` session URL is
   PUT to verbatim (no proxy rewrite).
2. **Drive must be connected.** Direct upload is impossible without Google
   Drive OAuth (Admin > Storage). If not connected, `init` throws 500
   "Google Drive is not connected."
3. **JSON vs form field parsing.** The direct-upload path creates the activity
   via the JSON API, not the multipart form. Confirm `activityService.create`
   parses repeated fields (committee, milestones, tags) identically from a JSON
   body as from the urlencoded form POST. If committee/milestones go missing on
   serverless/direct-upload saves, this is why.
4. **`script-src-attr 'none'` console warning.** There is still an inline
   `on*=` handler somewhere in the views triggering a CSP warning. Not fatal
   and unrelated to uploads, but should be moved into a JS file for full CSP
   cleanliness.
5. **`favicon.ico 404`.** Cosmetic; no favicon route/file. Ignore or add one.

**Other open items:**
- Direct upload not yet load-tested with many concurrent large files.
- OTP delivery is console-only; SMTP fields exist but email sending isn't wired.
- Media pixel dimensions (WxH) not captured on upload.
- For multi-instance heavy load, consider a real job queue instead of the
  DB-backed `UploadJob` doc.

---

## Features

- **Auth:** JWT access + rotated refresh (HttpOnly cookies), bcrypt, RBAC
  (`super_admin`, `standard_admin`), forced first-login password change.
- **Forgot password (OTP):** 6-digit code printed to server console, stored in
  `Otp` (10-min TTL, 5-attempt cap, 30s resend cooldown, anti-enumeration).
- **Activities:** full CRUD + duplicate, draft/publish, visibility; media via
  direct-to-Drive upload.
- **Google Drive:** OAuth (recommended) or service-account fallback. Images via
  `lh3.googleusercontent.com/d/{id}`, videos via Drive `/preview`, ZIP via
  `archiver`.
- **System settings:** general, SEO/meta, content limits, notifications, SMTP
  (+ test), webhook, backup, site-wide maintenance mode (admins bypass).
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

Key vars: `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `APP_URL`
(used as the CORS Origin fallback for uploads — set it correctly in prod),
`COOKIE_SECURE`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`,
`STORAGE_CAPACITY_GB`, `SERVERLESS`, `SEED_*`. See `.env.example`.

## Tooling

ESLint + Prettier + EditorConfig. `npm run lint`, `npm run format`.

## Critical gotchas

1. **CSP** (`middlewares/security.js`): icon webfont from cdnjs in `font-src`;
   CDNs + `*.googleapis.com` + `lh3` in `connect-src`. No inline `on*` handlers.
2. **Drive images:** use the lh3 host + `referrerpolicy="no-referrer"`.
3. **Uploads:** validate by **extension**, not MIME. Bytes go browser→Drive;
   the server sees only metadata.
4. **CSS caching:** admin assets use `?v=N`; bump `N` on CSS/JS changes.
5. **APP_URL matters for uploads:** it is the CORS `Origin` fallback when the
   request has no Origin header. Wrong value = blocked browser PUT.
