/**
 * Activity domain logic: public listing/search, admin CRUD, duplicate, status.
 */
const activityRepository = require("../repositories/activityRepository");
const galleryRepository = require("../repositories/galleryRepository");
const documentRepository = require("../repositories/documentRepository");
const driveService = require("./driveService");
const logService = require("./logService");
const ApiError = require("../core/ApiError");
const { activityToView } = require("../helpers/serializers");
const { parsePagination, buildMeta } = require("../helpers/pagination");
const { ACTIVITY_STATUS, VISIBILITY, LOG_TYPES, LOG_ACTIONS } = require("../constants");

const STATUS_BY_FILTER = {
  ongoing: ACTIVITY_STATUS.ONGOING,
  upcoming: ACTIVITY_STATUS.UPCOMING,
  completed: ACTIVITY_STATUS.COMPLETED,
};

function buildQuery({ filter, status, category, search, publicOnly }) {
  const q = {};
  if (publicOnly) q.visibility = VISIBILITY.PUBLIC;
  const wantStatus = status || STATUS_BY_FILTER[String(filter || "").toLowerCase()];
  if (wantStatus && wantStatus !== "all") q.status = wantStatus;
  if (category && category !== "all") q.category = category;
  if (search && search.trim()) q.$text = { $search: search.trim() };
  return q;
}

async function listPublic({ filter = "all", search = "", query = {} } = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 9 });
  const mongoQuery = buildQuery({ filter, search, publicOnly: true });
  const sort = search ? { score: { $meta: "textScore" } } : { pinned: -1, date: -1 };
  const [docs, total, allDocs] = await Promise.all([
    activityRepository.find(mongoQuery, { sort, skip, limit }),
    activityRepository.count(mongoQuery),
    activityRepository.find({ visibility: VISIBILITY.PUBLIC }, { sort: { date: -1 }, limit: 0 }),
  ]);
  return {
    activities: docs.map(activityToView),
    allActivities: allDocs.map(activityToView),
    activeFilter: filter || "all",
    meta: buildMeta({ page, limit, total }),
  };
}

async function listAdmin({ status, category, search, query = {} } = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 10 });
  const mongoQuery = buildQuery({ status, category, search });
  const sort = search ? { score: { $meta: "textScore" } } : { createdAt: -1 };
  const [docs, total] = await Promise.all([
    activityRepository.find(mongoQuery, { sort, skip, limit }),
    activityRepository.count(mongoQuery),
  ]);
  return { activities: docs.map(activityToView), meta: buildMeta({ page, limit, total }) };
}

async function getBySlug(slug, { countView = false } = {}) {
  const doc = await activityRepository.findBySlug(slug);
  if (!doc) throw ApiError.notFound("Activity not found");
  if (countView) await activityRepository.incrementViews(doc._id);
  return activityToView(doc);
}

async function getDocBySlug(slug) {
  const doc = await activityRepository.findBySlug(slug);
  if (!doc) throw ApiError.notFound("Activity not found");
  return doc;
}

async function create(payload, ctx = {}) {
  if (!payload.title || !payload.title.trim()) throw ApiError.badRequest("Activity title is required");
  const slug = await activityRepository.generateUniqueSlug(payload.title);
  const description = payload.description
    ? (Array.isArray(payload.description) ? payload.description : [payload.description])
    : [];

  const doc = await activityRepository.create({
    title: payload.title.trim(),
    slug,
    category: payload.category || "Archive Gallery",
    status: payload.status || ACTIVITY_STATUS.UPCOMING,
    date: payload.date ? new Date(payload.date) : new Date(),
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    location: payload.location || "TBA",
    organizer: payload.organizer || "OSIS SMAVO",
    division: payload.division || "",
    summary: payload.summary || (description[0] ? description[0].slice(0, 140) : ""),
    description,
    cover: payload.cover || "",
    tags: payload.tags ? String(payload.tags).split(",").map((t) => t.trim()).filter(Boolean) : [],
    visibility: payload.visibility || VISIBILITY.PUBLIC,
    featured: payload.featured === "on" || payload.featured === true,
    pinned: payload.pinned === "on" || payload.pinned === true,
    committee: payload.committee || [],
    milestones: payload.milestones && payload.milestones.length
      ? payload.milestones
      : [{ title: "Planning Phase Initiated", date: payload.date || new Date().toISOString().slice(0, 10), done: true, current: true }],
    createdBy: ctx.userId || null,
  });

  await logService.record({
    type: LOG_TYPES.SUCCESS,
    action: LOG_ACTIONS.CREATE,
    title: "Activity created",
    detail: `"${doc.title}" created`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return activityToView(doc);
}

async function update(slug, payload, ctx = {}) {
  const doc = await getDocBySlug(slug);
  const fields = ["title", "category", "status", "location", "organizer", "division", "summary", "cover", "visibility"];
  fields.forEach((f) => {
    if (payload[f] !== undefined) doc[f] = payload[f];
  });
  if (payload.date) doc.date = new Date(payload.date);
  if (payload.endDate) doc.endDate = new Date(payload.endDate);
  if (payload.description !== undefined) {
    doc.description = Array.isArray(payload.description) ? payload.description : [payload.description];
  }
  if (payload.tags !== undefined) {
    doc.tags = String(payload.tags).split(",").map((t) => t.trim()).filter(Boolean);
  }
  if (payload.featured !== undefined) doc.featured = payload.featured === "on" || payload.featured === true;
  if (payload.pinned !== undefined) doc.pinned = payload.pinned === "on" || payload.pinned === true;
  doc.updatedBy = ctx.userId || null;
  await doc.save();

  await logService.record({
    type: LOG_TYPES.INFO,
    action: LOG_ACTIONS.UPDATE,
    title: "Activity updated",
    detail: `"${doc.title}" updated`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return activityToView(doc);
}

async function remove(slug, ctx = {}) {
  const doc = await getDocBySlug(slug);

  // Best-effort cleanup of associated Drive assets.
  const [galleries, documents] = await Promise.all([
    galleryRepository.byActivity(doc._id),
    documentRepository.byActivity(doc._id),
  ]);
  await Promise.allSettled([
    ...galleries.map((g) => driveService.deleteFile(g.driveId)),
    ...documents.map((d) => driveService.deleteFile(d.driveId)),
  ]);
  await Promise.all([
    galleryRepository.model.deleteMany({ activity: doc._id }),
    documentRepository.model.deleteMany({ activity: doc._id }),
  ]);
  await activityRepository.deleteById(doc._id);

  await logService.record({
    type: LOG_TYPES.WARNING,
    action: LOG_ACTIONS.DELETE,
    title: "Activity deleted",
    detail: `"${doc.title}" and its assets were removed`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return { id: slug };
}

async function duplicate(slug, ctx = {}) {
  const source = await getDocBySlug(slug);
  const obj = source.toObject();
  delete obj._id;
  delete obj.createdAt;
  delete obj.updatedAt;
  obj.title = `${obj.title} (Copy)`;
  obj.slug = await activityRepository.generateUniqueSlug(obj.title);
  obj.visibility = VISIBILITY.DRAFT;
  obj.views = 0;
  obj.createdBy = ctx.userId || null;
  const doc = await activityRepository.create(obj);
  await logService.record({
    type: LOG_TYPES.INFO,
    action: LOG_ACTIONS.CREATE,
    title: "Activity duplicated",
    detail: `"${source.title}" duplicated as draft`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return activityToView(doc);
}

module.exports = { listPublic, listAdmin, getBySlug, getDocBySlug, create, update, remove, duplicate };
