//==============================================================//
//  REPOSITORY — User                                          //
//==============================================================//
const BaseRepository = require("./baseRepository");
const User = require("../models/User");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  // Password hash is select:false; opt in explicitly for auth checks.
  findByEmailWithHash(email) {
    return this.model.findOne({ email: String(email).toLowerCase().trim() }).select("+passwordHash");
  }

  findByEmail(email) {
    return this.model.findOne({ email: String(email).toLowerCase().trim() });
  }

  listAdmins() {
    return this.model.find().sort({ createdAt: 1 });
  }

  recentLogins(limit = 5) {
    return this.model.find({ lastLoginAt: { $ne: null } }).sort({ lastLoginAt: -1 }).limit(limit);
  }
}

module.exports = new UserRepository();
