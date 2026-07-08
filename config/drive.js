/**
 * Google Drive API client.
 *
 * Auth priority:
 *   1. OAuth (a real user's Google Drive) when an OAuth client is configured
 *      AND a refresh token has been stored via the connect flow. This is the
 *      recommended mode: real personal storage quota, no "service accounts do
 *      not have storage quota" upload errors.
 *   2. Service account (JWT) as a fallback for headless setups.
 *   3. null when nothing is configured, so callers degrade gracefully.
 *
 * getDrive() is async because the OAuth refresh token lives in the database.
 */
const { google } = require("googleapis");
const env = require("./env");
const logger = require("./logger");

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

function isOAuthConfigured() {
  return !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function buildOAuthClient() {
  if (!isOAuthConfigured()) return null;
  return new google.auth.OAuth2(
    env.GOOGLE_OAUTH_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

function authUrl() {
  const client = buildOAuthClient();
  if (!client) return null;
  // access_type=offline + prompt=consent guarantees we receive a refresh token.
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_SCOPE, EMAIL_SCOPE],
  });
}

async function exchangeCode(code) {
  const client = buildOAuthClient();
  if (!client) throw new Error("OAuth is not configured");
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Best-effort: capture which account was connected, for display.
  let email = null;
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const info = await oauth2.userinfo.get();
    email = info.data.email || null;
  } catch (err) {
    logger.warn("Could not read connected Google account email", { error: err.message });
  }
  return { refreshToken: tokens.refresh_token || null, email };
}

async function getStoredOAuth() {
  // Lazy require avoids a load-order cycle (repo -> model -> mongoose).
  const settingRepository = require("../repositories/settingRepository");
  return settingRepository.getData("google_oauth", {});
}

function buildServiceAccount() {
  if (!env.GOOGLE_DRIVE_ENABLED) return null;
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) return null;
  return new google.auth.JWT({
    email: env.GOOGLE_CLIENT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: [DRIVE_SCOPE],
  });
}

/**
 * Returns a ready-to-use Drive client, or null.
 */
async function getDrive() {
  const oauthClient = buildOAuthClient();
  if (oauthClient) {
    const stored = await getStoredOAuth();
    if (stored && stored.refreshToken) {
      oauthClient.setCredentials({ refresh_token: stored.refreshToken });
      return google.drive({ version: "v3", auth: oauthClient });
    }
  }
  const jwt = buildServiceAccount();
  if (jwt) return google.drive({ version: "v3", auth: jwt });
  return null;
}

/**
 * Connection status for the admin UI.
 */
async function getStatus() {
  const oauthConfigured = isOAuthConfigured();
  if (oauthConfigured) {
    const stored = await getStoredOAuth();
    if (stored && stored.refreshToken) {
      return { connected: true, mode: "oauth", email: stored.email || null, oauthConfigured };
    }
  }
  if (buildServiceAccount()) {
    return { connected: true, mode: "service_account", email: null, oauthConfigured };
  }
  return { connected: false, mode: null, email: null, oauthConfigured };
}

async function healthCheck() {
  const drive = await getDrive();
  if (!drive) return false;
  try {
    await drive.about.get({ fields: "user" });
    return true;
  } catch (err) {
    logger.error("Google Drive health check failed", { error: err.message });
    return false;
  }
}

module.exports = { getDrive, getStatus, healthCheck, isOAuthConfigured, authUrl, exchangeCode };
