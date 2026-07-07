'use strict';
const router = require('express').Router();
const guestController = require('../controllers/guest.controller');
const { cachePage } = require('../middlewares/cache.middleware');

router.get('/', cachePage(60), guestController.home);
router.get('/activities.json', guestController.activitiesJson);
router.get('/activity/:slug', cachePage(120), guestController.activityDetail);

module.exports = router;
