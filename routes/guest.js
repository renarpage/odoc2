const express = require("express");
const router = express.Router();
const store = require("../data/store");

// Landing / Home
router.get("/", (req, res) => {
  const { filter } = req.query;
  const allActivities = store.activities;

  let galleryActivities = allActivities;
  if (filter === "all") {
    galleryActivities = allActivities;
  }
  if (filter === "ongoing") {
    galleryActivities = allActivities.filter(a => a.status === "Ongoing");
  }
  if (filter === "upcoming") {
    galleryActivities = allActivities.filter(a => a.status === "Upcoming");
  }
  if (filter === "completed") {
    galleryActivities = allActivities.filter(a => a.status === "Completed");
  }

  res.render("home", {
    title: "ODOC Digital Archive",
    layout: "layouts/guest",
    activities: galleryActivities,
    allActivities,
    activeFilter: filter || "all"
  });
});

// Activity detail (public)
router.get("/activity/:id", (req, res) => {
  const activity = store.findActivity(req.params.id);
  if (!activity) {
    return res.status(404).render("404", { layout: "layouts/guest", title: "Activity Not Found" });
  }
  res.render("activity-detail", {
    title: activity.title,
    layout: "layouts/guest",
    activity
  });
});

module.exports = router;
