const mongoose = require("mongoose");
const { DOCUMENT_TYPES } = require("../constants");

const documentSchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", index: true },
    driveId: { type: String, required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: DOCUMENT_TYPES, default: "pdf" },
    mimeType: { type: String },
    sizeBytes: { type: Number, default: 0 },
    size: { type: String }, // human-readable, for view parity ("2.4 MB")
    downloadable: { type: Boolean, default: true },
    downloads: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
