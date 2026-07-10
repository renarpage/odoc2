//==============================================================//
//  CONTROLLER — System settings                                //
//==============================================================//
const asyncHandler = require("../core/asyncHandler");
const settingsService = require("../services/settingsService");
const { ok } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

// Render the settings page.
const page = asyncHandler(async (req, res) => {
  const settings = await settingsService.get();
  res.render("admin/settings", { title: "System Settings", settings });
});

// Persist settings from the form submit.
const updateFromForm = asyncHandler(async (req, res) => {
  await settingsService.update(req.body, ctxOf(req));
  req.flash("success", "Settings saved.");
  res.redirect("/admin/settings");
});

// Persist settings via JSON API.
const updateApi = asyncHandler(async (req, res) => {
  ok(res, await settingsService.update(req.body, ctxOf(req)));
});

// Verify SMTP connectivity without saving (form redirect variant).
const testSmtp = asyncHandler(async (req, res) => {
  const result = await settingsService.testSmtpConnection(req.body);
  req.flash(result.success ? "success" : "error", result.success ? "SMTP connection successful!" : "SMTP test failed: " + result.message);
  res.redirect("/admin/settings");
});

// Verify SMTP connectivity without saving (JSON variant).
const testSmtpApi = asyncHandler(async (req, res) => {
  const result = await settingsService.testSmtpConnection(req.body);
  if (result.success) ok(res, { message: "SMTP connection successful" });
  else res.status(400).json({ success: false, message: result.message });
});

module.exports = { page, updateFromForm, updateApi, testSmtp, testSmtpApi };
