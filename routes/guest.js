const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const trackVisit = require("../middlewares/visitor");

router.get("/", trackVisit, guestController.home);
router.get("/activity/:id", trackVisit, guestController.activityDetail);

module.exports = router;
