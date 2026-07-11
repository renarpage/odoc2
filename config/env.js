//==============================================================//
//  CONFIG — Environment                                        //
//  Centralized, validated. Nothing else reads process.env.     //
//==============================================================//
require("dotenv").config();

function required(key, fallback) {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key, fallback) {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
}

function bool(key, fallback = false) {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

const NODE_ENV = optional("NODE_ENV", "development");
const isProd = NODE_ENV === "production";
const APP_URL = optional("APP_URL", "http://localhost:3000");

// Serverless mode: set SERVERLESS=true, or auto-detected on Vercel/Lambda.
// Changes runtime behavior: no app.listen, no file logging, inline uploads.
const SERVERLESS = bool("SERVERLESS", false) || !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const env = {
  NODE_ENV,
  isProd,
  SERVERLESS,
  PORT: parseInt(optional("PORT", "3000"), 10),
  APP_URL,

  MONGO_URI: isProd ? required("MONGO_URI") : optional("MONGO_URI", "mongodb://127.0.0.1:27017/odoc"),

  JWT_ACCESS_SECRET: isProd ? required("JWT_ACCESS_SECRET") : optional("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: isProd ? required("JWT_REFRESH_SECRET") : optional("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
  JWT_ACCESS_TTL: optional("JWT_ACCESS_TTL", "15m"),
  JWT_REFRESH_TTL: optional("JWT_REFRESH_TTL", "7d"),
  REFRESH_TTL_DAYS: parseInt(optional("REFRESH_TTL_DAYS", "7"), 10),

  COOKIE_SECURE: bool("COOKIE_SECURE", isProd),
  COOKIE_DOMAIN: optional("COOKIE_DOMAIN", undefined),

  BCRYPT_ROUNDS: parseInt(optional("BCRYPT_ROUNDS", "12"), 10),

  // Google Drive via OAuth (recommended: real personal Drive).
  GOOGLE_OAUTH_CLIENT_ID: optional("GOOGLE_OAUTH_CLIENT_ID", undefined),
  GOOGLE_OAUTH_CLIENT_SECRET: optional("GOOGLE_OAUTH_CLIENT_SECRET", undefined),
  GOOGLE_OAUTH_REDIRECT_URI: optional("GOOGLE_OAUTH_REDIRECT_URI", `${APP_URL}/admin/integrations/google/callback`),

  // Google Drive via service account (fallback, headless).
  GOOGLE_DRIVE_ENABLED: bool("GOOGLE_DRIVE_ENABLED", false),
  GOOGLE_CLIENT_EMAIL: optional("GOOGLE_CLIENT_EMAIL", undefined),
  GOOGLE_PRIVATE_KEY: optional("GOOGLE_PRIVATE_KEY", undefined),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: optional("GOOGLE_DRIVE_ROOT_FOLDER_ID", undefined),

  // Displayed capacity (GB) when Drive reports no fixed quota limit.
  STORAGE_CAPACITY_GB: parseFloat(optional("STORAGE_CAPACITY_GB", "15")),

  RATE_LIMIT_WINDOW_MS: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10),
  RATE_LIMIT_MAX: parseInt(optional("RATE_LIMIT_MAX", "300"), 10),
  AUTH_RATE_LIMIT_MAX: parseInt(optional("AUTH_RATE_LIMIT_MAX", "10"), 10),

  MAX_UPLOAD_BYTES: parseInt(optional("MAX_UPLOAD_BYTES", String(50 * 1024 * 1024)), 10),

  SEED_SUPERADMIN_EMAIL: optional("SEED_SUPERADMIN_EMAIL", "superadmin@odoc.archive"),
  SEED_SUPERADMIN_PASSWORD: optional("SEED_SUPERADMIN_PASSWORD", "ChangeMe!Super123"),
  SEED_ADMIN_EMAIL: optional("SEED_ADMIN_EMAIL", "admin@odoc.archive"),
  SEED_ADMIN_PASSWORD: optional("SEED_ADMIN_PASSWORD", "ChangeMe!Admin123"),
};

module.exports = env;
