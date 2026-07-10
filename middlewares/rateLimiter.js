//==============================================================//
//  MIDDLEWARE — Rate limiting                                  //
//==============================================================//
const rateLimit = require("express-rate-limit");
const env = require("../config/env");

// General API/page limiter.
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for credential endpoints (brute-force mitigation).
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

module.exports = { apiLimiter, authLimiter };
