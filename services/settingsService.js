/**
 * System settings (singleton, key="system"). Coerces HTML form values.
 */
const settingRepository = require("../repositories/settingRepository");
const logService = require("./logService");
const { settingsToView, DEFAULT_SETTINGS } = require("../helpers/serializers");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");
const logger = require("../config/logger");

const BOOL_FIELDS = [
  "maintenanceMode", "emailAlerts", "systemLogsNotif", "errorReporting",
  "gdriveConnected", "allowVideoUpload", "autoBackup"
];
const NUM_FIELDS = [
  "smtpPort", "storageCapacityGB", "itemsPerPage",
  "maxFilesPerRequest", "maxUploadMB", "dataRetentionDays"
];

// A full settings form submit omits unchecked switches entirely, so an absent
// boolean means "off". Force every known bool to a real boolean based on
// presence; this fixes toggles that could never be turned back off.
function coerce(patch) {
  const out = { ...patch };
  BOOL_FIELDS.forEach((f) => {
    out[f] = f in patch ? (patch[f] === true || patch[f] === "on" || patch[f] === "true") : false;
  });
  NUM_FIELDS.forEach((f) => {
    if (f in out && out[f] !== "") out[f] = Number(out[f]);
  });
  delete out._csrf;
  return out;
}

async function get() {
  const data = await settingRepository.getData("system", DEFAULT_SETTINGS);
  return settingsToView(data);
}

async function update(patch, ctx = {}) {
  const saved = await settingRepository.merge("system", coerce(patch));
  await logService.record({
    type: LOG_TYPES.INFO,
    action: LOG_ACTIONS.UPDATE,
    title: "Settings updated",
    detail: "System settings saved",
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return settingsToView(saved.data);
}

/**
 * Test SMTP connection without saving.
 */
async function testSmtpConnection({ smtpHost, smtpPort, smtpUser, smtpPass, systemEmail }) {
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost || "smtp.gmail.com",
      port: parseInt(smtpPort) || 587,
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser || "",
        pass: smtpPass || "",
      },
      connectionTimeout: 10000,
    });
    await transporter.verify();
    return { success: true };
  } catch (err) {
    logger.warn("SMTP test failed", { error: err.message });
    return { success: false, message: err.message };
  }
}

module.exports = { get, update, testSmtpConnection };
