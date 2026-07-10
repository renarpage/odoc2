const asyncHandler = require("../core/asyncHandler");
const userService = require("../services/userService");
const { validateCreate } = require("../validators/userValidator");
const { ROLES, ROLE_LABELS } = require("../constants");
const { ok, created } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

/**
 * Users page: both super_admin and standard_admin can view,
 * but only super_admin sees action buttons (enforced in the template).
 */
const page = asyncHandler(async (req, res) => {
  const users = await userService.list();
  res.render("admin/users", { title: "Users", users, roleLabels: ROLE_LABELS });
});

const createFromForm = asyncHandler(async (req, res) => {
  const payload = validateCreate(req.body);
  const user = await userService.create(payload, ctxOf(req));
  req.flash("success", `Admin "${user.email}" created.`);
  res.redirect("/admin/users");
});

const updateFromForm = asyncHandler(async (req, res) => {
  await userService.update(req.params.id, req.body, ctxOf(req));
  req.flash("success", "User updated.");
  res.redirect("/admin/users");
});

const removeFromForm = asyncHandler(async (req, res) => {
  await userService.remove(req.params.id, ctxOf(req));
  req.flash("success", "User deleted.");
  res.redirect("/admin/users");
});

const toggleActiveFromForm = asyncHandler(async (req, res) => {
  const user = await userService.toggleActive(req.params.id, ctxOf(req));
  req.flash("success", `User ${user.active ? 'activated' : 'deactivated'}.`);
  res.redirect("/admin/users");
});

const resetPasswordFromForm = asyncHandler(async (req, res) => {
  await userService.resetPassword(req.params.id, ctxOf(req));
  req.flash("success", "Password reset. User must change on next login.");
  res.redirect("/admin/users");
});

// ---- JSON API ----
const listApi = asyncHandler(async (req, res) => {
  ok(res, await userService.list());
});
const createApi = asyncHandler(async (req, res) => {
  created(res, await userService.create(validateCreate(req.body), ctxOf(req)));
});
const updateApi = asyncHandler(async (req, res) => {
  ok(res, await userService.update(req.params.id, req.body, ctxOf(req)));
});
const removeApi = asyncHandler(async (req, res) => {
  ok(res, await userService.remove(req.params.id, ctxOf(req)));
});

module.exports = { page, createFromForm, updateFromForm, removeFromForm, toggleActiveFromForm, resetPasswordFromForm, listApi, createApi, updateApi, removeApi };
