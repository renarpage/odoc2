/**
 * Auth cookie management (HTTP-only, secure in prod).
 */
const env = require("../config/env");
const { COOKIES } = require("../constants");

function baseOpts(extra = {}) {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN,
    path: "/",
    ...extra,
  };
}

function setAuthCookies(res, { accessToken, refreshValue, refreshExpiresAt }) {
  if (accessToken) {
    res.cookie(COOKIES.ACCESS, accessToken, baseOpts({ maxAge: 15 * 60 * 1000 }));
  }
  if (refreshValue) {
    res.cookie(COOKIES.REFRESH, refreshValue, baseOpts({ expires: refreshExpiresAt }));
  }
}

function clearAuthCookies(res) {
  res.clearCookie(COOKIES.ACCESS, baseOpts());
  res.clearCookie(COOKIES.REFRESH, baseOpts());
}

module.exports = { setAuthCookies, clearAuthCookies, baseOpts };
