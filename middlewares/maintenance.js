//==============================================================//
//  MIDDLEWARE — Maintenance mode gate                          //
//  Blocks public traffic when enabled; admins always pass.     //
//  Auth routes stay open so admins can still sign in.          //
//==============================================================//
const settingRepository = require("../repositories/settingRepository");
const { ROLES } = require("../constants");

const BYPASS_PATHS = ["/login", "/logout", "/api/auth", "/forgot-password", "/reset-password"];

function shouldBypass(path) {
  return BYPASS_PATHS.some((bp) => path === bp || path.startsWith(bp + "/") || path.startsWith(bp + "?"));
}

async function maintenanceMiddleware(req, res, next) {
  // Admin area and auth routes are never gated.
  if (req.path.startsWith("/admin") || req.path.startsWith("/api/admin") || shouldBypass(req.path)) {
    return next();
  }

  // Authenticated admins bypass the gate.
  if (req.user && (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.STANDARD_ADMIN)) {
    return next();
  }

  try {
    const data = await settingRepository.getData("system", {});
    if (data.maintenanceMode) {
      return res.status(503).render("maintenance", {
        layout: false,
        platformName: data.platformName || "ODOC Digital Archive",
        maintenanceMessage: data.maintenanceMessage || "We are performing scheduled maintenance. Please check back soon.",
      });
    }
  } catch (_) {
    // If the DB is unreachable, fail open rather than lock everyone out.
  }

  return next();
}

module.exports = maintenanceMiddleware;
