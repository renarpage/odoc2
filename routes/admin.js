//==============================================================//
//  ROUTES — Admin (server-rendered pages)                      //
//  Auth-gated. Super-admin-only actions guarded per route.     //
//==============================================================//
const express = require("express");
const router = express.Router();

const { requireAuth, requireSuperAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const dashboardController = require("../controllers/dashboardController");
const activityController = require("../controllers/activityController");
const storageController = require("../controllers/storageController");
const settingsController = require("../controllers/settingsController");
const userController = require("../controllers/userController");

// Every admin route requires an authenticated user.
router.use(requireAuth);

// All admin views render inside the admin layout.
router.use((req, res, next) => {
  res.locals.layout = "layouts/admin";
  next();
});

//-- Dashboard --------------------------------------------------//
router.get("/", dashboardController.index);

//-- Activities -------------------------------------------------//
router.get("/activities", activityController.adminList);
router.get("/activities/new", activityController.newForm);
router.post("/activities/new", upload.fields([{ name: "cover", maxCount: 1 }, { name: "gallery", maxCount: 200 }, { name: "documents", maxCount: 50 }]), activityController.createFromForm);
router.get("/activities/:slug/edit", activityController.editForm);
router.post("/activities/:slug/edit", upload.fields([{ name: "cover", maxCount: 1 }, { name: "gallery", maxCount: 200 }, { name: "documents", maxCount: 50 }]), activityController.updateFromForm);
router.post("/activities/:slug/delete", activityController.deleteFromForm);
router.post("/activities/:slug/duplicate", activityController.duplicateFromForm);

//-- Storage ----------------------------------------------------//
router.get("/storage", storageController.page);

//-- Settings (super admin only) --------------------------------//
router.get("/settings", requireSuperAdmin, settingsController.page);
router.post("/settings", requireSuperAdmin, settingsController.updateFromForm);
router.post("/settings/test-smtp", requireSuperAdmin, settingsController.testSmtp);

//-- Users (view open to all admins; mutations super-admin only) //
router.get("/users", userController.page);
router.post("/users", requireSuperAdmin, userController.createFromForm);
router.post("/users/:id/update", requireSuperAdmin, userController.updateFromForm);
router.post("/users/:id/delete", requireSuperAdmin, userController.removeFromForm);
router.post("/users/:id/toggle", requireSuperAdmin, userController.toggleActiveFromForm);
router.post("/users/:id/reset-password", requireSuperAdmin, userController.resetPasswordFromForm);

module.exports = router;
