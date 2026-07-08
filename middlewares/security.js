/**
 * Baseline security headers + NoSQL injection sanitization.
 */
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// The frontend loads Bootstrap + Bootstrap Icons + GSAP from cdn.jsdelivr.net
// and cdnjs.cloudflare.com, fonts from Google Fonts, and images from Google
// Drive / Unsplash. IMPORTANT: Bootstrap Icons ships its glyphs as a webfont
// served from cdnjs, so cdnjs MUST be allowed in font-src or every icon breaks.
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
    "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "connect-src": ["'self'"],
    "frame-src": ["'self'", "https://drive.google.com"],
    "media-src": ["'self'", "https:", "blob:"],
  },
};

function applySecurity(app) {
  app.use(helmet({ contentSecurityPolicy, crossOriginEmbedderPolicy: false }));
  app.use(mongoSanitize());
}

module.exports = { applySecurity };
