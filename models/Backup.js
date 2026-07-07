const mongoose = require("mongoose");

const backupSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    driveId: { type: String },
    url: { type: String },
    sizeBytes: { type: Number, default: 0 },
    collections: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Backup", backupSchema);
