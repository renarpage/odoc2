'use strict';
const mongoose = require('mongoose');

// Single document (singleton) holding SuperAdmin-controlled branding & site settings.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    primaryColor: { type: String, default: '#3155E7' },
    secondaryColor: { type: String, default: '#6C8BFF' },
    lightBg: { type: String, default: '#f5f5f5' },
    darkBg: { type: String, default: '#1a1a24' },
    tagline: { type: String, default: 'One Door, One Click - OSIS SMAVO' },
    heroTitle: { type: String, default: 'OSIS SMAVO Digital Archive' },
    heroImageUrl: { type: String, default: null },
    logoUrl: { type: String, default: null },
    footerText: { type: String, default: 'OSIS SMAVO' },
    socials: { type: Object, default: {} },
    contact: { type: Object, default: {} },
    announcement: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Setting', settingSchema);
