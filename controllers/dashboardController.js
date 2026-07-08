const asyncHandler = require("../core/asyncHandler");
const dashboardService = require("../services/dashboardService");
const { ok } = require("../helpers/response");

const index = asyncHandler(async (req, res) => {
  const [stats, recentActivities, systemLogs] = await Promise.all([
    dashboardService.stats(),
    dashboardService.recentActivities(6),
    dashboardService.systemLogs(6),
  ]);
  res.render("admin/dashboard", {
    title: "Dashboard",
    stats,
    recentActivities,
    systemLogs,
  });
});

const healthApi = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.health());
});

const statsApi = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.stats());
});

// Recent system logs for the topbar notification bell.
const notificationsApi = asyncHandler(async (req, res) => {
  const logs = await dashboardService.systemLogs(8);
  ok(res, logs);
});

module.exports = { index, healthApi, statsApi, notificationsApi };
