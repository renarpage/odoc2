//==============================================================//
//  CONTROLLER — Storage analytics                              //
//==============================================================//
const asyncHandler = require("../core/asyncHandler");
const storageService = require("../services/storageService");
const dashboardService = require("../services/dashboardService");

const page = asyncHandler(async (req, res) => {
  const [storage, stats] = await Promise.all([
    storageService.overview(),
    dashboardService.stats(),
  ]);
  res.render("admin/storage", {
    title: "Storage",
    storage,
    stats,
    recentUploads: storage.recentUploads,
  });
});

module.exports = { page };
