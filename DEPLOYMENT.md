# Deployment — Render + UptimeRobot

This guide deploys ODOC to **Render's free web service** and keeps it awake
with **UptimeRobot**. MongoDB stays on **Atlas** (external).

> Free-tier reality check: Render free services sleep after 15 min idle and
> have a ~30–60s cold start. UptimeRobot pings keep it warm. Good for a
> demo / school showcase; for long-term production, use Render Individual
> ($7/mo) or Railway Hobby ($5/mo) to avoid cold starts and job interruptions.

---

## 1. MongoDB Atlas

1. In Atlas > **Network Access**, add `0.0.0.0/0` (Render free has no static IP).
2. Copy your connection string (`mongodb+srv://...`). This is `MONGO_URI`.
3. Make sure the DB user + password are strong. This is your only real gate
   while the IP list is open.

## 2. Deploy to Render

1. Push this repo to GitHub (already done).
2. On [Render](https://render.com): **New > Blueprint**, pick this repo.
   Render reads [`render.yaml`](render.yaml) automatically.
3. When prompted, fill the secret env vars:
   - `MONGO_URI` — your Atlas string
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — long random strings
   - `APP_URL` — leave blank for now; set after the first deploy
   - Google OAuth + `SEED_*` — optional (app runs without Drive)
4. Click **Apply**. First build runs `npm install` then `npm start`.
5. After it goes live, copy the URL (e.g. `https://odoc-digital-archive.onrender.com`),
   set it as `APP_URL` in the dashboard, and redeploy.

### Seed the database (one time)

In the Render dashboard: your service > **Shell**, then run:

```bash
npm run seed
```

Default logins (forced password change on first login):

| Role        | Email                     | Password            |
| ----------- | ------------------------- | ------------------- |
| Super Admin | `superadmin@odoc.archive` | `ChangeMe!Super123` |
| Admin       | `admin@odoc.archive`      | `ChangeMe!Admin123` |

## 3. Keep it awake with UptimeRobot

1. Sign up at [UptimeRobot](https://uptimerobot.com) (free).
2. **Add New Monitor**:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `ODOC`
   - URL: `https://YOUR-APP.onrender.com/healthz`
   - Monitoring Interval: **5 minutes**
3. Save. The `/healthz` endpoint returns `{ "status": "ok" }` and is public
   (no auth, not gated by maintenance mode), so pings never 401/redirect.

That's it. The 5-minute pings prevent the 15-minute idle spindown.

---

## Notes & caveats

- **Health endpoint:** `GET /healthz` is intentionally public and lightweight.
  It does not touch the database, so it responds even during DB hiccups.
- **750 free hours/month:** enough for one always-on service (~720 h/month).
  Keeping it awake uses essentially all of it, so don't run a second free
  service in the same workspace.
- **Background uploads:** UptimeRobot prevents *idle* spindown, but Render may
  still restart free services for maintenance. In-memory upload jobs and OTPs
  are lost on restart. Fine for a demo; move them to Redis/DB for production.
- **Large uploads:** Render free has generous request limits (unlike Vercel),
  so the 50MB/file uploads work here.
