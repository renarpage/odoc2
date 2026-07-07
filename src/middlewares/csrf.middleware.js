'use strict';
const csrf = require('csurf');
// Cookie-based CSRF for state-changing form/API routes. Token exposed via res.locals.csrfToken.
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax' } });
function exposeToken(req, res, next) {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
}
module.exports = { csrfProtection, exposeToken };
