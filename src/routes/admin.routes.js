'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin, requireSuperAdmin } = require('../middlewares/role.middleware');
const dashboardController = require('../controllers/dashboard.controller');
const activityController = require('../controllers/activity.controller');
const adminController = require('../controllers/admin.controller');
const settingController = require('../controllers/setting.controller');

router.use(requireAuth, requireAdmin);

router.get('/', dashboardController.page);
router.get('/activities', activityController.list);
router.get('/activities/new', activityController.formPage);
router.get('/activities/:id/edit', activityController.formPage);
router.get('/storage', adminController.storagePage);
router.get('/settings', adminController.settingsPage);

// SuperAdmin only
router.get('/branding', requireSuperAdmin, settingController.page);
router.get('/users', requireSuperAdmin, adminController.usersPage);

module.exports = router;
