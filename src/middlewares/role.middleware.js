'use strict';
const { ROLES } = require('../constants/roles');
const ApiError = require('../core/ApiError');

// RBAC guard. Usage: requireRole(ROLES.SUPER_ADMIN)
function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(ApiError.forbidden('Akses ditolak untuk role ini'));
    next();
  };
}

const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);
const requireAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.STANDARD_ADMIN);

module.exports = { requireRole, requireSuperAdmin, requireAdmin };
