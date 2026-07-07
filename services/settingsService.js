/**
 * System settings (singleton, key="system"). Coerces HTML form values.
 */
const settingRepository = require("../repositories/settingRepository");
const logService = require("./logService");
const { settingsToView, DEFAULT_SETTINGS } = require("../helpers/serializers");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

const BOOL_FIELDS = ["maintenanceMode", "emailAlerts", "systemLogsNotif", "errorReporting", "twoFactorAuth", "gdriveConnected"];
const NUM_FIELDS = ["sessionTimeout", "smtpPort", "storageCapacityGB"];

function coerce(patch) {
  const out = { ...patch };
  BOOL_FIELDS.forEach((f) => {
    if (f in out) out[f] = out[f] === true || out[f] === "on" || out[f] === "true";
  });
  NUM_FIELDS.forEach((f) => {
    if (f in out && out[f] !== "") out[f] = Number(out[f]);
  });
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

module.exports = { get, update };
