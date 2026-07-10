/**
 * Populates view locals every request so templates never hit undefined vars.
 * Settings are read for maintenance banner awareness in admin views.
 */
const settingRepository = require("../repositories/settingRepository");
const { settingsToView } = require("../helpers/serializers");
const logger = require("../config/logger");

async function locals(req, res, next) {
  res.locals.currentPath = req.path;
  res.locals.currentUser = res.locals.currentUser || null;
  res.locals.success = res.locals.success || [];
  res.locals.error = res.locals.error || [];
  try {
    const data = await settingRepository.getData("system", {});
    res.locals.settings = settingsToView(data);
  } catch (err) {
    logger.warn("Settings locals unavailable", { error: err.message });
    res.locals.settings = res.locals.settings || {};
  }
  next();
}

module.exports = locals;
