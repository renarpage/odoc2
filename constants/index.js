/**
 * Shared enums and constants. Single source of truth for magic strings.
 */
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

const ALLOWED_UPLOAD_MIME = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);

module.exports = {
  ROLES,
  ROLE_LABELS,
  ACTIVITY_STATUS,
  VISIBILITY,
  LOG_TYPES,
  LOG_ACTIONS,
  COOKIES,
  ALLOWED_UPLOAD_MIME,
};
