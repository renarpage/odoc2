'use strict';
const { body } = require('express-validator');
const { ACTIVITY_STATUS } = require('../constants/activityStatus');
module.exports = {
  create: [
    body('title').trim().notEmpty().withMessage('Judul wajib diisi').isLength({ max: 180 }),
    body('summary').optional().isLength({ max: 500 }),
    body('status').optional().isIn(ACTIVITY_STATUS.all),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate(),
    body('visibility').optional().isIn(['public', 'private']),
  ],
};
