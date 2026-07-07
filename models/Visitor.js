const mongoose = require("mongoose");

/**
 * One document per (visitor hash + day) to power visitor analytics without
 * storing PII. IP+UA are hashed before storage.
 */
const visitorSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, index: true }, // YYYY-MM-DD
    visitorHash: { type: String, required: true, index: true },
    path: { type: String },
    hits: { type: Number, default: 1 },
  },
  { timestamps: true }
);

visitorSchema.index({ day: 1, visitorHash: 1 }, { unique: true });

module.exports = mongoose.model("Visitor", visitorSchema);
