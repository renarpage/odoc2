'use strict';
const cache = require('../config/cache');

// Simple GET response cache + ETag for guest pages/API. Keyed by original URL.
function cachePage(ttlSeconds = 60) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `page:${req.originalUrl}`;
    const hit = cache.get(key);
    if (hit) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('ETag', hit.etag);
      if (req.headers['if-none-match'] === hit.etag) return res.status(304).end();
      res.setHeader('Content-Type', hit.type);
      return res.send(hit.body);
    }
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      if (res.statusCode === 200) {
        const etag = 'W/"' + Buffer.byteLength(body) + '-' + Date.now().toString(36) + '"';
        cache.set(key, { body, etag, type: res.getHeader('Content-Type') || 'text/html' }, ttlSeconds);
        res.setHeader('ETag', etag);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalSend(body);
    };
    next();
  };
}
module.exports = { cachePage };
