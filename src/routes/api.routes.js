'use strict';
const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin, requireSuperAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const { uploadImages, uploadDocuments } = require('../middlewares/upload.middleware');
const activityValidator = require('../validators/activity.validator');
const settingValidator = require('../validators/setting.validator');

const activityController = require('../controllers/activity.controller');
const galleryController = require('../controllers/gallery.controller');
const documentController = require('../controllers/document.controller');
const dashboardController = require('../controllers/dashboard.controller');
const notificationController = require('../controllers/notification.controller');
const settingController = require('../controllers/setting.controller');
const analyticsController = require('../controllers/analytics.controller');
const exportController = require('../controllers/export.controller');

// Public (guest) read endpoints
router.get('/documents/:id/download', documentController.download);

// Everything below requires an authenticated admin
router.use(requireAuth, requireAdmin);

// Dashboard & analytics
router.get('/dashboard/stats', dashboardController.statsJson);
router.get('/health', dashboardController.health);
router.get('/analytics', analyticsController.overview);

// Activities
router.get('/activities', activityController.list);
router.post('/activities', validate(activityValidator.create), activityController.create);
router.put('/activities/:id', activityController.update);
router.delete('/activities/:id', activityController.remove);
router.post('/activities/:id/duplicate', activityController.duplicate);
router.post('/activities/:id/publish', activityController.publish);
router.post('/activities/:id/unpublish', activityController.unpublish);
router.post('/activities/:id/archive', activityController.archive);

// Uploads
router.post('/activities/:activityId/gallery', uploadLimiter, uploadImages, galleryController.upload);
router.post('/activities/:activityId/documents', uploadLimiter, uploadDocuments, documentController.upload);
router.get('/gallery', galleryController.list);
router.delete('/gallery/:id', galleryController.remove);
router.delete('/documents/:id', documentController.remove);

// Notifications
router.get('/notifications', notificationController.list);
router.post('/notifications/:id/read', notificationController.markRead);
router.post('/notifications/read-all', notificationController.markAllRead);

// Exports (PDF)
router.get('/export/activity/:id', exportController.activity);
router.get('/export/statistics', exportController.statistics);
router.get('/export/gallery', exportController.gallery);

// SuperAdmin: settings / branding
router.put('/settings', requireSuperAdmin, validate(settingValidator.update), settingController.update);

module.exports = router;
