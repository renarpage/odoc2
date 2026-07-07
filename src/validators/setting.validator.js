'use strict';
const { body } = require('express-validator');
const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
module.exports = {
  update: [
    body('primaryColor').optional().matches(hex).withMessage('Warna primary tidak valid'),
    body('secondaryColor').optional().matches(hex),
    body('tagline').optional().isLength({ max: 160 }),
    body('heroTitle').optional().isLength({ max: 160 }),
  ],
};
