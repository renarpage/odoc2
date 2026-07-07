'use strict';
const dashboardService = require('../services/dashboard.service');
const healthcheckService = require('../services/healthcheck.service');
const asyncHandler = require('../core/asyncHandler');

exports.page = asyncHandler(async (req, res) => {
  const [stats, logs, health] = await Promise.all([
    dashboardService.stats(),
    dashboardService.recentLogs(10),
    healthcheckService.check(),
  ]);
  res.render('admin/dashboard', { title: 'Dashboard', layout: 'layouts/admin', stats, logs, health });
});

exports.statsJson = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await dashboardService.stats() });
});

exports.health = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await healthcheckService.check() });
});
