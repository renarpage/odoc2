# Release Notes

## v1.1.0 — Production hardening & serverless support (2026-07-11)

This release makes ODOC deployable anywhere — from a $0 Render free instance to
Vercel serverless — and removes the last pieces of ephemeral in-memory state.

### Added
- **Serverless support (Vercel-ready).** New `SERVERLESS` mode (auto-detected on
  Vercel) with `api/index.js` entrypoint and `vercel.json` routing.
- **Cached MongoDB connection** so warm serverless invocations reuse a single
  connection instead of exhausting the Atlas limit.
- **Persistent OTP store** (`Otp` model) with a TTL index — password-reset codes
  survive restarts and work across instances.
- **Persistent upload jobs** (`UploadJob` model) with a TTL index — background
  upload progress survives restarts; the dashboard reads it from the DB.
- **Public `/healthz` endpoint** for uptime pingers and platform health probes.
- **Render blueprint** (`render.yaml`) + **`DEPLOYMENT.md`** (Render + UptimeRobot).

### Changed
- **Upload execution adapts to the host:** detached (instant redirect) on a
  long-running server; inline (awaited) on serverless so uploads complete before
  the function returns.
- **Logging** skips file transports on serverless / read-only filesystems
  (console-only), preventing write errors.
- **`server.js`** only calls `app.listen` on a long-running host; always exports
  the app for serverless import.

### Fixed
- Background uploads and OTPs no longer vanish on restart or across instances.

### Deploy notes
- **Recommended:** long-running host (Render / Railway / VPS) with a static IP
  to whitelist a single Atlas IP. Runs unchanged.
- **Serverless:** set `SERVERLESS=true`. Caveat: platform request-body limits
  (Vercel ~4.5MB) cap upload size and large uploads may hit function timeouts.

---

## v1.0.0 — Initial backend

- MongoDB-backed layered rebuild of the ODOC platform (routes → controllers →
  services → repositories → models) behind the existing neumorphic frontend.
- JWT auth, Google Drive storage, activity CRUD, storage analytics, settings,
  and user management.
