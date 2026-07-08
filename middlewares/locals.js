/**
 * Populates view locals every request so templates never hit undefined vars.
 * Branding is read fresh each request (single indexed doc, cheap) so changes
 * saved on the Branding page propagate to the site immediately.
 */
const brandingService = require("../services/brandingService");
const logger = require("../config/logger");

async function locals(req, res, next) {
  res.locals.currentPath = req.path;
  res.locals.currentUser = res.locals.currentUser || null;
  res.locals.success = res.locals.success || [];
  res.locals.error = res.locals.error || [];
  try {
    res.locals.branding = await brandingService.get();
  } catch (err) {
    logger.warn("Branding locals unavailable", { error: err.message });
    res.locals.branding = res.locals.branding || null;
  }
  next();
}

module.exports = locals;
