/**
 * Gallery image uploads -> Google Drive, linked to an activity.
 */
const galleryRepository = require("../repositories/galleryRepository");
const activityRepository = require("../repositories/activityRepository");
const driveService = require("./driveService");
const logService = require("./logService");
const ApiError = require("../core/ApiError");
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
    // eslint-disable-next-line no-await-in-loop
    const doc = await galleryRepository.create({
      activity: activity._id,
      driveId: uploaded.id,
      url: uploaded.url,
      thumbnailUrl: uploaded.thumbnailLink,
      mime: file.mimetype,
      bytes: uploaded.bytes,
      originalName: file.originalname,
      uploadedBy: ctx.userId || null,
    });
    activity.gallery.push(uploaded.url);
    created.push(doc);
  }
  await activity.save();

  await logService.record({
    type: LOG_TYPES.SUCCESS,
    action: LOG_ACTIONS.UPLOAD,
    title: "Gallery upload",
    detail: `${created.length} image(s) added to "${activity.title}"`,
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return created;
}

async function remove(id, ctx = {}) {
  const doc = await galleryRepository.findById(id);
  if (!doc) throw ApiError.notFound("Image not found");
  await driveService.deleteFile(doc.driveId);
  if (doc.activity) {
    await activityRepository.model.updateOne({ _id: doc.activity }, { $pull: { gallery: doc.url } });
  }
  await galleryRepository.deleteById(id);
  await logService.record({
    type: LOG_TYPES.WARNING,
    action: LOG_ACTIONS.DELETE,
    title: "Gallery image removed",
    detail: doc.originalName,
    user: ctx.userId,
    ip: ctx.ip,
  });
  return { id };
}

module.exports = { uploadForActivity, remove };
