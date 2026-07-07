'use strict';
const crypto = require('crypto');
const visitorRepo = require('../repositories/visitor.repository');
const env = require('../config/env');

// Count unique guest visits without storing raw IPs (hashed with a salt).
function visitorTracker(req, _res, next) {
  // Only count guest GETs on public pages, skip assets and admin.
  if (req.method === 'GET' && !req.path.startsWith('/admin') && !req.path.startsWith('/static') && !req.path.startsWith('/api')) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ipHash = crypto.createHmac('sha256', env.cookieSecret).update(String(ip)).digest('hex');
    visitorRepo.track({ ipHash, path: req.path, userAgent: req.headers['user-agent'] }).catch(() => {});
  }
  next();
}
module.exports = visitorTracker;
