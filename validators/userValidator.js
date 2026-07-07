const ApiError = require("../core/ApiError");
const { ROLES } = require("../constants");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreate(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!name) throw ApiError.badRequest("Name is required");
  if (!EMAIL_RE.test(email)) throw ApiError.badRequest("A valid email is required");
  if (password.length < 8) throw ApiError.badRequest("Password must be at least 8 characters");
  const role = Object.values(ROLES).includes(body.role) ? body.role : ROLES.STANDARD_ADMIN;
  return { name, email, password, role };
}

module.exports = { validateCreate };
