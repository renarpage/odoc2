//==============================================================//
//  SERVICE — Google Drive storage                             //
//  Two upload paths, same result shape + sharing:              //
//    uploadBuffer()          server streams bytes to Drive     //
//    createResumableSession() browser uploads straight to      //
//                            Drive (bypasses serverless body    //
//                            limits); finalizeFile() then shares//
//                            + reads metadata.                  //
//==============================================================//
const { Readable } = require("stream");
const { getDrive, getAuthClient } = require("../config/drive");
const env = require("../config/env");
const ApiError = require("../core/ApiError");
const logger = require("../config/logger");

async function requireDrive() {
  const drive = await getDrive();
  if (!drive) {
    throw ApiError.internal("Google Drive is not connected. Connect an account from Admin > Storage.");
  }
  return drive;
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Public view URL for a Drive file: lh3 host for images, webView otherwise.
function buildViewUrl(fileId, mimeType, webViewLink) {
  const isImage = String(mimeType || "").startsWith("image/");
  return isImage
    ? `https://lh3.googleusercontent.com/d/${fileId}=w1600`
    : webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
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

// Share "anyone with link" + return the normalized file descriptor.
// Used by both the server-side and direct-upload paths.
async function finalizeFile(fileId) {
  const drive = await requireDrive();
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });
  const res = await drive.files.get({
    fileId,
    fields: "id,name,size,mimeType,webViewLink,thumbnailLink",
  });
  const file = res.data;
  return {
    id: file.id,
    name: file.name,
    bytes: Number(file.size) || 0,
    mimeType: file.mimeType,
    url: buildViewUrl(file.id, file.mimeType, file.webViewLink),
    downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
    webViewLink: file.webViewLink || null,
    thumbnailLink: file.thumbnailLink || null,
  };
}

async function uploadBuffer({ buffer, mimeType, name, folderId }) {
  const drive = await requireDrive();
  const parents = [];
  if (folderId) parents.push(folderId);
  else if (env.GOOGLE_DRIVE_ROOT_FOLDER_ID) parents.push(env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

  const created = await drive.files.create({
    requestBody: { name, parents: parents.length ? parents : undefined },
    media: { mimeType, body: bufferToStream(buffer) },
    fields: "id",
  });

  const finalized = await finalizeFile(created.data.id);
  logger.info("Uploaded file to Google Drive", { id: finalized.id, name: finalized.name, mimeType });
  // Preserve the byte count from the source buffer when Drive omits size.
  if (!finalized.bytes && buffer) finalized.bytes = buffer.length;
  return finalized;
}

// Start a resumable upload session and return its upload URL. The browser
// PUTs the file bytes directly to this URL, so they never touch our server.
//
// `origin` MUST be the browser origin that will perform the PUT. Google only
// enables CORS on the returned session URL when the initiating request carries
// a matching Origin header; without it the browser PUT is blocked (no
// Access-Control-Allow-Origin on the response).
async function createResumableSession({ name, mimeType, folderId, origin }) {
  const client = await getAuthClient();
  if (!client) throw ApiError.internal("Google Drive is not connected.");
  const { token } = await client.getAccessToken();
  if (!token) throw ApiError.internal("Could not obtain a Drive access token.");

  const parents = [];
  if (folderId) parents.push(folderId);
  else if (env.GOOGLE_DRIVE_ROOT_FOLDER_ID) parents.push(env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Type": mimeType || "application/octet-stream",
  };
  // Declaring the Origin makes Google return a CORS-enabled session URL.
  if (origin) headers.Origin = origin;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id", {
    method: "POST",
    headers,
    body: JSON.stringify({ name, mimeType, parents: parents.length ? parents : undefined }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logger.error("Failed to create resumable session", { status: res.status, detail });
    throw ApiError.internal("Failed to start the upload session.");
  }
  const location = res.headers.get("location");
  if (!location) throw ApiError.internal("Drive did not return an upload session URL.");
  return location;
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

// File metadata (name/mime/size) for a single Drive file.
async function getMeta(fileId) {
  const drive = await requireDrive();
  const res = await drive.files.get({ fileId, fields: "id,name,mimeType,size" });
  return res.data;
}

// Readable stream of a Drive file's bytes (for zipping / proxied downloads).
async function downloadStream(fileId) {
  const drive = await requireDrive();
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
  return res.data;
}

module.exports = {
  ensureFolder,
  uploadBuffer,
  finalizeFile,
  createResumableSession,
  deleteFile,
  getQuota,
  getMeta,
  downloadStream,
};
