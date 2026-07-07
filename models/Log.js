const mongoose = require("mongoose");
const { LOG_TYPES } = require("../constants");

/**
 * Audit trail. Every important operation writes a log entry.
 */
const logSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(LOG_TYPES), default: LOG_TYPES.INFO, index: true },
    action: { type: String, required: true }, // e.g. "activity.create"
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String },
    ip: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

logSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Log", logSchema);
