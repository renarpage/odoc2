//==============================================================//
//  ROUTES — Guest (public site)                                //
//==============================================================//
const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");

// Landing / archive listing.
router.get("/", guestController.home);

// Public activity detail page.
router.get("/activity/:id", guestController.activityDetail);

module.exports = router;
