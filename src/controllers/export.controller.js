'use strict';
const exportService = require('../services/export.service');
const dashboardService = require('../services/dashboard.service');
const activityRepo = require('../repositories/activity.repository');
const galleryRepo = require('../repositories/gallery.repository');
const asyncHandler = require('../core/asyncHandler');
const ApiError = require('../core/ApiError');

exports.activity = asyncHandler(async (req, res) => {
  const activity = await activityRepo.findById(req.params.id);
  if (!activity) throw ApiError.notFound('Activity tidak ditemukan');
  exportService.activityReport(res, activity);
});

exports.statistics = asyncHandler(async (_req, res) => {
  exportService.statisticsReport(res, await dashboardService.stats());
});

exports.gallery = asyncHandler(async (req, res) => {
  const activity = req.query.activity ? await activityRepo.findById(req.query.activity) : null;
  const { items } = await galleryRepo.paginate({ activity: req.query.activity, page: 1, limit: 1000 });
  exportService.galleryReport(res, activity, items);
});
