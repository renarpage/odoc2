const asyncHandler = require("../core/asyncHandler");
const settingsService = require("../services/settingsService");
const { ok } = require("../helpers/response");

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

module.exports = { page, updateFromForm, updateApi };
