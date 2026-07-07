const mongoose = require("mongoose");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

const logSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(LOG_TYPES), default: LOG_TYPES.INFO, index: true },
    action: { type: String, enum: Object.values(LOG_ACTIONS), default: LOG_ACTIONS.CREATE, index: true },
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userEmail: { type: String, default: null },
    ip: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

logSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Log", logSchema);
