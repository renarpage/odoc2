/**
 * JSON API surface. Guest endpoints are public; everything under /admin
 * requires authentication, and user management requires Super Admin.
 */
const express = require("express");
const router = express.Router();

const { requireAuth, requireSuperAdmin } = require("../middlewares/auth");
const { authLimiter } = require("../middlewares/rateLimiter");
const upload = require("../middlewares/upload");

const authController = require("../controllers/authController");
const guestController = require("../controllers/guestController");
const dashboardController = require("../controllers/dashboardController");
const activityController = require("../controllers/activityController");
const galleryController = require("../controllers/galleryController");
const documentController = require("../controllers/documentController");
const mediaController = require("../controllers/mediaController");
const brandingController = require("../controllers/brandingController");
const settingsController = require("../controllers/settingsController");
const userController = require("../controllers/userController");

// ---- Public ----
router.get("/activities/search", guestController.search);
router.get("/activities/:slug/media.zip", mediaController.zipGallery);
router.get("/documents/:id/download", documentController.download);

// ---- Auth ----
router.post("/auth/login", authLimiter, authController.postLogin);
router.post("/auth/logout", authController.postLogout);
router.get("/auth/me", requireAuth, authController.me);
router.post("/auth/change-password", requireAuth, authController.postChangePassword);

// ---- Admin (authenticated) ----
router.use("/admin", requireAuth);

router.get("/admin/dashboard/stats", dashboardController.statsApi);
router.get("/admin/health", dashboardController.healthApi);
router.get("/admin/notifications", dashboardController.notificationsApi);
router.get("/admin/upload-jobs", dashboardController.uploadJobsApi);

router.get("/admin/activities", activityController.listApi);
router.post("/admin/activities", activityController.createApi);
router.put("/admin/activities/:slug", activityController.updateApi);
router.delete("/admin/activities/:slug", activityController.removeApi);
router.post("/admin/activities/:slug/duplicate", activityController.duplicateApi);

router.post("/admin/activities/:slug/gallery", upload.array("files", 20), galleryController.upload);
router.delete("/admin/gallery/:id", galleryController.remove);

router.post("/admin/activities/:slug/documents", upload.array("files", 20), documentController.upload);

router.put("/admin/branding", brandingController.updateApi);
router.put("/admin/settings", settingsController.updateApi);

router.get("/admin/users", requireSuperAdmin, userController.page);
router.post("/admin/users", requireSuperAdmin, userController.createApi);
router.put("/admin/users/:id", requireSuperAdmin, userController.updateApi);
router.delete("/admin/users/:id", requireSuperAdmin, userController.removeApi);

module.exports = router;
