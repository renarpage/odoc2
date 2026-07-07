/**
 * Centralized environment loader + validator.
 * Fails fast at boot if a required variable is missing so we never run
 * a half-configured production server.
 */
require("dotenv").config();

const REQUIRED = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "COOKIE_SECRET",
];

// Google Drive is required only when storage is actually enabled.
const DRIVE_REQUIRED = [
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_DRIVE_ROOT_FOLDER_ID",
];

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function int(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: (process.env.NODE_ENV || "development") === "production",
  port: int(process.env.PORT, 3000),
  appUrl: process.env.APP_URL || "http://localhost:3000",

  mongoUri: process.env.MONGO_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },

  cookie: {
    secret: process.env.COOKIE_SECRET,
    // refresh token cookie max-age in ms (default 7d)
    refreshMaxAge: int(process.env.REFRESH_COOKIE_MAX_AGE, 7 * 24 * 60 * 60 * 1000),
    accessMaxAge: int(process.env.ACCESS_COOKIE_MAX_AGE, 15 * 60 * 1000),
  },

  bcryptRounds: int(process.env.BCRYPT_ROUNDS, 12),

  drive: {
    enabled: bool(process.env.DRIVE_ENABLED, true),
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: int(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SYSTEM_EMAIL || "no-reply@odoc.archive",
  },

  seed: {
    superAdminName: process.env.SEED_SUPERADMIN_NAME || "Super Admin",
    superAdminEmail: process.env.SEED_SUPERADMIN_EMAIL || "superadmin@odoc.local",
    superAdminPassword: process.env.SEED_SUPERADMIN_PASSWORD || "ChangeMe#123",
    standardAdminName: process.env.SEED_ADMIN_NAME || "Standard Admin",
    standardAdminEmail: process.env.SEED_ADMIN_EMAIL || "admin@odoc.local",
    standardAdminPassword: process.env.SEED_ADMIN_PASSWORD || "ChangeMe#123",
  },

  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: int(process.env.RATE_LIMIT_MAX, 300),
    authMax: int(process.env.RATE_LIMIT_AUTH_MAX, 10),
  },

  storageCapacityGB: int(process.env.STORAGE_CAPACITY_GB, 1024),
};

function validate() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (env.drive.enabled) {
    missing.push(...DRIVE_REQUIRED.filter((k) => !process.env[k]));
  }
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Copy .env.example to .env and fill them in.`
    );
  }
}

module.exports = { env, validate };
