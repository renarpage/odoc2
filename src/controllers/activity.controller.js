'use strict';
const activityService = require('../services/activity.service');
const activityRepo = require('../repositories/activity.repository');
const asyncHandler = require('../core/asyncHandler');
const ApiResponse = require('../core/ApiResponse');
const pick = require('../utils/pick');
const pagination = require('../helpers/pagination.helper');

const FIELDS = ['title', 'summary', 'description', 'startDate', 'endDate', 'location', 'organizer', 'division', 'status', 'category', 'tags', 'visibility', 'featured', 'pinned', 'isDraft'];

exports.list = asyncHandler(async (req, res) => {
  const { page, limit } = pagination.parse(req.query, { defaultLimit: 10 });
  const result = await activityService.listAdmin({ page, limit, status: req.query.status, search: req.query.q, category: req.query.category });
  if (req.xhr || req.path.startsWith('/api')) return ApiResponse.ok(res, result);
  res.render('admin/activities', { title: 'Kelola Activity', layout: 'layouts/admin', result, query: req.query });
});

exports.formPage = asyncHandler(async (req, res) => {
  const activity = req.params.id ? await activityRepo.findById(req.params.id) : null;
  res.render('admin/activity-form', { title: activity ? 'Edit Activity' : 'Activity Baru', layout: 'layouts/admin', activity });
});

exports.create = asyncHandler(async (req, res) => {
  const activity = await activityService.create(pick(req.body, FIELDS), req.user);
  return ApiResponse.created(res, activity, 'Activity berhasil dibuat');
});

exports.update = asyncHandler(async (req, res) => {
  const activity = await activityService.update(req.params.id, pick(req.body, FIELDS), req.user);
  return ApiResponse.ok(res, activity, 'Activity diperbarui');
});

exports.remove = asyncHandler(async (req, res) => {
  await activityService.remove(req.params.id, req.user);
  return ApiResponse.ok(res, null, 'Activity dihapus');
});

exports.duplicate = asyncHandler(async (req, res) => ApiResponse.created(res, await activityService.duplicate(req.params.id, req.user), 'Activity diduplikat'));
exports.publish = asyncHandler(async (req, res) => ApiResponse.ok(res, await activityService.setDraft(req.params.id, false, req.user), 'Activity dipublish'));
exports.unpublish = asyncHandler(async (req, res) => ApiResponse.ok(res, await activityService.setDraft(req.params.id, true, req.user), 'Activity dijadikan draft'));
exports.archive = asyncHandler(async (req, res) => ApiResponse.ok(res, await activityService.archive(req.params.id, true, req.user), 'Activity diarsipkan'));
