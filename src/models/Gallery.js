'use strict';
const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', index: true },
    fileId: { type: String, required: true }, // Google Drive file id
    name: String,
    mime: String,
    size: Number,
    width: Number,
    height: Number,
    kind: { type: String, enum: ['image', 'video'], default: 'image' },
    url: String,
    thumbUrl: String,
    downloads: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Gallery', gallerySchema);
