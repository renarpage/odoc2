//==============================================================//
//  MIDDLEWARE — CSRF (stateless double-submit cookie)          //
//  Token lives in a readable cookie, mirrored via form field,  //
//  X-CSRF-Token header, or _csrf query param.                  //
//==============================================================//
const crypto = require("crypto");
const { COOKIES } = require("../constants");
const env = require("../config/env");
const ApiError = require("../core/ApiError");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Ensure a CSRF token exists for this session and expose it to views.
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

  // API routes authenticate via JWT, not CSRF cookies.
  if (req.originalUrl.startsWith("/api/")) return next();

  const submitted =
    req.get("x-csrf-token") || (req.body && req.body._csrf) || (req.query && req.query._csrf);
  if (!submitted || submitted !== token) {
    return next(ApiError.forbidden("Invalid or missing CSRF token"));
  }
  return next();
}

module.exports = { csrfProtection, ensureToken };
