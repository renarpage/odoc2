/**
 * Activity domain logic: public listing/search, admin CRUD, duplicate, status,
 * committee/milestones parsing, and cover upload.
 */
const activityRepository = require("../repositories/activityRepository");
const galleryRepository = require("../repositories/galleryRepository");
const documentRepository = require("../repositories/documentRepository");
const driveService = require("./driveService");
const logService = require("./logService");
const ApiError = require("../core/ApiError");
const { activityToView } = require("../helpers/serializers");
const { formatBytes } = require("../helpers/bytes");
const { parsePagination, buildMeta } = require("../helpers/pagination");
const { ACTIVITY_STATUS, VISIBILITY, LOG_TYPES, LOG_ACTIONS } = require("../constants");

const STATUS_BY_FILTER = {
  ongoing: ACTIVITY_STATUS.ONGOING,
  upcoming: ACTIVITY_STATUS.UPCOMING,
  completed: ACTIVITY_STATUS.COMPLETED,
};

function mimeToLabel(mime) {
  const m = String(mime || "").toLowerCase();
  if (m.includes("png")) return "PNG";
  if (m.includes("webp")) return "WEBP";
  if (m.includes("gif")) return "GIF";
  if (m.includes("mp4")) return "MP4";
  if (m.includes("webm")) return "WEBM";
  if (m.includes("jpeg") || m.includes("jpg")) return "JPG";
  if (m.startsWith("video/")) return "VIDEO";
  return "IMAGE";
}

function toArray(v) {
  if (v === undefined || v === null || v === "") return [];
  return Array.isArray(v) ? v : [v];
}

function parseCommittee(payload) {
  const names = toArray(payload.committeeName);
  const roles = toArray(payload.committeeRole);
  const out = [];
  names.forEach((name, i) => {
    const n = String(name || "").trim();
    if (n) out.push({ name: n, role: String(roles[i] || "Member").trim() || "Member" });
  });
  return out;
}

function parseMilestones(payload) {
  const titles = toArray(payload.milestoneTitle);
  const dates = toArray(payload.milestoneDate);
  const currentIndex = payload.milestoneCurrent !== undefined ? parseInt(payload.milestoneCurrent, 10) : -1;
  const out = [];
  titles.forEach((title, i) => {
    const t = String(title || "").trim();
    if (t) out.push({ title: t, date: String(dates[i] || "").trim(), done: true, current: i === currentIndex });
  });
  if (out.length && !out.some((m) => m.current)) out[out.length - 1].current = true;
  return out;
}

function parseDescription(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseTags(value) {
  return String(value || "").split(",").map((t) => t.trim()).filter(Boolean);
}

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

// Merge real per-file metadata (name/size/type) from the Gallery collection
// into the view's galleryItems, matched by Drive file id.
async function enrichGallery(view, activityDocId) {
  if (!view.galleryItems || !view.galleryItems.length) return view;
  const gdocs = await galleryRepository.byActivity(activityDocId);
  const byId = {};
  gdocs.forEach((g) => { if (g.driveId) byId[g.driveId] = g; });
  view.galleryItems = view.galleryItems.map((it, i) => {
    const g = it.id ? byId[it.id] : null;
    const bytes = g && g.bytes ? g.bytes : 0;
    return {
      ...it,
      name: (g && g.originalName) ? g.originalName : ("Media " + (i + 1)),
      typeLabel: mimeToLabel(g && g.mime),
      isVideo: !!(g && String(g.mime || "").startsWith("video/")),
      bytes,
      sizeLabel: bytes ? formatBytes(bytes) : "",
    };
  });
  return view;
}

async function getBySlug(slug, { countView = false } = {}) {
  const doc = await activityRepository.findBySlug(slug);
  if (!doc) throw ApiError.notFound("Activity not found");
  if (countView) await activityRepository.incrementViews(doc._id);
  const view = activityToView(doc);
  await enrichGallery(view, doc._id);
  return view;
}

async function getDocBySlug(slug) {
  const doc = await activityRepository.findBySlug(slug);
  if (!doc) throw ApiError.notFound("Activity not found");
  return doc;
}

async function create(payload, ctx = {}) {
  if (!payload.title || !payload.title.trim()) throw ApiError.badRequest("Activity title is required");
  const slug = await activityRepository.generateUniqueSlug(payload.title);
  const description = parseDescription(payload.description);
  const isDraft = payload.action === "draft";
  const visibility = payload.visibility
    ? payload.visibility
    : (isDraft ? VISIBILITY.DRAFT : VISIBILITY.PUBLIC);

  const doc = await activityRepository.create({
    title: payload.title.trim(),
    slug,
    category: payload.category || "Archive Gallery",
    status: Object.values(ACTIVITY_STATUS).includes(payload.status) ? payload.status : ACTIVITY_STATUS.UPCOMING,
    date: payload.date ? new Date(payload.date) : new Date(),
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    location: payload.location ? payload.location.trim() : "TBA",
    organizer: payload.organizer ? payload.organizer.trim() : "OSIS SMAVO",
    division: payload.division ? payload.division.trim() : "",
    summary: payload.summary ? payload.summary.trim() : (description[0] ? description[0].slice(0, 160) : ""),
    description,
    cover: payload.cover || "",
    tags: parseTags(payload.tags),
    visibility,
    featured: payload.featured === "on" || payload.featured === true,
    pinned: payload.pinned === "on" || payload.pinned === true,
    committee: parseCommittee(payload),
    milestones: parseMilestones(payload).length
      ? parseMilestones(payload)
      : [{ title: "Planning Phase Initiated", date: payload.date || new Date().toISOString().slice(0, 10), done: true, current: true }],
    createdBy: ctx.userId || null,
  });

  await logService.record({
    type: LOG_TYPES.SUCCESS,
    action: LOG_ACTIONS.CREATE,
    title: "Activity created",
    detail: `"${doc.title}" ${isDraft ? "saved as draft" : "published"}`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return activityToView(doc);
}

async function setCover(slug, file, ctx = {}) {
  if (!file) return null;
  const activity = await getDocBySlug(slug);
  if (!activity.driveFolderId) {
    activity.driveFolderId = await driveService.ensureFolder(`ODOC - ${activity.title}`);
  }
  const uploaded = await driveService.uploadBuffer({
    buffer: file.buffer,
    mimeType: file.mimetype,
    name: file.originalname,
    folderId: activity.driveFolderId,
  });
  activity.cover = uploaded.url;
  activity.coverDriveId = uploaded.id;
  await activity.save();
  await logService.record({
    type: LOG_TYPES.INFO,
    action: LOG_ACTIONS.UPLOAD,
    title: "Cover image set",
    detail: `Cover updated for "${activity.title}"`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return activityToView(activity);
}

async function update(slug, payload, ctx = {}) {
  const doc = await getDocBySlug(slug);
  const scalar = ["title", "category", "location", "organizer", "division", "summary"];
  scalar.forEach((f) => {
    if (payload[f] !== undefined && payload[f] !== "") doc[f] = String(payload[f]).trim();
  });
  if (payload.status && Object.values(ACTIVITY_STATUS).includes(payload.status)) doc.status = payload.status;
  if (payload.action === "draft") doc.visibility = VISIBILITY.DRAFT;
  else if (payload.action === "publish") doc.visibility = VISIBILITY.PUBLIC;
  else if (payload.visibility && Object.values(VISIBILITY).includes(payload.visibility)) doc.visibility = payload.visibility;
  if (payload.date) doc.date = new Date(payload.date);
  if (payload.endDate) doc.endDate = new Date(payload.endDate);
  if (payload.description !== undefined) doc.description = parseDescription(payload.description);
  if (payload.tags !== undefined) doc.tags = parseTags(payload.tags);
  if ("committeeName" in payload) doc.committee = parseCommittee(payload);
  if ("milestoneTitle" in payload) {
    const ms = parseMilestones(payload);
    if (ms.length) doc.milestones = ms;
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
  const [galleries, documents] = await Promise.all([
    galleryRepository.byActivity(doc._id),
    documentRepository.byActivity(doc._id),
  ]);
  await Promise.allSettled([
    ...galleries.map((g) => driveService.deleteFile(g.driveId)),
    ...documents.map((d) => driveService.deleteFile(d.driveId)),
    doc.coverDriveId ? driveService.deleteFile(doc.coverDriveId) : Promise.resolve(),
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
  delete obj.id;
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

module.exports = { listPublic, listAdmin, getBySlug, getDocBySlug, create, setCover, update, remove, duplicate };
