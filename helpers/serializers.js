/**
 * The plug-and-play seam: map Mongo documents into the EXACT object shapes the
 * existing EJS views already consume, so templates render identically.
 */
const { ROLE_LABELS } = require("../constants");
const { toDriveImage, toDriveDownload } = require("./driveUrl");

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
    cover: toDriveImage(a.cover),
    summary: a.summary,
    description: Array.isArray(a.description) ? a.description : (a.description ? [a.description] : []),
    gallery,
    galleryItems: (a.gallery || []).map((g, i) => ({
      thumb: toDriveImage(g, 800),
      view: toDriveImage(g, 2000),
      download: toDriveDownload(g),
      index: i,
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
  timezone: "(GMT+07:00) Western Indonesia Time",
  emailAlerts: true,
  systemLogsNotif: true,
  errorReporting: false,
  twoFactorAuth: true,
  passwordPolicy: "Strong (Alpha-numeric + Special)",
  sessionTimeout: 30,
  gdriveConnected: false,
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  systemEmail: "no-reply@odoc.archive",
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
