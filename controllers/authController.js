//==============================================================//
//  CONTROLLER — Auth (login, logout, change/reset password)    //
//==============================================================//
const asyncHandler = require("../core/asyncHandler");
const authService = require("../services/authService");
const passwordResetService = require("../services/passwordResetService");
const userRepository = require("../repositories/userRepository");
const { validateLogin, validateChangePassword, validateEmail, validateReset } = require("../validators/authValidator");
const { setAuthCookies, clearAuthCookies } = require("../helpers/cookies");
const { userToView } = require("../helpers/serializers");
const { COOKIES } = require("../constants");
const { ok } = require("../helpers/response");

// Only allow same-origin relative redirect targets.
function safeNext(next) {
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
  clearAuthCookies(res);
  if (req.originalUrl.startsWith("/api")) return ok(res, { redirect: "/login" });
  req.flash("success", "Password updated. Please sign in again.");
  return res.redirect("/login");
});

const me = (req, res) => ok(res, { user: userToView(req.user) });

//-- Forgot password (OTP via server console) ------------------//
const getForgot = (req, res) => {
  if (req.user) return res.redirect("/admin");
  res.render("auth/forgot-password", { title: "Forgot Password", layout: "layouts/auth" });
};

const postForgot = asyncHandler(async (req, res) => {
  const { email } = validateEmail(req.body);
  // Only issue a code when the account exists + is active, but respond
  // identically either way to avoid revealing which emails are registered.
  const user = await userRepository.findByEmail(email);
  if (user && user.active) {
    const { code } = await passwordResetService.issue(email);
    if (code) passwordResetService.deliverToConsole(email, code);
  }
  req.flash("success", "If that account exists, a 6-digit code has been sent. Check the server console.");
  res.redirect("/reset-password?email=" + encodeURIComponent(email));
});

const getReset = (req, res) => {
  if (req.user) return res.redirect("/admin");
  res.render("auth/reset-password", {
    title: "Reset Password",
    layout: "layouts/auth",
    email: String(req.query.email || ""),
  });
};

const postReset = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = validateReset(req.body);
  const result = await passwordResetService.verify(email, code);
  if (!result.ok) {
    const messages = {
      expired: "That code has expired. Request a new one.",
      invalid: "Incorrect code. Please try again.",
      locked: "Too many attempts. Request a new code.",
      missing: "No active code for this email. Request a new one.",
    };
    req.flash("error", messages[result.reason] || "Could not verify the code.");
    return res.redirect("/reset-password?email=" + encodeURIComponent(email));
  }
  await authService.resetPasswordByEmail(email, newPassword, { ip: req.ip });
  await passwordResetService.clear(email);
  req.flash("success", "Password reset successfully. Please sign in.");
  return res.redirect("/login");
});

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getChangePassword,
  postChangePassword,
  me,
  getForgot,
  postForgot,
  getReset,
  postReset,
};
