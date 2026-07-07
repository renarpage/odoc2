'use strict';
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi nanti' } });
const uploadLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 60 });

module.exports = { globalLimiter, authLimiter, uploadLimiter };
