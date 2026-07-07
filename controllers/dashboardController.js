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

module.exports = { index, healthApi, statsApi };
