'use strict';
const mongoose = require('mongoose');

// Audit trail: who did what, when.
const logSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    entity: { type: String },
    entityId: { type: String },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String },
    ipHash: { type: String },
    meta: { type: Object, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Log', logSchema);
