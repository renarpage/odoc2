/**
 * JWT authentication with transparent refresh-token rotation.
 * - authenticate: best-effort; attaches req.user + res.locals.currentUser.
 * - requireAuth: blocks unauthenticated access (redirect for web, 401 for API).
 * - requireRole: role-based authorization.
 */
const tokenService = require("../services/tokenService");
const authService = require("../services/authService");
const userRepository = require("../repositories/userRepository");
const logService = require("../services/logService");
const { setAuthCookies, clearAuthCookies } = require("../helpers/cookies");
const { userToView } = require("../helpers/serializers");
const { COOKIES, ROLES, ROLE_LABELS, LOG_TYPES, LOG_ACTIONS } = require("../constants");

function wantsJson(req) {
  return req.originalUrl.startsWith("/api") || req.xhr || (req.get("accept") || "").includes("application/json");
}

async function loadUser(userId) {
  if (!userId) return null;
  const user = await userRepository.findById(userId);
  return user && user.active ? user : null;
}

async function authenticate(req, res, next) {
  try {
    const accessToken = req.cookies[COOKIES.ACCESS];
    if (accessToken) {
      try {
        const payload = tokenService.verifyAccessToken(accessToken);
        const user = await loadUser(payload.sub);
        if (user) {
          req.user = user;
          res.locals.currentUser = userToView(user);
          return next();
        }
      } catch (_) {
        /* access expired/invalid -> fall through to refresh */
      }
    }

    const refreshValue = req.cookies[COOKIES.REFRESH];
    if (refreshValue) {
      try {
        const { user, ...tokens } = await authService.refresh(refreshValue, {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        });
        setAuthCookies(res, tokens);
        req.user = user;
        res.locals.currentUser = userToView(user);
        return next();
      } catch (_) {
        clearAuthCookies(res);
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  const next_ = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?next=${next_}`);
}

function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) return requireAuth(req, res, next);
    if (!roles.includes(req.user.role)) {
      await logService.record({
        type: LOG_TYPES.WARNING,
        action: LOG_ACTIONS.PERMISSION_DENIED,
        title: "Permission denied",
        detail: `${req.user.email} attempted ${req.method} ${req.originalUrl}`,
        user: req.user._id,
        userEmail: req.user.email,
        ip: req.ip,
      });
      if (wantsJson(req)) return res.status(403).json({ success: false, message: "Insufficient permissions" });
      return res.status(403).render("admin/forbidden", { title: "Forbidden", layout: "layouts/admin" });
    }
    return next();
  };
}

const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);
const requireAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.STANDARD_ADMIN);

module.exports = { authenticate, requireAuth, requireRole, requireSuperAdmin, requireAdmin, ROLE_LABELS };
