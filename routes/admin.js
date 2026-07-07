const express = require("express");
const router = express.Router();
const store = require("../data/store");

// Every admin view uses the admin layout (with sidebar) by default
router.use((req, res, next) => {
  res.locals.layout = "layouts/admin";
  next();
});

// Dashboard
router.get("/", (req, res) => {
  res.render("admin/dashboard", {
    title: "Dashboard",
    stats: store.stats(),
    recentActivities: store.activities,
    systemLogs: store.systemLogs
  });
});

// Activities (manager / list)
router.get("/activities", (req, res) => {
  res.render("admin/activities", {
    title: "Activities",
    stats: store.stats(),
    activities: store.activities
  });
});

// Create Activity - multi step form (rendered as a single page w/ JS steps)
router.get("/activities/new", (req, res) => {
  res.render("admin/activity-form", {
    title: "Create New Activity"
  });
});

router.post("/activities/new", (req, res) => {
  const created = store.addActivity(req.body);
  req.flash("success", `Activity "${created.title}" was created.`);
  res.redirect("/admin/activities");
});

// Storage
router.get("/storage", (req, res) => {
  res.render("admin/storage", {
    title: "Storage",
    stats: store.stats(),
    recentUploads: store.recentUploads
  });
});

// Branding
router.get("/branding", (req, res) => {
  res.render("admin/branding", {
    title: "Branding & Customization",
    branding: store.branding
  });
});

router.post("/branding", (req, res) => {
  Object.assign(store.branding, req.body);
  req.flash("success", "Brand identity saved.");
  res.redirect("/admin/branding");
});

// Settings
router.get("/settings", (req, res) => {
  res.render("admin/settings", {
    title: "System Settings",
    settings: store.settings
  });
});

router.post("/settings", (req, res) => {
  Object.assign(store.settings, req.body);
  req.flash("success", "Settings saved.");
  res.redirect("/admin/settings");
});

// Users (stub, referenced from sidebar)
router.get("/users", (req, res) => {
  res.render("admin/users", { title: "Users" });
});

module.exports = router;
