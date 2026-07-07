'use strict';
const activityService = require('../services/activity.service');
const documentService = require('../services/document.service');
const settingService = require('../services/setting.service');
const asyncHandler = require('../core/asyncHandler');
const pagination = require('../helpers/pagination.helper');
const seo = require('../utils/seo');

exports.home = asyncHandler(async (req, res) => {
  const { page, limit } = pagination.parse(req.query, { defaultLimit: 9 });
  const [result, settings] = await Promise.all([
    activityService.listPublic({ page, limit, status: req.query.status, category: req.query.category, division: req.query.division, year: req.query.year, tag: req.query.tag, search: req.query.q }),
    settingService.get(),
  ]);
  res.render('home', { title: 'ODOC - OSIS SMAVO', layout: 'layouts/guest', result, settings, query: req.query });
});

exports.activityDetail = asyncHandler(async (req, res) => {
  const { activity, related } = await activityService.getPublicBySlug(req.params.slug);
  const documents = await documentService.byActivity(activity._id);
  res.render('activity-detail', { title: activity.title, layout: 'layouts/guest', activity, related, documents, meta: seo.meta(activity) });
});

// JSON endpoint for infinite scroll on the public archive.
exports.activitiesJson = asyncHandler(async (req, res) => {
  const { page, limit } = pagination.parse(req.query, { defaultLimit: 9 });
  const result = await activityService.listPublic({ page, limit, search: req.query.q, status: req.query.status, category: req.query.category });
  res.json({ success: true, data: result });
});
