//==============================================================//
//  HELPER — Serializers                                       //
//  The plug-and-play seam: map Mongo documents into the exact  //
//  object shapes the EJS views expect.                         //
//==============================================================//
const { ROLE_LABELS } = require("../constants");
const { toDriveImage, toDriveDownload, toDrivePreview, extractDriveId } = require("./driveUrl");

function activityToView(doc) {
  if (!doc) return null;
  const a = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const gallery = (a.gallery || []).map((g) => toDriveImage(g));
  return {
    id: a.slug,
    title: a.title,
    category: a.category,
    status: a.status,
    date: a.date,
    endDate: a.endDate || null,
    location: a.location,
    organizer: a.organizer,
    division: a.division,
    cover: toDriveImage(a.cover, 1200),
    summary: a.summary,
    description: Array.isArray(a.description) ? a.description : (a.description ? [a.description] : []),
    gallery,
    galleryItems: (a.gallery || []).map((g, i) => ({
      id: extractDriveId(g),
      thumb: toDriveImage(g, 500),
      view: toDriveImage(g, 2000),
      preview: toDrivePreview(g),
      download: toDriveDownload(g),
      index: i,
      // Enriched later (getBySlug) from the Gallery collection when available.
      name: "Media " + (i + 1),
      typeLabel: "IMAGE",
      isVideo: false,
      sizeLabel: "",
      bytes: 0,
    })),
    documents: (a.documents || []).map((d) => ({
      name: d.name,
      size: d.size,
      type: d.type,
      url: d.url || null,
      download: toDriveDownload(d.url || d.driveId),
    })),
    committee: (a.committee || []).map((c) => ({ name: c.name, role: c.role })),
    milestones: (a.milestones || []).map((m) => ({ title: m.title, date: m.date, done: !!m.done, current: !!m.current })),
    tags: a.tags || [],
    featured: !!a.featured,
    pinned: !!a.pinned,
    visibility: a.visibility,
    attendeeAvatarCount: a.attendeeAvatarCount || 0,
    views: a.views || 0,
    createdAt: a.createdAt,
  };
}

function userToView(doc) {
  if (!doc) return null;
  const u = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(u._id || u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    roleLabel: ROLE_LABELS[u.role] || u.role,
    active: u.active !== false,
    mustChangePassword: !!u.mustChangePassword,
    lastLoginAt: u.lastLoginAt || null,
    avatarColor: u.avatarColor || "#3155E7",
    createdAt: u.createdAt,
  };
}

function logToView(doc) {
  if (!doc) return null;
  const l = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return { type: l.type, title: l.title, detail: l.detail, createdAt: l.createdAt };
}

const DEFAULT_BRANDING = {
  primaryColor: "#3155E7",
  secondaryColor: "#4E5A98",
  tagline: "One Door One Click",
  heroTitle: "Secure, accessible, and intelligent digital archiving at your fingertips.",
  logoUrl: null,
  heroImageUrl: null,
};

function brandingToView(data) {
  return { ...DEFAULT_BRANDING, ...(data || {}) };
}

const DEFAULT_SETTINGS = {
  platformName: "ODOC Digital Archive",
  maintenanceMode: false,
  maintenanceMessage: "",
  timezone: "(GMT+07:00) Western Indonesia Time",
  language: "id",
  // Notifications
  emailAlerts: true,
  systemLogsNotif: true,
  errorReporting: false,
  // API & Integrations
  gdriveConnected: false,
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  systemEmail: "no-reply@odoc.archive",
  webhookUrl: "",
  // SEO
  metaDescription: "",
  metaKeywords: "",
  faviconUrl: "",
  ogImageUrl: "",
  // Content
  itemsPerPage: 9,
  maxFilesPerRequest: 200,
  maxUploadMB: 50,
  allowVideoUpload: true,
  // Backup
  autoBackup: false,
  backupFrequency: "weekly",
  dataRetentionDays: 365,
  // Storage
  storageCapacityGB: 15,
};

function settingsToView(data) {
  return { ...DEFAULT_SETTINGS, ...(data || {}) };
}

module.exports = {
  activityToView,
  userToView,
  logToView,
  brandingToView,
  settingsToView,
  DEFAULT_BRANDING,
  DEFAULT_SETTINGS,
};
