'use strict';
const tokenService = require('../services/token.service');
const authService = require('../services/auth.service');
const { setAuthCookies } = require('../helpers/cookie.helper');
const ApiError = require('../core/ApiError');

// Decode access token from cookie. On expiry, transparently refresh via refresh_token.
async function attachUser(req, res, next) {
  const access = req.signedCookies?.access_token;
  const refresh = req.signedCookies?.refresh_token;
  if (access) {
    try { req.user = tokenService.verifyAccess(access); return next(); } catch { /* try refresh below */ }
  }
  if (refresh) {
    try {
      const { accessToken, user } = await authService.refresh(refresh);
      setAuthCookies(res, { accessToken });
      req.user = tokenService.verifyAccess(accessToken);
      req.refreshedUser = user;
      return next();
    } catch { /* fall through as guest */ }
  }
  req.user = null;
  next();
}

// Hard gate for protected routes.
function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Silakan login terlebih dahulu'));
  next();
}

module.exports = { attachUser, requireAuth };
