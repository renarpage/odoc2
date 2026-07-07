'use strict';
const env = require('../config/env');

const base = { httpOnly: true, sameSite: 'lax', secure: env.isProd, signed: true };

function setAuthCookies(res, { accessToken, refreshToken }, remember) {
  res.cookie('access_token', accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, { ...base, maxAge: (remember ? 30 : 7) * 24 * 60 * 60 * 1000 });
  }
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', base);
  res.clearCookie('refresh_token', base);
}

module.exports = { setAuthCookies, clearAuthCookies };
