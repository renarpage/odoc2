/**
 * Authentication use-cases: login, refresh rotation, logout, password change,
 * and password reset (forgot-password).
 */
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const ApiError = require("../core/ApiError");
const userRepository = require("../repositories/userRepository");
const refreshTokenRepository = require("../repositories/refreshTokenRepository");
const tokenService = require("./tokenService");
const logService = require("./logService");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

async function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

async function issueTokens(user, ctx = {}) {
  const accessToken = tokenService.generateAccessToken(user);
  const refreshValue = tokenService.generateRefreshValue();
  const tokenHash = tokenService.hashToken(refreshValue);
  const expiresAt = tokenService.refreshExpiryDate();
  await refreshTokenRepository.create({
    user: user._id,
    tokenHash,
    expiresAt,
    userAgent: ctx.userAgent || "",
    ip: ctx.ip || "",
  });
  return { accessToken, refreshValue, refreshExpiresAt: expiresAt };
}

async function login({ email, password }, ctx = {}) {
  const user = await userRepository.findByEmailWithHash(email);
  if (!user || !user.active) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    await logService.record({
      type: LOG_TYPES.WARNING,
      action: LOG_ACTIONS.LOGIN,
      title: "Failed login attempt",
      detail: `Invalid credentials for ${email}`,
      ip: ctx.ip,
    });
    throw ApiError.unauthorized("Invalid email or password");
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = ctx.ip || null;
  await user.save();

  const tokens = await issueTokens(user, ctx);
  await logService.record({
    type: LOG_TYPES.USER,
    action: LOG_ACTIONS.LOGIN,
    title: "Admin login",
    detail: `${user.name} (${user.email}) signed in`,
    user: user._id,
    userEmail: user.email,
    ip: ctx.ip,
  });

  return { user, ...tokens };
}

async function refresh(rawRefresh, ctx = {}) {
  if (!rawRefresh) throw ApiError.unauthorized("Missing refresh token");
  const tokenHash = tokenService.hashToken(rawRefresh);
  const existing = await refreshTokenRepository.findActiveByHash(tokenHash);
  if (!existing) throw ApiError.unauthorized("Session expired");

  const user = await userRepository.findById(existing.user);
  if (!user || !user.active) throw ApiError.unauthorized("Account unavailable");

  const tokens = await issueTokens(user, ctx);
  await refreshTokenRepository.revokeByHash(tokenHash, tokenService.hashToken(tokens.refreshValue));

  return { user, ...tokens };
}

async function logout(rawRefresh) {
  if (!rawRefresh) return;
  const tokenHash = tokenService.hashToken(rawRefresh);
  await refreshTokenRepository.revokeByHash(tokenHash);
}

async function changePassword(userId, { currentPassword, newPassword }, ctx = {}) {
  const user = await userRepository.model.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found");
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw ApiError.badRequest("Current password is incorrect");

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  await refreshTokenRepository.revokeAllForUser(user._id);
  await logService.record({
    type: LOG_TYPES.INFO,
    action: LOG_ACTIONS.UPDATE,
    title: "Password changed",
    detail: `${user.email} updated their password`,
    user: user._id,
    userEmail: user.email,
    ip: ctx.ip,
  });
  return user;
}

// Reset a password without the current one (forgot-password flow). The OTP is
// verified by the caller (controller) before this runs.
async function resetPasswordByEmail(email, newPassword, ctx = {}) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.active) throw ApiError.badRequest("Unable to reset password for this account");
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
  await refreshTokenRepository.revokeAllForUser(user._id);
  await logService.record({
    type: LOG_TYPES.WARNING,
    action: LOG_ACTIONS.UPDATE,
    title: "Password reset",
    detail: `${user.email} reset their password via OTP`,
    user: user._id,
    userEmail: user.email,
    ip: ctx.ip,
  });
  return user;
}

module.exports = { hashPassword, login, refresh, logout, changePassword, resetPasswordByEmail, issueTokens };
