'use strict';
const NodeCache = require('node-cache');

// Shared in-memory cache for the whole process (dashboard stats, guest lists, branding).
const cache = new NodeCache({ stdTTL: 120, checkperiod: 150, useClones: false });

module.exports = cache;
