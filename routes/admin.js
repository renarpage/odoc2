const express = require("express");
const router = express.Router();

const { requireAuth, requireSuperAdmin } = require("../middlewares/auth");
const dashboardController = require("../controllers/dashboardController");
const activityController = require("../controllers/activityController");
const storageController = require("../controllers/storageController");
const brandingController = require("../controllers/brandingController");
const settingsController = require("../controllers/settingsController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// All admin pages require authentication and use the admin layout.
router.use(requireAuth);
router.use((req, res, next) => {
  res.locals.layout = "layouts/admin";
  next();
});

router.get("/", dashboardController.index);

router.get("/activities", activityController.adminList);
router.get("/activities/new", activityController.newForm);
router.post("/activities/new", activityController.createFromForm);

router.get("/storage", storageController.page);

router.get("/branding", brandingController.page);
router.post("/branding", brandingController.updateFromForm);

router.get("/settings", settingsController.page);
router.post("/settings", settingsController.updateFromForm);

// Account self-service (forced password change on first login).
router.get("/account/password", authController.getChangePassword);
router.post("/account/password", authController.postChangePassword);

// User management is Super Admin only.
router.get("/users", requireSuperAdmin, userController.page);
router.post("/users", requireSuperAdmin, userController.createFromForm);

module.exports = router;
