//==============================================================//
//  SERVICE — Documents (linked to an activity)                //
//  uploadForActivity: server uploads the bytes.                //
//  attachUploaded:    file is already on Drive (direct upload).//
//==============================================================//
const documentRepository = require("../repositories/documentRepository");
const activityRepository = require("../repositories/activityRepository");
const driveService = require("./driveService");
const logService = require("./logService");
const ApiError = require("../core/ApiError");
const { formatBytes, extToType } = require("../helpers/bytes");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

async function ensureActivityFolder(activity) {
  if (!activity.driveFolderId) {
    activity.driveFolderId = await driveService.ensureFolder(`ODOC - ${activity.title}`);
  }
  return activity.driveFolderId;
}

async function uploadForActivity(slug, files, ctx = {}) {
  if (!files || !files.length) throw ApiError.badRequest("No files provided");
  const activity = await activityRepository.findBySlug(slug);
  if (!activity) throw ApiError.notFound("Activity not found");
  await ensureActivityFolder(activity);

  const created = [];
  for (const file of files) {
    const uploaded = await driveService.uploadBuffer({
      buffer: file.buffer,
      mimeType: file.mimetype,
      name: file.originalname,
      folderId: activity.driveFolderId,
    });
    const sizeLabel = formatBytes(uploaded.bytes);
    const type = extToType(file.originalname || file.mimetype);
    const doc = await documentRepository.create({
      activity: activity._id,
      name: file.originalname,
      driveId: uploaded.id,
      url: uploaded.url,
      mime: file.mimetype,
      type,
      bytes: uploaded.bytes,
      size: sizeLabel,
      uploadedBy: ctx.userId || null,
    });
    activity.documents.push({ name: file.originalname, size: sizeLabel, type, driveId: uploaded.id, url: uploaded.url });
    created.push(doc);
  }
  await activity.save();

  await logService.record({
    type: LOG_TYPES.SUCCESS,
    action: LOG_ACTIONS.UPLOAD,
    title: "Document upload",
    detail: `${created.length} document(s) added to "${activity.title}"`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return created;
}

// Attach a document the browser already uploaded straight to Drive.
async function attachUploaded(slug, driveId, ctx = {}) {
  const activity = await activityRepository.findBySlug(slug);
  if (!activity) throw ApiError.notFound("Activity not found");
  const uploaded = await driveService.finalizeFile(driveId);
  const sizeLabel = formatBytes(uploaded.bytes);
  const type = extToType(uploaded.name || uploaded.mimeType);
  const doc = await documentRepository.create({
    activity: activity._id,
    name: uploaded.name,
    driveId: uploaded.id,
    url: uploaded.url,
    mime: uploaded.mimeType,
    type,
    bytes: uploaded.bytes,
    size: sizeLabel,
    uploadedBy: ctx.userId || null,
  });
  activity.documents.push({ name: uploaded.name, size: sizeLabel, type, driveId: uploaded.id, url: uploaded.url });
  await activity.save();
  await logService.record({
    type: LOG_TYPES.SUCCESS,
    action: LOG_ACTIONS.UPLOAD,
    title: "Document upload",
    detail: `1 document added to "${activity.title}"`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return doc;
}

async function registerDownload(id) {
  const doc = await documentRepository.incrementDownloads(id);
  if (!doc) throw ApiError.notFound("Document not found");
  return doc;
}

module.exports = { uploadForActivity, attachUploaded, registerDownload };
