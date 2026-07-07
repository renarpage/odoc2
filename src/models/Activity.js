'use strict';
const mongoose = require('mongoose');
const { ACTIVITY_STATUS } = require('../constants/activityStatus');

const fileRef = new mongoose.Schema(
  { fileId: String, name: String, mime: String, size: Number, url: String, kind: String },
  { _id: false },
);

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String, trim: true },
    description: { type: String },
    startDate: { type: Date, index: true },
    endDate: { type: Date },
    location: { type: String },
    organizer: { type: String },
    division: { type: String, index: true },
    status: { type: String, enum: ACTIVITY_STATUS.all, default: ACTIVITY_STATUS.UPCOMING, index: true },
    category: { type: String, index: true },
    coverImage: fileRef,
    gallery: [fileRef],
    documents: [fileRef],
    tags: { type: [String], index: true },
    driveFolderId: { type: String }, // auto Drive folder per activity
    visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
    publishDate: { type: Date },
    isDraft: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    pinned: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Text index powers instant search across title/summary/tags.
activitySchema.index({ title: 'text', summary: 'text', tags: 'text' });

module.exports = mongoose.model('Activity', activitySchema);
