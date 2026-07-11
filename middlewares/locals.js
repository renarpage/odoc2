//==============================================================//
//  MIDDLEWARE — View locals                                    //
//  Ensures templates never hit undefined vars; loads settings; //
//  exposes the direct-upload flag (on for serverless).         //
//==============================================================//
const settingRepository = require("../repositories/settingRepository");
const { settingsToView } = require("../helpers/serializers");
const env = require("../config/env");
const logger = require("../config/logger");

async function locals(req, res, next) {
  res.locals.currentPath = req.path;
  res.locals.currentUser = res.locals.currentUser || null;
  res.locals.success = res.locals.success || [];
  res.locals.error = res.locals.error || [];
  // Direct browser-to-Drive upload is used on serverless (body-size limits).
  res.locals.directUpload = env.SERVERLESS;
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
