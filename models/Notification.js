const mongoose = require("mongoose");
const { LOG_TYPES } = require("../constants");

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(LOG_TYPES), default: LOG_TYPES.INFO },
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    // null recipient = broadcast to all admins
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
