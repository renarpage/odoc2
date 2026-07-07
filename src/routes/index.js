'use strict';
const router = require('express').Router();

router.use('/', require('./guest.routes'));
router.use('/', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/api', require('./api.routes'));

// SEO helpers
router.get('/robots.txt', (req, res) => res.type('text/plain').send('User-agent: *\nAllow: /\nSitemap: /sitemap.xml'));

module.exports = router;
