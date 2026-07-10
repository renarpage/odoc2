/**
 * Stateless double-submit-cookie CSRF protection.
 * A random token is stored in a readable cookie and mirrored into forms
 * (partials/csrf.ejs), the X-CSRF-Token header, or a _csrf query param.
 * The query param is needed for multipart forms, whose body is not parsed
 * until multer runs (after this middleware).
 */
const crypto = require("crypto");
const { COOKIES } = require("../constants");
const env = require("../config/env");
const ApiError = require("../core/ApiError");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function ensureToken(req, res) {
  let token = req.cookies ? req.cookies[COOKIES.CSRF] : null;
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie(COOKIES.CSRF, token, {
      httpOnly: false, // readable so templates/JS can echo it back
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
    });
  }
  res.locals.csrfToken = token;
  return token;
}

function csrfProtection(req, res, next) {
  const token = ensureToken(req, res);
  if (SAFE_METHODS.has(req.method)) return next();

  // API routes use JWT auth, not CSRF cookies
  if (req.originalUrl.startsWith("/api/")) return next();

  const submitted =
    req.get("x-csrf-token") ||
    (req.body && req.body._csrf) ||
    (req.query && req.query._csrf);
  if (!submitted || submitted !== token) {
    return next(ApiError.forbidden("Invalid or missing CSRF token"));
  }
  return next();
}

module.exports = { csrfProtection, ensureToken };
