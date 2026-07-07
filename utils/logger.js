/**
 * Minimal structured logger. Writes to console and appends to logs/app.log.
 * Kept dependency-free to satisfy the "minimize dependencies" rule while
 * still fulfilling the logging policy (auth, CRUD, uploads, startup, errors).
 */
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function ensureDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (_) {
    /* ignore fs errors in restricted environments */
  }
}

function write(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  const line = JSON.stringify(entry);

  const consoleFn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(`[${entry.ts}] ${level.toUpperCase()}: ${message}`);

  ensureDir();
  try {
    fs.appendFile(LOG_FILE, line + "\n", () => {});
  } catch (_) {
    /* non-fatal */
  }
}

module.exports = {
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
  debug: (msg, meta) => {
    if ((process.env.NODE_ENV || "development") !== "production") write("debug", msg, meta);
  },
};
