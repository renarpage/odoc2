'use strict';
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const { validate } = require('../middlewares/validate.middleware');
const authValidator = require('../validators/auth.validator');

router.get('/login', authController.loginPage);
router.post('/login', authLimiter, validate(authValidator.login), authController.login);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;
