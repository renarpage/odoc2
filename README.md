# ODOC Digital Archive

**ODOC (One Door One Click)** is a public digital archive for OSIS SMAVO school
activities, backed by a secure admin panel. The public site lets anyone browse
and download activity media; the admin panel manages everything behind JWT auth.

Built with **Node.js, Express, EJS, MongoDB (Mongoose), and Google Drive** for
media storage, styled with a custom **neumorphic** design system on top of
Bootstrap 5.

---

## Features

- **Public archive** — filterable, paginated activity gallery + rich detail pages
  with a media viewer (image/video), fullscreen overlay, and ZIP download.
- **JWT auth** — access + rotated refresh tokens (HttpOnly cookies), bcrypt
  hashing, RBAC (`super_admin`, `standard_admin`), forced first-login password
  change, and OTP-based password reset.
- **Activity management** — full CRUD, draft/publish, duplicate, and background
  media uploads with a live progress panel.
- **Google Drive storage** — OAuth (personal Drive) or service-account fallback,
  with automatic "anyone with link" sharing and inline image/video rendering.
- **System settings** — general config, SEO/meta, content limits, notifications,
  SMTP + webhooks, backup, and a site-wide **maintenance mode**.
- **User management** — super admins manage all accounts; standard admins are
  read-only.

---

## Tech stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Runtime    | Node.js 18+ / Express                                             |
| Views      | EJS + express-ejs-layouts                                         |
| Database   | MongoDB via Mongoose                                              |
| Auth       | JWT (jsonwebtoken) + bcryptjs                                     |
| Storage    | Google Drive (googleapis)                                         |
| Security   | helmet, express-rate-limit, express-mongo-sanitize, CSRF tokens   |
| Email      | nodemailer                                                        |
| Media      | multer (upload), archiver (ZIP)                                   |
| Logging    | winston                                                           |
| Styling    | Bootstrap 5 (CDN) + custom neumorphic CSS                         |

---

## Project structure

```
odoc2/
├─ server.js               # App entry: middleware chain + route mounting
├─ config/                 # env, db, drive, logger
├─ constants/              # Shared enums (roles, statuses, cookies, upload rules)
├─ core/                   # ApiError, asyncHandler
├─ helpers/                # serializers, driveUrl, capacity, cookies, flash, ...
├─ models/                 # Mongoose schemas (User, Activity, Setting, ...)
├─ repositories/           # Data-access layer (Repository Pattern)
├─ services/               # Business logic (auth, activity, settings, user, ...)
├─ middlewares/            # auth, security, csrf, maintenance, upload, ...
├─ validators/             # Request validation
├─ controllers/            # HTTP handlers (thin; delegate to services)
├─ routes/                 # guest, auth, admin, api
├─ seeders/                # seed.js (admins + settings + sample activities)
├─ views/                  # EJS templates (layouts, partials, admin, guest)
└─ public/                 # css/, js/ static assets
```

**Layered flow:** `routes → controllers → services → repositories → models`.
Controllers stay thin; business logic lives in services; all DB access goes
through repositories. `helpers/serializers.js` maps Mongo documents to the exact
shapes the EJS views expect.

---

## Getting started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)
- (Optional) Google OAuth credentials for Drive storage

### Setup

```bash
npm install
cp .env.example .env      # fill in MONGO_URI, JWT secrets, Google OAuth creds
npm run seed              # seed admins, settings, and 8 sample activities
npm start                 # http://localhost:3000
```

For development with auto-reload:

```bash
npm run dev
```

### Default seeded logins

| Role        | Email                      | Password             |
| ----------- | -------------------------- | -------------------- |
| Super Admin | `superadmin@odoc.archive`  | `ChangeMe!Super123`  |
| Admin       | `admin@odoc.archive`       | `ChangeMe!Admin123`  |

> Both accounts are forced to change their password on first login.

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Key ones:

| Variable                     | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `MONGO_URI`                  | MongoDB connection string                    |
| `JWT_ACCESS_SECRET`          | Secret for signing access tokens             |
| `JWT_REFRESH_SECRET`         | Secret for signing refresh tokens            |
| `GOOGLE_OAUTH_CLIENT_ID`     | Google OAuth client ID (Drive storage)       |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret                   |
| `STORAGE_CAPACITY_GB`        | Displayed storage cap when Drive reports none |

---

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm start`         | Start the production server          |
| `npm run dev`       | Start with nodemon auto-reload       |
| `npm run seed`      | Seed the database                    |
| `npm run lint`      | Lint all JS with ESLint              |
| `npm run lint:fix`  | Lint and auto-fix                    |
| `npm run format`    | Format with Prettier                 |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding conventions and workflow.

## License

[MIT](LICENSE)
