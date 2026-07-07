const settingRepository = require("../repositories/settingRepository");
const auditService = require("./auditService");
const { LOG_TYPES } = require("../constants");

const BOOL_FIELDS = [
  "maintenanceMode",
  "emailAlerts",
  "systemLogsNotif",
  "errorReporting",
  "twoFactorAuth",
  "gdriveConnected",
];

function coerce(body = {}) {
  const out = { ...body };
  BOOL_FIELDS.forEach((f) => {
    if (f in out) out[f] = out[f] === true || out[f] === "true" || out[f] === "on";
  });
  if ("sessionTimeout" in out) out.sessionTimeout = parseInt(out.sessionTimeout, 10) || 30;
  if ("smtpPort" in out) out.smtpPort = parseInt(out.smtpPort, 10) || 587;
  return out;
}

async function get() {
  return settingRepository.getGlobal();
}

async function updateSettings(body, actor) {
  const update = coerce(body);
  delete update.branding; // branding handled separately
  const doc = await settingRepository.update(update);
  await auditService.record({
    type: LOG_TYPES.INFO,
    action: "settings.update",
    title: "System settings updated",
    actor: actor && actor._id,
    actorEmail: actor && actor.email,
  });
  return doc;
}

async function updateBranding(body, actor) {
  const current = await settingRepository.getGlobal();
  const branding = {
    primaryColor: body.primaryColor || current.branding.primaryColor,
    secondaryColor: body.secondaryColor || current.branding.secondaryColor,
    tagline: body.tagline || current.branding.tagline,
    heroTitle: body.heroTitle || current.branding.heroTitle,
    logoUrl: body.logoUrl || current.branding.logoUrl,
    heroImageUrl: body.heroImageUrl || current.branding.heroImageUrl,
  };
  const doc = await settingRepository.update({ branding });
  await auditService.record({
    type: LOG_TYPES.INFO,
    action: "branding.update",
    title: "Brand identity updated",
    actor: actor && actor._id,
    actorEmail: actor && actor.email,
  });
  return doc;
}

module.exports = { get, updateSettings, updateBranding };
