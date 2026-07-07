/**
 * Application-wide constants. Single source of truth for enums so models,
 * validators, services and views stay in sync.
 */
const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  STANDARD_ADMIN: "standard_admin",
});

const ROLE_VALUES = Object.values(ROLES);

const ACTIVITY_STATUS = Object.freeze({
  UPCOMING: "Upcoming",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
});

const ACTIVITY_STATUS_VALUES = Object.values(ACTIVITY_STATUS);

const ACTIVITY_VISIBILITY = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
});

const LOG_TYPES = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  USER: "user",
  SUCCESS: "success",
});

const DOCUMENT_TYPES = Object.freeze(["pdf", "docx", "xlsx", "pptx", "zip"]);

const COLLECTIONS = Object.freeze({
  USERS: "users",
  ACTIVITIES: "activities",
  GALLERY: "gallery",
  DOCUMENTS: "documents",
  NOTIFICATIONS: "notifications",
  SETTINGS: "settings",
  VISITORS: "visitors",
  LOGS: "logs",
  BACKUPS: "backups",
});

const UPLOAD_LIMITS = Object.freeze({
  MAX_FILE_BYTES: 50 * 1024 * 1024, // 50MB per file (matches frontend copy)
  IMAGE_MIME: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  DOC_MIME: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
  ],
  VIDEO_MIME: ["video/mp4", "video/webm", "video/quicktime"],
});

module.exports = {
  ROLES,
  ROLE_VALUES,
  ACTIVITY_STATUS,
  ACTIVITY_STATUS_VALUES,
  ACTIVITY_VISIBILITY,
  LOG_TYPES,
  DOCUMENT_TYPES,
  COLLECTIONS,
  UPLOAD_LIMITS,
};
