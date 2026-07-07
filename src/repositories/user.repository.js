'use strict';
const BaseRepository = require('../core/BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() { super(User); }
  findByEmail(email) { return this.model.findOne({ email: String(email).toLowerCase() }).select('+password'); }
  listAdmins() { return this.model.find().sort('-createdAt').lean(); }
  recentLogins(limit = 5) { return this.model.find({ lastLoginAt: { $ne: null } }).sort('-lastLoginAt').limit(limit).lean(); }
}
module.exports = new UserRepository();
