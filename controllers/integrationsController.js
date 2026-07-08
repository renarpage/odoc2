/**
 * Google Drive OAuth connect / callback / disconnect (Super Admin only).
 */
const asyncHandler = require("../core/asyncHandler");
const driveConfig = require("../config/drive");
const settingRepository = require("../repositories/settingRepository");
const logService = require("../services/logService");
const logger = require("../config/logger");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

const connect = asyncHandler(async (req, res) => {
  const url = driveConfig.authUrl();
  if (!url) {
    req.flash("error", "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.");
    return res.redirect("/admin/storage");
  }
  return res.redirect(url);
});

const callback = asyncHandler(async (req, res) => {
  if (req.query.error) {
    req.flash("error", `Google authorization was cancelled (${req.query.error}).`);
    return res.redirect("/admin/storage");
  }
  const code = req.query.code;
  if (!code) {
    req.flash("error", "Missing authorization code from Google.");
    return res.redirect("/admin/storage");
  }

  const { refreshToken, email } = await driveConfig.exchangeCode(code);
  if (!refreshToken) {
    // Google only returns a refresh token on first consent; force re-consent.
    req.flash("error", "No refresh token returned. Remove ODOC from your Google account permissions and connect again.");
    return res.redirect("/admin/storage");
  }

  await settingRepository.upsert("google_oauth", { refreshToken, email, connectedAt: new Date().toISOString() });
  await logService.record({
    type: LOG_TYPES.SUCCESS,
    action: LOG_ACTIONS.UPDATE,
    title: "Google Drive connected",
    detail: email ? `Connected as ${email}` : "OAuth account connected",
    user: req.user && req.user._id,
    userEmail: req.user && req.user.email,
    ip: req.ip,
  });
  logger.info("Google Drive OAuth connected", { email });
  req.flash("success", email ? `Google Drive connected as ${email}.` : "Google Drive connected.");
  return res.redirect("/admin/storage");
});

const disconnect = asyncHandler(async (req, res) => {
  await settingRepository.upsert("google_oauth", {});
  await logService.record({
    type: LOG_TYPES.WARNING,
    action: LOG_ACTIONS.UPDATE,
    title: "Google Drive disconnected",
    detail: "OAuth credentials cleared",
    user: req.user && req.user._id,
    userEmail: req.user && req.user.email,
    ip: req.ip,
  });
  req.flash("success", "Google Drive disconnected.");
  return res.redirect("/admin/storage");
});

module.exports = { connect, callback, disconnect };
