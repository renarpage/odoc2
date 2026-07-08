/**
 * Google Drive storage service. Streams uploads straight to Drive so file
 * bytes never persist on the app server. Works with either OAuth (personal
 * account) or a service account, whichever config/drive resolves.
 */
const { Readable } = require("stream");
const { getDrive } = require("../config/drive");
const env = require("../config/env");
const ApiError = require("../core/ApiError");
const logger = require("../config/logger");

async function requireDrive() {
  const drive = await getDrive();
  if (!drive) {
    throw ApiError.internal("Google Drive is not connected. Connect an account from Admin \u2192 Storage.");
  }
  return drive;
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function ensureFolder(name, parentId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
  const drive = await requireDrive();
  const safeName = String(name).replace(/'/g, "\\'");
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";
  const existing = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and trashed=false${parentClause}`,
    fields: "files(id,name)",
    spaces: "drive",
  });
  if (existing.data.files && existing.data.files.length) {
    return existing.data.files[0].id;
  }
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  return created.data.id;
}

async function uploadBuffer({ buffer, mimeType, name, folderId }) {
  const drive = await requireDrive();
  const parents = [];
  if (folderId) parents.push(folderId);
  else if (env.GOOGLE_DRIVE_ROOT_FOLDER_ID) parents.push(env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

  const created = await drive.files.create({
    requestBody: { name, parents: parents.length ? parents : undefined },
    media: { mimeType, body: bufferToStream(buffer) },
    fields: "id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink",
  });

  const file = created.data;
  await drive.permissions.create({
    fileId: file.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  const isImage = String(mimeType).startsWith("image/");
  const viewUrl = isImage
    ? `https://drive.google.com/uc?export=view&id=${file.id}`
    : (file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`);

  logger.info("Uploaded file to Google Drive", { id: file.id, name: file.name, mimeType });

  return {
    id: file.id,
    name: file.name,
    bytes: Number(file.size) || (buffer ? buffer.length : 0),
    mimeType,
    url: viewUrl,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
    webViewLink: file.webViewLink || null,
    thumbnailLink: file.thumbnailLink || null,
  };
}

async function deleteFile(fileId) {
  if (!fileId) return;
  const drive = await getDrive();
  if (!drive) return;
  try {
    await drive.files.delete({ fileId });
  } catch (err) {
    if (err.code !== 404) logger.error("Drive delete failed", { fileId, error: err.message });
  }
}

/**
 * Real storage quota from the connected Drive account. Returns null when Drive
 * is not connected so callers can fall back to a configured capacity.
 */
async function getQuota() {
  const drive = await getDrive();
  if (!drive) return null;
  const res = await drive.about.get({ fields: "storageQuota" });
  const q = res.data.storageQuota || {};
  return {
    limit: q.limit ? Number(q.limit) : 0,
    usage: q.usage ? Number(q.usage) : 0,
    usageInDrive: q.usageInDrive ? Number(q.usageInDrive) : 0,
  };
}

module.exports = { ensureFolder, uploadBuffer, deleteFile, getQuota };
