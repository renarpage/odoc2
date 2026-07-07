'use strict';
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', index: true },
    fileId: { type: String, required: true },
    name: String,
    mime: String,
    size: Number,
    ext: String,
    url: String,
    downloadable: { type: Boolean, default: true },
    downloads: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Document', documentSchema);
