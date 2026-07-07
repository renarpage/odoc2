'use strict';
const { body } = require('express-validator');
module.exports = {
  login: [
    body('email').isEmail().withMessage('Email tidak valid').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
  ],
};
