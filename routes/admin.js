const express = require("express");
const router = express.Router();

const { requireAuth, requireSuperAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const dashboardController = require("../controllers/dashboardController");
const activityController = require("../controllers/activityController");
const storageController = require("../controllers/storageController");
const brandingController = require("../controllers/brandingController");
const settingsController = require("../controllers/settingsController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// Multipart handler for the activity form (cover + gallery + documents).
const activityUpload = upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "gallery", maxCount: 20 },
  { name: "documents", maxCount: 20 },
]);

// All admin pages require authentication and use the admin layout.
router.use(requireAuth);
router.use((req, res, next) => {
  res.locals.layout = "layouts/admin";
  next();
});

router.get("/", dashboardController.index);

router.get("/activities", activityController.adminList);
router.get("/activities/new", activityController.newForm);
router.post("/activities/new", activityUpload, activityController.createFromForm);
router.get("/activities/:slug/edit", activityController.editForm);
router.post("/activities/:slug/edit", activityUpload, activityController.updateFromForm);
router.post("/activities/:slug/duplicate", activityController.duplicateFromForm);
router.post("/activities/:slug/delete", activityController.deleteFromForm);

router.get("/storage", storageController.page);

router.get("/branding", brandingController.page);
router.post("/branding", brandingController.updateFromForm);

router.get("/settings", settingsController.page);
router.post("/settings", settingsController.updateFromForm);

router.get("/account/password", authController.getChangePassword);
router.post("/account/password", authController.postChangePassword);

router.get("/users", requireSuperAdmin, userController.page);
router.post("/users", requireSuperAdmin, userController.createFromForm);

module.exports = router;
