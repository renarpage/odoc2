//==============================================================//
//  CONTROLLER — Direct browser-to-Drive uploads                //
//    init:     open a resumable session for one file            //
//    complete: share + persist metadata once the browser has    //
//              finished PUT-ing the bytes to Drive.             //
//==============================================================//
const asyncHandler = require("../core/asyncHandler");
const activityRepository = require("../repositories/activityRepository");
const driveService = require("../services/driveService");
const galleryService = require("../services/galleryService");
const documentService = require("../services/documentService");
const logService = require("../services/logService");
const ApiError = require("../core/ApiError");
const env = require("../config/env");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");
const { ok } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

// POST /api/admin/activities/:slug/uploads/init
// body: { kind: "cover"|"gallery"|"document", name, mimeType }
const initUpload = asyncHandler(async (req, res) => {
  const { name, mimeType } = req.body || {};
  if (!name || !mimeType) throw ApiError.badRequest("name and mimeType are required");

  const activity = await activityRepository.findBySlug(req.params.slug);
  if (!activity) throw ApiError.notFound("Activity not found");

  if (!activity.driveFolderId) {
    activity.driveFolderId = await driveService.ensureFolder(`ODOC - ${activity.title}`);
    await activity.save();
  }

  // Route the file into its typed subfolder (Photos/Videos/Audio/Documents)
  // inside the activity folder, based on its MIME type.
  const targetFolderId = await driveService.ensureCategoryFolder(activity.driveFolderId, mimeType);

  // The browser origin that will PUT the bytes must be declared so Google
  // returns a CORS-enabled session URL.
  const origin = req.get("origin") || env.APP_URL;

  const sessionUrl = await driveService.createResumableSession({
    name,
    mimeType,
    folderId: targetFolderId,
    origin,
  });
  ok(res, { sessionUrl });
});

// POST /api/admin/activities/:slug/uploads/complete
// body: { kind, driveId }
const completeUpload = asyncHandler(async (req, res) => {
  const { kind, driveId } = req.body || {};
  if (!driveId) throw ApiError.badRequest("driveId is required");
  const ctx = ctxOf(req);

  if (kind === "gallery") {
    return ok(res, await galleryService.attachUploaded(req.params.slug, driveId, ctx));
  }
  if (kind === "document") {
    return ok(res, await documentService.attachUploaded(req.params.slug, driveId, ctx));
  }
  if (kind === "cover") {
    const activity = await activityRepository.findBySlug(req.params.slug);
    if (!activity) throw ApiError.notFound("Activity not found");
    const uploaded = await driveService.finalizeFile(driveId);
    activity.cover = uploaded.url;
    await activity.save();
    await logService.record({
      type: LOG_TYPES.SUCCESS,
      action: LOG_ACTIONS.UPLOAD,
      title: "Cover updated",
      detail: `Cover set for "${activity.title}"`,
      user: ctx.userId,
      userEmail: ctx.userEmail,
      ip: ctx.ip,
    });
    return ok(res, { cover: uploaded.url });
  }
  throw ApiError.badRequest("Unknown upload kind");
});

module.exports = { initUpload, completeUpload };
