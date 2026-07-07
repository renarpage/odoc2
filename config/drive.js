/**
 * Google Drive API client (service-account auth).
 * Returns a memoized drive client, or null when Drive is disabled/unconfigured
 * so callers can degrade gracefully instead of crashing.
 */
const { google } = require("googleapis");
const env = require("./env");
const logger = require("./logger");

let driveClient = null;
let initialized = false;

function getDrive() {
  if (initialized) return driveClient;
  initialized = true;

  if (!env.GOOGLE_DRIVE_ENABLED) {
    logger.warn("Google Drive disabled (GOOGLE_DRIVE_ENABLED=false)");
    return null;
  }
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    logger.warn("Google Drive credentials missing; uploads will be rejected");
    return null;
  }

  const auth = new google.auth.JWT({
    email: env.GOOGLE_CLIENT_EMAIL,
    // Support escaped newlines from .env single-line values.
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  driveClient = google.drive({ version: "v3", auth });
  logger.info("Google Drive client initialized");
  return driveClient;
}

async function healthCheck() {
  const drive = getDrive();
  if (!drive) return false;
  try {
    await drive.about.get({ fields: "user" });
    return true;
  } catch (err) {
    logger.error("Google Drive health check failed", { error: err.message });
    return false;
  }
}

module.exports = { getDrive, healthCheck };
