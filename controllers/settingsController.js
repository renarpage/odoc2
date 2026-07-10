const asyncHandler = require("../core/asyncHandler");
const settingsService = require("../services/settingsService");
const { ok } = require("../helpers/response");
const logger = require("../config/logger");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

const page = asyncHandler(async (req, res) => {
  const settings = await settingsService.get();
  res.render("admin/settings", { title: "System Settings", settings });
});

const updateFromForm = asyncHandler(async (req, res) => {
  await settingsService.update(req.body, ctxOf(req));
  req.flash("success", "Settings saved.");
  res.redirect("/admin/settings");
});

const updateApi = asyncHandler(async (req, res) => {
  ok(res, await settingsService.update(req.body, ctxOf(req)));
});

/**
 * Test SMTP connection. Does NOT save settings, just verifies connectivity.
 */
const testSmtp = asyncHandler(async (req, res) => {
  const result = await settingsService.testSmtpConnection(req.body);
  if (result.success) {
    req.flash("success", "SMTP connection successful!");
  } else {
    req.flash("error", "SMTP test failed: " + result.message);
  }
  res.redirect("/admin/settings");
});

const testSmtpApi = asyncHandler(async (req, res) => {
  const result = await settingsService.testSmtpConnection(req.body);
  if (result.success) {
    ok(res, { message: "SMTP connection successful" });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

module.exports = { page, updateFromForm, updateApi, testSmtp, testSmtpApi };
