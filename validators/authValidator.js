const ApiError = require("../core/ApiError");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!EMAIL_RE.test(email)) throw ApiError.badRequest("A valid email is required");
  if (!password) throw ApiError.badRequest("Password is required");
  return { email, password, remember: body.remember === "on" || body.remember === true };
}

function validateChangePassword(body) {
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");
  if (!currentPassword) throw ApiError.badRequest("Current password is required");
  if (newPassword.length < 8) throw ApiError.badRequest("New password must be at least 8 characters");
  if (!/[0-9]/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
    throw ApiError.badRequest("Password must contain letters and numbers");
  }
  if (newPassword !== confirmPassword) throw ApiError.badRequest("Password confirmation does not match");
  return { currentPassword, newPassword };
}

module.exports = { validateLogin, validateChangePassword };
