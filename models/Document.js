const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", index: true, default: null },
    name: { type: String, required: true },
    driveId: { type: String, required: true },
    url: { type: String, required: true },
    mime: { type: String, default: "application/pdf" },
    type: { type: String, default: "pdf" },
    bytes: { type: Number, default: 0 },
    size: { type: String, default: "" },
    downloads: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
