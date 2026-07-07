# ODOC (One Door One Click) - Backend Implementation

Clean-Architecture backend for the OSIS SMAVO digital activity archive, wired into the existing
EJS + Bootstrap 5 + GSAP frontend. Every file listed below is **new** on the `odoc-backend` branch;
your existing `views/`, `public/`, `routes/`, `server.js`, and `data/store.js` are untouched.

> Download this branch as a ZIP from GitHub (Code -> Download ZIP on the `odoc-backend` branch) to get only these files layered on the repo.

## Stack
Node.js - Express - EJS - Bootstrap 5 - GSAP + Lenis - MongoDB (Mongoose) - Google Drive (storage) - JWT/bcrypt auth.

## Setup
```bash
cp package.backend.json package.json   # adopt the backend dependency set
npm install
cp .env.example .env                     # fill MONGO_URI, JWT secrets, Google Drive creds
npm run seed:admin                       # create the first SuperAdmin
npm run dev                              # http://localhost:3000
```

## Folder tree (new files)
```text
odoc/
|- package.backend.json         # backend dependency superset (rename to package.json)
|- .env.example                 # all runtime config
|- .gitignore .eslintrc.json .prettierrc
|- BACKEND_README.md
|- seed/
|  \- seedAdmin.js               # npm run seed:admin -> first SuperAdmin
\- src/
   |- server.js                 # HTTP bootstrap + graceful shutdown
   |- app.js                    # Express app factory (wires middleware + routes + branding)
   |- config/                   # env, database, logger, drive, cache
   |- constants/                # roles, activityStatus (+deriveStatus), notificationTypes, index
   |- core/                     # ApiError, ApiResponse, asyncHandler, BaseRepository
   |- models/                   # User, Activity, Gallery, Document, Notification, Setting, Visitor, Log
   |- repositories/             # user, activity, gallery, document, notification, setting, visitor, log
   |- services/                 # auth, token, storage(Drive), activity, gallery, document,
   |                            #   dashboard, notification, setting, analytics, export(PDF), healthcheck
   |- controllers/              # auth, guest, dashboard, activity, gallery, document,
   |                            #   notification, setting, analytics, export, admin
   |- middlewares/              # security, rateLimiter, auth, role(RBAC), csrf, validate,
   |                            #   upload(multer), cache(+ETag), visitor, notFound, error
   |- validators/               # auth, activity, setting (express-validator)
   |- helpers/                  # cookie, password, slug, pagination
   |- utils/                    # catchAsync, pick, sanitizeFilename, seo
   |- routes/                   # index, guest, auth, admin, api
   |- views/                    # auth/login.ejs, partials/notification-toast, partials/theme-vars
   |- public/
   |  |- css/theme.css          # Neumorphism system (#3155E7 / #f5f5f5 / #1a1a24)
   |  \- js/                    # smooth-scroll(Lenis+GSAP), lazyload(+infinite scroll), toast(+theme)
   \- logs/.gitkeep
```

## Spec coverage
- **Auth**: JWT access + refresh, HTTP-only signed secure cookies, bcrypt, remember-me, silent refresh, session-expiry detection, logout via tokenVersion bump.
- **Roles**: Guest (no login) / Standard Admin / Super Admin enforced by `role.middleware`.
- **Storage**: Google Drive service account, auto folder per activity, streamed uploads, download proxy (hides file IDs), quota usage.
- **Uploads**: multiple image/video/document, MIME + size validation, image compression + WebP via sharp.
- **Dashboard**: activity totals by status, gallery/doc counts, storage usage, visitor today/month/total, recent activity/logins, unread notifications, health check.
- **Activity**: full field set + create/edit/delete/duplicate/archive/draft-publish, slug, related/pinned/featured.
- **Gallery/Documents**: pagination, lazy load, infinite scroll, WebP, PDF/DOCX/XLSX/PPTX/ZIP, download counter.
- **Search & Filter**: Mongo text index + status/category/division/year/tag filters, debounce-ready JSON endpoint.
- **Notifications**: success/warning/error/info + toast + audit Log model.
- **Export**: Activity / Statistics / Gallery PDF via pdfkit (streamed).
- **Analytics**: visitor series, most viewed, most downloaded.
- **Security**: helmet+CSP (CDN-friendly), rate limiters, CSRF, mongo-sanitize, HPP, secure cookies, MIME/size validation, audit log.
- **Performance**: compression, in-memory cache + ETag, pagination, lazy load, infinite scroll, DB indexing, cache invalidation on writes.
- **Standards**: Clean Architecture (MVC + Repository + Service Layer), SOLID/DRY/KISS, ESLint + Prettier configs.

## Wiring notes (connect to existing frontend)
1. In your layouts (`views/layouts/guest.ejs` + `admin.ejs`), add before `</head>`:
   `<link rel="stylesheet" href="/assets/css/theme.css">` and `<%- include('partials/theme-vars') %>`.
2. Before `</body>` add the CDN scripts (GSAP, ScrollTrigger, Lenis) then:
   `<script src="/assets/js/smooth-scroll.js"></script>`, `lazyload.js`, `toast.js`, and `<%- include('partials/notification-toast') %>`.
3. Point the admin login link to `/login`; the guest archive grid should use `data-archive-grid` + a `data-archive-sentinel` div for infinite scroll.
4. Existing static assets stay served at `/static`; new theme assets are served at `/assets`.
