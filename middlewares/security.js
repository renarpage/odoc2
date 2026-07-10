//==============================================================//
//  MIDDLEWARE — Security headers + NoSQL sanitization          //
//  helmet CSP tuned for the CDNs the frontend loads.           //
//==============================================================//
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// CSP: Bootstrap/Icons/GSAP/flatpickr from jsdelivr + cdnjs, fonts from
// Google Fonts, images from Google Drive / lh3 / Unsplash. CDNs are in
// connect-src so their sourcemap fetches don't throw console errors.
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
    "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "connect-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    "frame-src": ["'self'", "https://drive.google.com"],
    "media-src": ["'self'", "https:", "blob:"],
  },
};

function applySecurity(app) {
  app.use(helmet({ contentSecurityPolicy, crossOriginEmbedderPolicy: false }));
  app.use(mongoSanitize());
}

module.exports = { applySecurity };
