/**
 * Google Drive storage service. All binary content (covers, gallery, docs,
 * backups) lives in Drive so the Node server never stores large files on disk.
 */
const { Readable } = require("stream");
const { getDrive } = require("../config/googleDrive");
const { env } = require("../config/env");
const logger = require("../utils/logger");
const ApiError = require("../utils/ApiError");

function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/** Create a folder (optionally nested under a parent). Returns folder id. */
async function createFolder(name, parentId = env.drive.rootFolderId) {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  logger.info(`Drive folder created: ${name} (${res.data.id})`);
  return res.data.id;
}

/** Make a file readable by anyone with the link. */
async function makePublic(fileId) {
  const drive = getDrive();
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });
}

function viewLink(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function downloadLink(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Upload a single in-memory file to Drive and return its metadata + links.
 * @param {{buffer:Buffer, originalname:string, mimetype:string, size:number}} file
 */
async function uploadFile(file, { folderId = env.drive.rootFolderId, makeReadable = true } = {}) {
  if (!file || !file.buffer) throw ApiError.badRequest("No file provided for upload");
  const drive = getDrive();
  try {
    const res = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: folderId ? [folderId] : undefined,
      },
      media: { mimeType: file.mimetype, body: bufferToStream(file.buffer) },
      fields: "id, name, size, mimeType, thumbnailLink",
    });
    if (makeReadable) await makePublic(res.data.id);
    logger.info(`Drive upload ok: ${file.originalname} (${res.data.id})`);
    return {
      driveId: res.data.id,
      name: res.data.name,
      mimeType: res.data.mimeType || file.mimetype,
      sizeBytes: Number(res.data.size) || file.size || 0,
      url: viewLink(res.data.id),
      downloadUrl: downloadLink(res.data.id),
      thumbnailUrl: res.data.thumbnailLink || null,
    };
  } catch (err) {
    logger.error(`Drive upload failed for ${file.originalname}: ${err.message}`);
    throw ApiError.internal("Failed to upload file to storage");
  }
}

async function deleteFile(fileId) {
  if (!fileId) return;
  const drive = getDrive();
  try {
    await drive.files.delete({ fileId });
    logger.info(`Drive file deleted: ${fileId}`);
  } catch (err) {
    // Log but do not throw: a missing remote file should not block DB cleanup.
    logger.warn(`Drive delete failed for ${fileId}: ${err.message}`);
  }
}

module.exports = {
  createFolder,
  uploadFile,
  deleteFile,
  makePublic,
  viewLink,
  downloadLink,
};
