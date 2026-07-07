/**
 * Stateless double-submit-cookie CSRF protection.
 * A random token is stored in a readable cookie and mirrored into forms
 * (partials/csrf.ejs) or the X-CSRF-Token header; the two must match on
 * state-changing requests.
 */
const crypto = require("crypto");
const { COOKIES } = require("../constants");
const env = require("../config/env");
const ApiError = require("../core/ApiError");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Paths not yet carrying a CSRF token (legacy server-rendered forms).
// Drop-in hardening: add <%- include('partials/csrf') %> to those forms,
// then remove them from this list.
const IGNORE_PATHS = [
  "/admin/activities/new",
  "/admin/branding",
  "/admin/settings",
];

function ensureToken(req, res) {
  let token = req.cookies ? req.cookies[COOKIES.CSRF] : null;
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie(COOKIES.CSRF, token, {
      httpOnly: false, // must be readable by the template/JS to echo back
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
  if (IGNORE_PATHS.includes(req.path)) return next();

  const submitted = req.get("x-csrf-token") || (req.body && req.body._csrf);
  if (!submitted || submitted !== token) {
    return next(ApiError.forbidden("Invalid or missing CSRF token"));
  }
  return next();
}

module.exports = { csrfProtection, ensureToken };
