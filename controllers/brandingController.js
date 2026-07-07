const asyncHandler = require("../core/asyncHandler");
const brandingService = require("../services/brandingService");
const { ok } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

const page = asyncHandler(async (req, res) => {
  const branding = await brandingService.get();
  res.render("admin/branding", { title: "Branding & Customization", branding });
});

const updateFromForm = asyncHandler(async (req, res) => {
  await brandingService.update(req.body, ctxOf(req));
  req.flash("success", "Brand identity saved.");
  res.redirect("/admin/branding");
});

const updateApi = asyncHandler(async (req, res) => {
  ok(res, await brandingService.update(req.body, ctxOf(req)));
});

module.exports = { page, updateFromForm, updateApi };
