/**
 * Baseline security headers + NoSQL injection sanitization.
 */
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// The frontend loads Bootstrap, GSAP, Lenis, and Bootstrap Icons from CDNs,
// plus Google Drive images. CSP is tuned to allow exactly those sources.
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
    "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "data:"],
    "img-src": ["'self'", "data:", "https:"],
    "connect-src": ["'self'"],
    "frame-src": ["'self'", "https://drive.google.com"],
  },
};

function applySecurity(app) {
  app.use(helmet({ contentSecurityPolicy, crossOriginEmbedderPolicy: false }));
  app.use(mongoSanitize());
}

module.exports = { applySecurity };
