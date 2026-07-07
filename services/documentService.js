/**
 * Document uploads -> Google Drive, linked to an activity.
 */
const documentRepository = require("../repositories/documentRepository");
const activityRepository = require("../repositories/activityRepository");
const driveService = require("./driveService");
const logService = require("./logService");
const ApiError = require("../core/ApiError");
const { formatBytes, extToType } = require("../helpers/bytes");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

async function uploadForActivity(slug, files, ctx = {}) {
  if (!files || !files.length) throw ApiError.badRequest("No files provided");
  const activity = await activityRepository.findBySlug(slug);
  if (!activity) throw ApiError.notFound("Activity not found");

  if (!activity.driveFolderId) {
    activity.driveFolderId = await driveService.ensureFolder(`ODOC - ${activity.title}`);
  }

  const created = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const uploaded = await driveService.uploadBuffer({
      buffer: file.buffer,
      mimeType: file.mimetype,
      name: file.originalname,
      folderId: activity.driveFolderId,
    });
    const sizeLabel = formatBytes(uploaded.bytes);
    const type = extToType(file.originalname || file.mimetype);
    // eslint-disable-next-line no-await-in-loop
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

async function registerDownload(id) {
  const doc = await documentRepository.incrementDownloads(id);
  if (!doc) throw ApiError.notFound("Document not found");
  return doc;
}

module.exports = { uploadForActivity, registerDownload };
