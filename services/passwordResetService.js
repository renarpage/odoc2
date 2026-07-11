//==============================================================//
//  SERVICE — Forgot-password OTP flow (MongoDB-backed)         //
//  A 6-digit code is hashed and stored with a short TTL + an   //
//  attempt cap. The plaintext code is printed to the server    //
//  console. Callers respond identically whether or not the     //
//  account exists (no user enumeration).                       //
//==============================================================//
const crypto = require("crypto");
const logger = require("../config/logger");
const otpRepository = require("../repositories/otpRepository");

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function normalize(email) {
  return String(email || "").trim().toLowerCase();
}

// Returns { code, cooldown } — code is null while within resend cooldown.
async function issue(email) {
  const key = normalize(email);
  const existing = await otpRepository.findByEmail(key);
  if (existing && existing.sentAt && Date.now() - existing.sentAt.getTime() < RESEND_COOLDOWN_MS) {
    return { code: null, cooldown: true };
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  await otpRepository.upsert(key, {
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + TTL_MS),
    attempts: 0,
    sentAt: new Date(),
  });
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
  // Direct stdout so it's visible even if the log level filters info.
  process.stdout.write(msg + "\n");
  logger.info("Password reset OTP generated", { email: normalize(email) });
}

// Returns { ok, reason } — reason in: expired | invalid | locked | missing.
async function verify(email, code) {
  const key = normalize(email);
  const rec = await otpRepository.findByEmail(key);
  if (!rec) return { ok: false, reason: "missing" };
  if (Date.now() > rec.expiresAt.getTime()) {
    await otpRepository.deleteByEmail(key);
    return { ok: false, reason: "expired" };
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    await otpRepository.deleteByEmail(key);
    return { ok: false, reason: "locked" };
  }
  await otpRepository.incAttempts(key);
  if (hashCode(code) !== rec.codeHash) return { ok: false, reason: "invalid" };
  return { ok: true };
}

async function clear(email) {
  await otpRepository.deleteByEmail(normalize(email));
}

module.exports = { issue, deliverToConsole, verify, clear, TTL_MS };
