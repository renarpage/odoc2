/**
 * Google Drive client bootstrap using a service account.
 * Exposes a lazily-initialized drive client so the app can boot even if
 * Drive is temporarily unreachable; callers handle failures gracefully.
 */
const { google } = require("googleapis");
const { env } = require("./env");
const logger = require("../utils/logger");

const SCOPES = ["https://www.googleapis.com/auth/drive"];

let driveClient = null;

function getAuth() {
  return new google.auth.JWT({
    email: env.drive.clientEmail,
    key: env.drive.privateKey,
    scopes: SCOPES,
  });
}

function getDrive() {
  if (!env.drive.enabled) {
    throw new Error("Google Drive storage is disabled (DRIVE_ENABLED=false).");
  }
  if (!driveClient) {
    driveClient = google.drive({ version: "v3", auth: getAuth() });
    logger.info("Google Drive client initialized");
  }
  return driveClient;
}

/** Lightweight connectivity probe used by the dashboard health check. */
async function pingDrive() {
  if (!env.drive.enabled) return { ok: false, reason: "disabled" };
  try {
    const drive = getDrive();
    const about = await drive.about.get({ fields: "storageQuota,user" });
    return { ok: true, quota: about.data.storageQuota, user: about.data.user };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

module.exports = { getDrive, pingDrive, SCOPES };
