const asyncHandler = require("../core/asyncHandler");
const authService = require("../services/authService");
const { validateLogin, validateChangePassword } = require("../validators/authValidator");
const { setAuthCookies, clearAuthCookies } = require("../helpers/cookies");
const { userToView } = require("../helpers/serializers");
const { COOKIES } = require("../constants");
const { ok } = require("../helpers/response");

function safeNext(next) {
  // Only allow same-site relative redirects to avoid open-redirect abuse.
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/admin";
}

const getLogin = (req, res) => {
  if (req.user) return res.redirect("/admin");
  res.render("auth/login", {
    title: "Sign In",
    layout: "layouts/auth",
    next: safeNext(req.query.next),
  });
};

const postLogin = asyncHandler(async (req, res) => {
  const { email, password } = validateLogin(req.body);
  const { user, ...tokens } = await authService.login({ email, password }, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  setAuthCookies(res, tokens);
  const dest = user.mustChangePassword ? "/admin/account/password" : safeNext(req.body.next);
  if (req.originalUrl.startsWith("/api")) return ok(res, { user: userToView(user), redirect: dest });
  return res.redirect(dest);
});

const postLogout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies[COOKIES.REFRESH]);
  clearAuthCookies(res);
  if (req.originalUrl.startsWith("/api")) return ok(res, { loggedOut: true });
  return res.redirect("/login");
});

const getChangePassword = (req, res) => {
  res.render("auth/change-password", {
    title: "Change Password",
    layout: "layouts/admin",
    forced: !!req.user.mustChangePassword,
  });
};

const postChangePassword = asyncHandler(async (req, res) => {
  const payload = validateChangePassword(req.body);
  await authService.changePassword(req.user._id, payload, { ip: req.ip });
  clearAuthCookies(res); // force clean re-login with new credentials
  if (req.originalUrl.startsWith("/api")) return ok(res, { redirect: "/login" });
  req.flash("success", "Password updated. Please sign in again.");
  return res.redirect("/login");
});

const me = (req, res) => ok(res, { user: userToView(req.user) });

module.exports = { getLogin, postLogin, postLogout, getChangePassword, postChangePassword, me };
