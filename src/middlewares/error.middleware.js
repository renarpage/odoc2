'use strict';
const logger = require('../config/logger');
const env = require('../config/env');

// Central error handler. Operational ApiErrors -> clean status; everything else -> 500.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.statusCode || (err.code === 'EBADCSRFTOKEN' ? 403 : 500);
  const message = status >= 500 ? 'Terjadi kesalahan pada server' : err.message;
  if (status >= 500) logger.error(err.stack || err.message); else logger.warn(`${status} ${err.message}`);

  if (req.path.startsWith('/api') || req.xhr) {
    return res.status(status).json({ success: false, kind: err.kind || 'error', message, ...(env.isProd ? {} : { stack: err.stack }) });
  }
  if (status === 401) return res.redirect('/login');
  res.status(status).render('404', { title: 'Error', message });
};
