const userRepository = require("../repositories/userRepository");
const tokenService = require("./tokenService");
const auditService = require("./auditService");
const ApiError = require("../utils/ApiError");
const { LOG_TYPES } = require("../constants");

async function login({ email, password, ip }) {
  const user = await userRepository.findByEmailWithSecret(email);
  if (!user || !user.active) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    await auditService.record({
      type: LOG_TYPES.WARNING,
      action: "auth.login.failed",
      title: "Failed login attempt",
      detail: `Bad credentials for ${email}`,
      actorEmail: email,
      ip,
    });
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = tokenService.signAccess(user);
  const refreshToken = tokenService.signRefresh(user);

  user.refreshTokens.push(tokenService.hashToken(refreshToken));
  user.lastLoginAt = new Date();
  await user.save();

  await auditService.record({
    type: LOG_TYPES.USER,
    action: "auth.login",
    title: "Admin login",
    detail: `${user.email} signed in`,
    actor: user._id,
    actorEmail: user.email,
    ip,
  });

  return { user, accessToken, refreshToken };
}

async function refresh({ refreshToken, ip }) {
  if (!refreshToken) throw ApiError.unauthorized("No refresh token provided");
  const payload = tokenService.verifyRefresh(refreshToken);
  const user = await userRepository.findByIdWithSecret(payload.sub);
  if (!user || !user.active) throw ApiError.unauthorized("Account not found or disabled");

  const hashed = tokenService.hashToken(refreshToken);
  if (!user.refreshTokens.includes(hashed)) {
    // Token reuse / theft: revoke all sessions defensively.
    user.refreshTokens = [];
    await user.save();
    await auditService.record({
      type: LOG_TYPES.WARNING,
      action: "auth.refresh.reuse",
      title: "Refresh token reuse detected",
      detail: `All sessions revoked for ${user.email}`,
      actor: user._id,
      actorEmail: user.email,
      ip,
    });
    throw ApiError.unauthorized("Session invalidated. Please log in again.");
  }

  // Rotate: drop old, issue new.
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  const newRefresh = tokenService.signRefresh(user);
  user.refreshTokens.push(tokenService.hashToken(newRefresh));
  await user.save();

  const accessToken = tokenService.signAccess(user);
  return { user, accessToken, refreshToken: newRefresh };
}

async function logout({ userId, refreshToken }) {
  if (!userId) return;
  const user = await userRepository.findByIdWithSecret(userId);
  if (!user) return;
  if (refreshToken) {
    const hashed = tokenService.hashToken(refreshToken);
    user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  } else {
    user.refreshTokens = [];
  }
  await user.save();
  await auditService.record({
    type: LOG_TYPES.USER,
    action: "auth.logout",
    title: "Admin logout",
    detail: `${user.email} signed out`,
    actor: user._id,
    actorEmail: user.email,
  });
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await userRepository.findByIdWithSecret(userId);
  if (!user) throw ApiError.notFound("User not found");
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");
  user.password = newPassword;
  user.mustChangePassword = false;
  user.refreshTokens = []; // force re-login on other devices
  await user.save();
  await auditService.record({
    type: LOG_TYPES.USER,
    action: "auth.password.change",
    title: "Password changed",
    detail: `${user.email} changed their password`,
    actor: user._id,
    actorEmail: user.email,
  });
  return user;
}

module.exports = { login, refresh, logout, changePassword };
