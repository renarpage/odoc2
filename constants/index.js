//==============================================================//
//  CONSTANTS — Shared enums (single source of truth)           //
//==============================================================//

const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  STANDARD_ADMIN: "standard_admin",
});

const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.STANDARD_ADMIN]: "Standard Admin",
});

const ACTIVITY_STATUS = Object.freeze({
  UPCOMING: "Upcoming",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
});

const VISIBILITY = Object.freeze({
  PUBLIC: "public",
  DRAFT: "draft",
});

const LOG_TYPES = Object.freeze({
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  INFO: "info",
  USER: "user",
});

const LOG_ACTIONS = Object.freeze({
  LOGIN: "login",
  LOGOUT: "logout",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  UPLOAD: "upload",
  PERMISSION_DENIED: "permission_denied",
});

const COOKIES = Object.freeze({
  ACCESS: "odoc_access",
  REFRESH: "odoc_refresh",
  CSRF: "odoc_csrf",
  FLASH: "odoc_flash",
});

// Validate uploads primarily by EXTENSION; browsers report inconsistent MIME
// types (e.g. Windows Chrome sends "application/x-zip-compressed" for .zip).
// Keep both lists in sync with the client-side check in public/js/admin.js.
const ALLOWED_UPLOAD_EXT = Object.freeze([
  // images
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "heic", "heif",
  // video
  "mp4", "webm", "mov", "mkv", "avi",
  // documents
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "odt", "ods", "odp",
  // archives
  "zip", "rar", "7z",
]);

const ALLOWED_UPLOAD_MIME = Object.freeze([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml", "image/heic", "image/heif",
  "video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/x-msvideo",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv", "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  // zip + variants across browsers/OSes
  "application/zip", "application/x-zip-compressed", "application/x-zip", "multipart/x-zip",
  "application/x-rar-compressed", "application/vnd.rar", "application/x-7z-compressed",
  // generic fallback some browsers use
  "application/octet-stream",
]);

module.exports = {
  ROLES,
  ROLE_LABELS,
  ACTIVITY_STATUS,
  VISIBILITY,
  LOG_TYPES,
  LOG_ACTIONS,
  COOKIES,
  ALLOWED_UPLOAD_EXT,
  ALLOWED_UPLOAD_MIME,
};
