const asyncHandler = require("../core/asyncHandler");
const userService = require("../services/userService");
const { validateCreate } = require("../validators/userValidator");
const { ROLE_LABELS } = require("../constants");
const { ok, created } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

const page = asyncHandler(async (req, res) => {
  const users = await userService.list();
  res.render("admin/users", { title: "Users", users, roleLabels: ROLE_LABELS });
});

const createFromForm = asyncHandler(async (req, res) => {
  const payload = validateCreate(req.body);
  const user = await userService.create(payload, ctxOf(req));
  req.flash("success", `Admin \"${user.email}\" created.`);
  res.redirect("/admin/users");
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

module.exports = { page, createFromForm, createApi, updateApi, removeApi };
