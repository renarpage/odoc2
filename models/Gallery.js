const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", index: true, default: null },
    driveId: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: null },
    mime: { type: String, default: "image/jpeg" },
    bytes: { type: Number, default: 0 },
    originalName: { type: String, default: "" },
    order: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);
