/**
 * Maintenance mode middleware.
 * When maintenance mode is enabled in system settings, blocks ALL public access.
 * Only authenticated admin/super_admin users can still browse the site.
 * Auth routes (/login, /api/auth/*) always pass through so admins can log in.
 */
const settingRepository = require("../repositories/settingRepository");
const { ROLES } = require("../constants");

const BYPASS_PATHS = [
  "/login",
  "/logout",
  "/api/auth",
  "/forgot-password",
  "/reset-password",
];

function shouldBypass(path) {
  return BYPASS_PATHS.some((bp) => path === bp || path.startsWith(bp + "/") || path.startsWith(bp + "?"));
}

async function maintenanceMiddleware(req, res, next) {
  // Always let admin routes and auth routes through
  if (req.path.startsWith("/admin") || req.path.startsWith("/api/admin") || shouldBypass(req.path)) {
    return next();
  }

  // Check if user is an authenticated admin
  if (req.user && (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.STANDARD_ADMIN)) {
    return next();
  }

  // Check maintenance mode from DB
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
    // If DB is down, don't block access
  }

  return next();
}

module.exports = maintenanceMiddleware;
