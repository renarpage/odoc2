/**
 * Branding / customization settings (singleton, key="branding").
 */
const settingRepository = require("../repositories/settingRepository");
const logService = require("./logService");
const { brandingToView, DEFAULT_BRANDING } = require("../helpers/serializers");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

async function get() {
  const data = await settingRepository.getData("branding", DEFAULT_BRANDING);
  return brandingToView(data);
}

async function update(patch, ctx = {}) {
  const allowed = ["primaryColor", "secondaryColor", "tagline", "heroTitle", "logoUrl", "heroImageUrl"];
  const clean = {};
  allowed.forEach((k) => {
    if (patch[k] !== undefined) clean[k] = patch[k];
  });
  const saved = await settingRepository.merge("branding", clean);
  await logService.record({
    type: LOG_TYPES.INFO,
    action: LOG_ACTIONS.UPDATE,
    title: "Branding updated",
    detail: "Brand identity saved",
    user: ctx.userId,
    userEmail: ctx.userEmail,
    ip: ctx.ip,
  });
  return brandingToView(saved.data);
}

module.exports = { get, update };
