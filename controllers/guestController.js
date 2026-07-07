const asyncHandler = require("../core/asyncHandler");
const activityService = require("../services/activityService");
const { ok } = require("../helpers/response");

const home = asyncHandler(async (req, res) => {
  const { filter } = req.query;
  const { activities, allActivities, activeFilter } = await activityService.listPublic({
    filter: filter || "all",
    search: req.query.q || "",
    query: req.query,
  });
  res.render("home", {
    title: "ODOC Digital Archive",
    layout: "layouts/guest",
    activities,
    allActivities,
    activeFilter,
  });
});

const activityDetail = asyncHandler(async (req, res) => {
  const activity = await activityService.getBySlug(req.params.id, { countView: true });
  res.render("activity-detail", {
    title: activity.title,
    layout: "layouts/guest",
    activity,
  });
});

// JSON search endpoint for instant/debounced search + filters.
const search = asyncHandler(async (req, res) => {
  const result = await activityService.listPublic({
    filter: req.query.filter || "all",
    search: req.query.q || "",
    query: req.query,
  });
  ok(res, result.activities, result.meta);
});

module.exports = { home, activityDetail, search };
