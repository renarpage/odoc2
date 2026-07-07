const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", index: true },
    driveId: { type: String, required: true },
    url: { type: String, required: true }, // public/viewable link
    thumbnailUrl: { type: String },
    name: { type: String },
    mimeType: { type: String },
    sizeBytes: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);
