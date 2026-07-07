const mongoose = require("mongoose");

/**
 * Singleton settings + branding document. We keep a single row keyed by
 * `key: "global"` so reads are a single indexed lookup.
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    // Branding
    branding: {
      primaryColor: { type: String, default: "#3155E7" },
      secondaryColor: { type: String, default: "#4E5A98" },
      tagline: { type: String, default: "One Door One Click" },
      heroTitle: {
        type: String,
        default: "Secure, accessible, and intelligent digital archiving at your fingertips.",
      },
      logoUrl: { type: String, default: "" },
      heroImageUrl: { type: String, default: "" },
    },
    // System settings
    platformName: { type: String, default: "ODOC Digital Archive" },
    maintenanceMode: { type: Boolean, default: false },
    timezone: { type: String, default: "(GMT+07:00) Western Indonesia Time" },
    emailAlerts: { type: Boolean, default: true },
    systemLogsNotif: { type: Boolean, default: true },
    errorReporting: { type: Boolean, default: false },
    twoFactorAuth: { type: Boolean, default: true },
    passwordPolicy: { type: String, default: "Strong (Alpha-numeric + Special)" },
    sessionTimeout: { type: Number, default: 30 },
    gdriveConnected: { type: Boolean, default: true },
    smtpHost: { type: String, default: "smtp.gmail.com" },
    smtpPort: { type: Number, default: 587 },
    systemEmail: { type: String, default: "no-reply@odoc.archive" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
