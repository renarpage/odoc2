const mongoose = require("mongoose");

const backupSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    driveId: { type: String, default: null },
    url: { type: String, default: null },
    bytes: { type: Number, default: 0 },
    collections: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Backup", backupSchema);
