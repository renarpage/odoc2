/**
 * Populates view locals every request so templates never hit undefined vars.
 * Branding is loaded once and cached briefly to avoid a per-request DB hit.
 */
const brandingService = require("../services/brandingService");
const logger = require("../config/logger");

let cache = { value: null, at: 0 };
const TTL_MS = 30 * 1000;

async function locals(req, res, next) {
  res.locals.currentPath = req.path;
  res.locals.currentUser = res.locals.currentUser || null;
  res.locals.success = res.locals.success || [];
  res.locals.error = res.locals.error || [];
  try {
    if (!cache.value || Date.now() - cache.at > TTL_MS) {
      cache = { value: await brandingService.get(), at: Date.now() };
    }
    res.locals.branding = cache.value;
  } catch (err) {
    logger.warn("Branding locals unavailable", { error: err.message });
    res.locals.branding = res.locals.branding || null;
  }
  next();
}

module.exports = locals;
