/**
 * Public media download: bundles an activity's gallery files into a single ZIP
 * streamed straight from Google Drive (no temp files on disk).
 *
 *   GET /api/activities/:slug/media.zip            -> all gallery media
 *   GET /api/activities/:slug/media.zip?ids=a,b,c   -> only those Drive file ids
 */
const archiver = require("archiver");
const asyncHandler = require("../core/asyncHandler");
const ApiError = require("../core/ApiError");
const activityRepository = require("../repositories/activityRepository");
const driveService = require("../services/driveService");
const { extractDriveId } = require("../helpers/driveUrl");
const logger = require("../config/logger");

function safeName(name) {
  return String(name || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

function ensureExt(name, mime) {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) return name;
  return name + (EXT_BY_MIME[mime] || "");
}

const zipGallery = asyncHandler(async (req, res, next) => {
  const activity = await activityRepository.findBySlug(req.params.slug);
  if (!activity) throw ApiError.notFound("Activity not found");

  let ids = (activity.gallery || []).map(extractDriveId).filter(Boolean);
  if (req.query.ids) {
    const wanted = String(req.query.ids).split(",").map((s) => s.trim()).filter(Boolean);
    ids = ids.filter((id) => wanted.includes(id));
  }
  ids = [...new Set(ids)];
  if (!ids.length) throw ApiError.badRequest("No media available to download");

  const zipName = safeName(activity.slug) + "-media.zip";
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("warning", (e) => logger.warn("Zip warning", { error: e.message }));
  archive.on("error", (e) => {
    logger.error("Zip stream error", { error: e.message });
    if (!res.headersSent) next(e);
    else res.destroy(e);
  });
  // If the client disconnects mid-download, stop pulling from Drive.
  req.on("close", () => archive.destroy());
  archive.pipe(res);

  let index = 0;
  for (const id of ids) {
    index += 1;
    try {
      // eslint-disable-next-line no-await-in-loop
      const meta = await driveService.getMeta(id);
      // eslint-disable-next-line no-await-in-loop
      const stream = await driveService.downloadStream(id);
      const base = ensureExt(safeName(meta.name || "media-" + index), meta.mimeType);
      const entryName = String(index).padStart(2, "0") + "-" + base;
      archive.append(stream, { name: entryName });
    } catch (err) {
      logger.warn("Skipping file in zip", { id, error: err.message });
    }
  }
  await archive.finalize();
});

module.exports = { zipGallery };
