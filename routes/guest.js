const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");

// Landing / Home
router.get("/", guestController.home);

// Activity detail (public)
router.get("/activity/:id", guestController.activityDetail);

module.exports = router;
