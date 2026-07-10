const asyncHandler = require("../core/asyncHandler");
const activityService = require("../services/activityService");
const galleryService = require("../services/galleryService");
const documentService = require("../services/documentService");
const dashboardService = require("../services/dashboardService");
const uploadJobService = require("../services/uploadJobService");
const logger = require("../config/logger");
const { ok, created } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

// Synchronous file handling (used by edit, where we stay on the page).
async function handleFiles(slug, files, ctx) {
  const f = files || {};
  if (!f.cover && !f.gallery && !f.documents) return null;
  try {
    if (f.cover && f.cover[0]) await activityService.setCover(slug, f.cover[0], ctx);
    if (f.gallery && f.gallery.length) await galleryService.uploadForActivity(slug, f.gallery, ctx);
    if (f.documents && f.documents.length) await documentService.uploadForActivity(slug, f.documents, ctx);
    return null;
  } catch (err) {
    logger.error("Activity file upload failed", { slug, error: err.message });
    return err.message;
  }
}

const adminList = asyncHandler(async (req, res) => {
  const filters = { status: req.query.status || "", category: req.query.category || "", q: req.query.q || "" };
  const [{ activities, meta }, stats] = await Promise.all([
    activityService.listAdmin({ status: filters.status, category: filters.category, search: filters.q, query: req.query }),
    dashboardService.stats(),
  ]);
  res.render("admin/activities", { title: "Activities", stats, activities, meta, filters });
});

const newForm = (req, res) => {
  res.render("admin/activity-form", { title: "Create New Activity", activity: null, mode: "create" });
};

const editForm = asyncHandler(async (req, res) => {
  const activity = await activityService.getBySlug(req.params.slug);
  res.render("admin/activity-form", { title: "Edit Activity", activity, mode: "edit" });
});

// Create the activity record right away, kick file uploads to the background,
// and redirect to the dashboard so the admin never waits on this page.
const createFromForm = asyncHandler(async (req, res) => {
  const ctx = ctxOf(req);
  const activity = await activityService.create(req.body, ctx);
  const label = req.body.action === "draft" ? "saved as draft" : "published";

  if (uploadJobService.hasFiles(req.files)) {
    uploadJobService.start({
      user: req.user && req.user._id,
      title: activity.title,
      slug: activity.id,
      files: req.files,
      ctx,
    });
    req.flash("success", `Activity "${activity.title}" ${label}. Uploading media in the background\u2026`);
  } else {
    req.flash("success", `Activity "${activity.title}" was ${label}.`);
  }
  res.redirect("/admin");
});

const updateFromForm = asyncHandler(async (req, res) => {
  const ctx = ctxOf(req);
  const activity = await activityService.update(req.params.slug, req.body, ctx);

  if (uploadJobService.hasFiles(req.files)) {
    uploadJobService.start({
      user: req.user && req.user._id,
      title: activity.title,
      slug: activity.id,
      files: req.files,
      ctx,
    });
    req.flash("success", `Activity "${activity.title}" updated. Uploading new media in the background\u2026`);
    return res.redirect("/admin");
  }
  req.flash("success", `Activity "${activity.title}" was updated.`);
  return res.redirect("/admin/activities");
});

const deleteFromForm = asyncHandler(async (req, res) => {
  await activityService.remove(req.params.slug, ctxOf(req));
  req.flash("success", "Activity deleted.");
  res.redirect("/admin/activities");
});

const duplicateFromForm = asyncHandler(async (req, res) => {
  const activity = await activityService.duplicate(req.params.slug, ctxOf(req));
  req.flash("success", `Duplicated as draft: "${activity.title}".`);
  res.redirect("/admin/activities");
});

// ---- JSON API variants ----
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

module.exports = {
  adminList,
  newForm,
  editForm,
  createFromForm,
  updateFromForm,
  deleteFromForm,
  duplicateFromForm,
  createApi,
  updateApi,
  removeApi,
  duplicateApi,
  listApi,
};
