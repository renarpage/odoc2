/**
 * Admin account management (Super Admin only).
 */
const userRepository = require("../repositories/userRepository");
const refreshTokenRepository = require("../repositories/refreshTokenRepository");
const authService = require("./authService");
const logService = require("./logService");
const ApiError = require("../core/ApiError");
const { userToView } = require("../helpers/serializers");
const { ROLES, LOG_TYPES, LOG_ACTIONS } = require("../constants");

async function list() {
  const users = await userRepository.listAdmins();
  return users.map(userToView);
}

async function create(payload, ctx = {}) {
  if (!payload.email || !payload.name || !payload.password) {
    throw ApiError.badRequest("Name, email and password are required");
  }
  const existing = await userRepository.findByEmail(payload.email);
  if (existing) throw ApiError.conflict("A user with that email already exists");

  const passwordHash = await authService.hashPassword(payload.password);
  const role = Object.values(ROLES).includes(payload.role) ? payload.role : ROLES.STANDARD_ADMIN;
  const user = await userRepository.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    role,
    mustChangePassword: true,
  });
  await logService.record({
    type: LOG_TYPES.USER,
    action: LOG_ACTIONS.CREATE,
    title: "Admin account created",
    detail: `${user.email} (${role})`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return userToView(user);
}

async function update(id, payload, ctx = {}) {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound("User not found");
  if (payload.name !== undefined) user.name = payload.name;
  if (payload.role && Object.values(ROLES).includes(payload.role)) user.role = payload.role;
  if (payload.active !== undefined) user.active = payload.active === "on" || payload.active === true;
  await user.save();
  await logService.record({
    type: LOG_TYPES.INFO,
    action: LOG_ACTIONS.UPDATE,
    title: "Admin account updated",
    detail: user.email,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return userToView(user);
}

async function remove(id, ctx = {}) {
  if (String(id) === String(ctx.userId)) throw ApiError.badRequest("You cannot delete your own account");
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound("User not found");
  await refreshTokenRepository.revokeAllForUser(user._id);
  await userRepository.deleteById(id);
  await logService.record({
    type: LOG_TYPES.WARNING,
    action: LOG_ACTIONS.DELETE,
    title: "Admin account removed",
    detail: user.email,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return { id: String(id) };
}

module.exports = { list, create, update, remove };
