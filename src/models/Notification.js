'use strict';
const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, NOTIFICATION_SCOPE } = require('../constants/notificationTypes');

const notificationSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: NOTIFICATION_TYPES.all, default: NOTIFICATION_TYPES.INFO },
    scope: { type: String, enum: Object.values(NOTIFICATION_SCOPE), default: NOTIFICATION_SCOPE.ADMIN, index: true },
    title: { type: String, required: true },
    message: { type: String },
    meta: { type: Object, default: {} },
    read: { type: Boolean, default: false, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Notification', notificationSchema);
