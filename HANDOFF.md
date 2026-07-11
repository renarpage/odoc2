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
  flash, pagination, response
- `models/` — User, Activity, Gallery, Document, Notification, Setting, Visitor,
  Log, Backup, RefreshToken, **Otp**, **UploadJob**
- `repositories/` — base + per-collection data access
- `services/` — auth, token, passwordReset, drive, activity, gallery, document,
  dashboard, storage, settings, user, log, uploadJob
- `middlewares/` — auth (JWT + silent refresh + RBAC), security (helmet/CSP/
  sanitize), rateLimiter, csrf, upload (multer memory), maintenance, locals,
  visitor, errorHandler, notFound
- `validators/`, `controllers/`, `routes/` (guest, auth, admin, api)
- `views/` — EJS (layouts, partials, admin, guest); **no inline `<style>`/
  `<script>`** — assets live in `public/css` & `public/js`
- `seeders/seed.js`

## Features

- **Auth:** JWT access + rotated refresh tokens (HttpOnly cookies), bcrypt,
  RBAC (`super_admin`, `standard_admin`), forced first-login password change.
- **Forgot password (OTP):** 6-digit code printed to the server console,
  **stored in MongoDB** (`Otp` model) with a 10-min TTL, 5-attempt cap, 30s
  resend cooldown, anti-enumeration responses.
- **Activities:** full CRUD + duplicate, draft/publish, visibility. Create
  redirects instantly; media uploads run as a **persisted background job**
  (`UploadJob` model) with a live dashboard progress panel polling
  `GET /api/admin/upload-jobs`.
- **Google Drive:** OAuth (personal Drive, recommended) or service-account
  fallback. Images via `lh3.googleusercontent.com/d/{id}`, videos via the
  Drive `/preview` iframe, ZIP download via `archiver`.
- **System settings:** general, SEO/meta, content limits, notifications, SMTP
  (+ test button), webhook, backup, and a site-wide **maintenance mode**
  (dedicated page; only admins bypass).
- **User management:** super admin full CRUD (create, edit, activate/deactivate,
  reset password, delete); standard admin is read-only.

## State & persistence (important)

Everything that used to be in-memory now lives in MongoDB, so state survives
restarts and works across multiple instances:

| Concern            | Before        | Now                                  |
| ------------------ | ------------- | ------------------------------------ |
| Password-reset OTP | in-memory Map | `Otp` collection (TTL auto-expire)   |
| Upload jobs        | in-memory Map | `UploadJob` collection (TTL 60s done)|

## Deployment

### Long-running host (recommended: Render / Railway / VPS)

Runs as-is. `npm start` connects to Mongo then listens.

- **Render + UptimeRobot:** see [`DEPLOYMENT.md`](DEPLOYMENT.md). `render.yaml`
  is a one-click blueprint; `GET /healthz` is a public probe for uptime pings.
- Use a host with a static IP so you can whitelist a single IP in Atlas.

### Serverless (Vercel) — supported, with caveats

Set `SERVERLESS=true` (auto-detected on Vercel). Behavior changes:

- **No `app.listen`** — `api/index.js` + `vercel.json` export the app.
- **Cached Mongo connection** — warm invocations reuse one connection.
- **Console-only logging** — file transports skipped (read-only FS).
- **Inline uploads** — upload jobs run awaited (a detached task would be killed
  when the function returns).

Remaining serverless caveat: platform request-body limits (Vercel ~4.5MB) cap
upload size, and large uploads can hit the function timeout. For heavy media,
prefer a long-running host or move to direct browser→Drive uploads.

## Environment (.env)

See `.env.example`. Key vars: `MONGO_URI`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `APP_URL`, `COOKIE_SECURE`, `GOOGLE_OAUTH_*`,
`STORAGE_CAPACITY_GB`, `SERVERLESS`, and `SEED_*`.

```bash
npm install
cp .env.example .env      # fill MONGO_URI, JWT secrets, Google OAuth creds
npm run seed              # admins + settings + sample activities
npm start                 # http://localhost:3000
```

Default seeded logins (force change on first login):
`superadmin@odoc.archive / ChangeMe!Super123`,
`admin@odoc.archive / ChangeMe!Admin123`.

## Tooling

- ESLint + Prettier + EditorConfig. Run `npm run lint` and `npm run format`.
- Boxed section-header comments across backend modules.

## Critical gotchas

1. **CSP** (`middlewares/security.js`): icon webfont from cdnjs must stay in
   `font-src`; CDNs in `connect-src` for sourcemaps. No inline `on*` handlers.
2. **Drive images:** use the lh3 host + `referrerpolicy="no-referrer"`.
3. **Uploads:** validate by **extension**, not MIME.
4. **CSS caching:** admin assets use `?v=N`; bump `N` on CSS/JS changes.

## Open items

- OTP delivery is console-only; SMTP fields exist but email sending isn't wired.
- Media pixel dimensions (WxH) not captured on upload.
- For multi-instance heavy load, consider a real job queue instead of the
  DB-backed job doc.
