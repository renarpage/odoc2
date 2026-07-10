//==============================================================//
//  HELPER — Cookie-backed flash messages                      //
//  Messages set during a request survive exactly one redirect. //
//  Views keep using res.locals.success / res.locals.error.     //
//==============================================================//
const { COOKIES } = require("../constants");
const env = require("./../config/env");

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.COOKIE_SECURE,
  path: "/",
};

function flashMiddleware(req, res, next) {
  // Read the flash payload set by the previous request.
  let incoming = { success: [], error: [] };
  const raw = req.cookies ? req.cookies[COOKIES.FLASH] : null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      incoming = {
        success: Array.isArray(parsed.success) ? parsed.success : [],
        error: Array.isArray(parsed.error) ? parsed.error : [],
      };
    } catch (_) {
      // Ignore malformed flash cookie.
    }
    res.clearCookie(COOKIES.FLASH, COOKIE_OPTS);
  }

  res.locals.success = incoming.success;
  res.locals.error = incoming.error;

  // Pending messages for THIS request, persisted on redirect.
  req._flash = { success: [], error: [] };
  req.flash = (type, message) => {
    const bucket = type === "error" ? "error" : "success";
    req._flash[bucket].push(message);
    return req._flash[bucket];
  };

  // Persist pending flash into a cookie just before redirecting.
  const originalRedirect = res.redirect.bind(res);
  res.redirect = (...args) => {
    if (req._flash.success.length || req._flash.error.length) {
      res.cookie(COOKIES.FLASH, JSON.stringify(req._flash), { ...COOKIE_OPTS, maxAge: 60 * 1000 });
    }
    return originalRedirect(...args);
  };

  next();
}

module.exports = { flashMiddleware };
