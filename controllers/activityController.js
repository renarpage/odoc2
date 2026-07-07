const asyncHandler = require("../core/asyncHandler");
const activityService = require("../services/activityService");
const dashboardService = require("../services/dashboardService");
const { ok, created } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

const adminList = asyncHandler(async (req, res) => {
  const [{ activities, meta }, stats] = await Promise.all([
    activityService.listAdmin({
      status: req.query.status,
      category: req.query.category,
      search: req.query.q,
      query: req.query,
    }),
    dashboardService.stats(),
  ]);
  res.render("admin/activities", { title: "Activities", stats, activities, meta });
});

const newForm = (req, res) => {
  res.render("admin/activity-form", { title: "Create New Activity" });
};

// Legacy server-rendered form post (kept at existing URL /admin/activities/new).
const createFromForm = asyncHandler(async (req, res) => {
  const activity = await activityService.create(req.body, ctxOf(req));
  req.flash("success", `Activity "${activity.title}" was created.`);
  res.redirect("/admin/activities");
});

// JSON API variants for progressive enhancement.
const createApi = asyncHandler(async (req, res) => {
  created(res, await activityService.create(req.body, ctxOf(req)));
});
const updateApi = asyncHandler(async (req, res) => {
  ok(res, await activityService.update(req.params.slug, req.body, ctxOf(req)));
});
const removeApi = asyncHandler(async (req, res) => {
  ok(res, await activityService.remove(req.params.slug, ctxOf(req)));
});
const duplicateApi = asyncHandler(async (req, res) => {
  created(res, await activityService.duplicate(req.params.slug, ctxOf(req)));
});
const listApi = asyncHandler(async (req, res) => {
  const { activities, meta } = await activityService.listAdmin({
    status: req.query.status,
    category: req.query.category,
    search: req.query.q,
    query: req.query,
  });
  ok(res, activities, meta);
});

module.exports = { adminList, newForm, createFromForm, createApi, updateApi, removeApi, duplicateApi, listApi };
