const userRepository = require("../repositories/userRepository");
const auditService = require("./auditService");
const ApiError = require("../utils/ApiError");
const { ROLE_VALUES, LOG_TYPES } = require("../constants");

async function list() {
  const users = await userRepository.list();
  return users.map((u) => u.toSafeJSON());
}

async function create({ name, email, password, role }, actor) {
  if (!ROLE_VALUES.includes(role)) throw ApiError.badRequest("Invalid role");
  const existing = await userRepository.findByEmail(email);
  if (existing) throw ApiError.conflict("A user with that email already exists");
  const user = await userRepository.create({
    name,
    email,
    password,
    role,
    mustChangePassword: true,
  });
  await auditService.record({
    type: LOG_TYPES.USER,
    action: "user.create",
    title: "Admin account created",
    detail: `${email} (${role})`,
    actor: actor && actor._id,
    actorEmail: actor && actor.email,
  });
  return user.toSafeJSON();
}

async function update(id, update, actor) {
  if (update.role && !ROLE_VALUES.includes(update.role)) throw ApiError.badRequest("Invalid role");
  // Never allow password updates through this path.
  delete update.password;
  const user = await userRepository.updateById(id, update);
  if (!user) throw ApiError.notFound("User not found");
  await auditService.record({
    type: LOG_TYPES.USER,
    action: "user.update",
    title: "Admin account updated",
    detail: `${user.email}`,
    actor: actor && actor._id,
    actorEmail: actor && actor.email,
  });
  return user.toSafeJSON();
}

async function remove(id, actor) {
  if (actor && actor._id.toString() === String(id)) {
    throw ApiError.badRequest("You cannot delete your own account");
  }
  const user = await userRepository.deleteById(id);
  if (!user) throw ApiError.notFound("User not found");
  await auditService.record({
    type: LOG_TYPES.WARNING,
    action: "user.delete",
    title: "Admin account deleted",
    detail: `${user.email}`,
    actor: actor && actor._id,
    actorEmail: actor && actor.email,
  });
  return user.toSafeJSON();
}

module.exports = { list, create, update, remove };
