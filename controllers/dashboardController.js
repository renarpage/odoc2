//==============================================================//
//  CONTROLLER — Dashboard                                      //
//==============================================================//
const asyncHandler = require("../core/asyncHandler");
const dashboardService = require("../services/dashboardService");
const uploadJobService = require("../services/uploadJobService");
const { ok } = require("../helpers/response");

// Render the dashboard (stats + recent activities + logs).
const index = asyncHandler(async (req, res) => {
  const [stats, recentActivities, systemLogs] = await Promise.all([
    dashboardService.stats(),
    dashboardService.recentActivities(6),
    dashboardService.systemLogs(6),
  ]);
  res.render("admin/dashboard", { title: "Dashboard", stats, recentActivities, systemLogs });
});

const healthApi = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.health());
});

const statsApi = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.stats());
});

// Recent system logs for the topbar notification bell.
const notificationsApi = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.systemLogs(8));
});

// Live background upload jobs for the current admin.
const uploadJobsApi = asyncHandler(async (req, res) => {
  ok(res, await uploadJobService.listForUser(req.user && req.user._id));
});

module.exports = { index, healthApi, statsApi, notificationsApi, uploadJobsApi };
