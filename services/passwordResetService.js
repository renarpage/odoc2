/**
 * Forgot-password OTP flow.
 *
 * A 6-digit code is generated, hashed, and stored in memory keyed by email
 * with a short expiry and an attempt cap. The plaintext code is printed to the
 * server console (as requested) instead of being emailed. To avoid leaking
 * which emails exist, callers should behave identically whether or not the
 * account is found.
 */
const crypto = require("crypto");
const logger = require("../config/logger");

const store = new Map(); // email -> { hash, expiresAt, attempts }
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function normalize(email) {
  return String(email || "").trim().toLowerCase();
}

// Returns { code, cooldown } — code is null when still within resend cooldown.
function issue(email) {
  const key = normalize(email);
  const existing = store.get(key);
  if (existing && existing.sentAt && Date.now() - existing.sentAt < RESEND_COOLDOWN_MS) {
    return { code: null, cooldown: true };
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  store.set(key, { hash: hashCode(code), expiresAt: Date.now() + TTL_MS, attempts: 0, sentAt: Date.now() });
  return { code, cooldown: false };
}

// Loud, easy-to-spot console delivery of the OTP.
function deliverToConsole(email, code) {
  const line = "=".repeat(52);
  const msg = [
    "",
    line,
    "  ODOC PASSWORD RESET CODE",
    `  Email : ${normalize(email)}`,
    `  Code  : ${code}`,
    "  Valid : 10 minutes",
    line,
    "",
  ].join("\n");
  // Direct stdout so it's visible even if log level filters info.
  process.stdout.write(msg + "\n");
  logger.info("Password reset OTP generated", { email: normalize(email) });
}

// Returns { ok, reason } — reason in: expired | invalid | locked | missing.
function verify(email, code) {
  const key = normalize(email);
  const rec = store.get(key);
  if (!rec) return { ok: false, reason: "missing" };
  if (Date.now() > rec.expiresAt) { store.delete(key); return { ok: false, reason: "expired" }; }
  if (rec.attempts >= MAX_ATTEMPTS) { store.delete(key); return { ok: false, reason: "locked" }; }
  rec.attempts += 1;
  if (hashCode(code) !== rec.hash) return { ok: false, reason: "invalid" };
  return { ok: true };
}

function clear(email) {
  store.delete(normalize(email));
}

module.exports = { issue, deliverToConsole, verify, clear, TTL_MS };
