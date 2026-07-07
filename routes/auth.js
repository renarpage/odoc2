const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authLimiter } = require("../middlewares/rateLimiter");

router.get("/login", authController.getLogin);
router.post("/login", authLimiter, authController.postLogin);
// Support both link-style (GET) and form/API (POST) logout.
router.get("/logout", authController.postLogout);
router.post("/logout", authController.postLogout);

module.exports = router;
