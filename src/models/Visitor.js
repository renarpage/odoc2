'use strict';
const mongoose = require('mongoose');

// One row per unique visitor-day (hashed IP) - powers visitor analytics without storing PII.
const visitorSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, index: true }, // YYYY-MM-DD
    ipHash: { type: String, required: true },
    path: { type: String },
    userAgent: { type: String },
    count: { type: Number, default: 1 },
  },
  { timestamps: true },
);

visitorSchema.index({ day: 1, ipHash: 1 }, { unique: true });

module.exports = mongoose.model('Visitor', visitorSchema);
