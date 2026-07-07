const BaseRepository = require("./baseRepository");
const RefreshToken = require("../models/RefreshToken");

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  findActiveByHash(tokenHash) {
    return this.model.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
  }

  revokeByHash(tokenHash, replacedByHash = null) {
    return this.model.findOneAndUpdate(
      { tokenHash },
      { $set: { revokedAt: new Date(), replacedByHash } },
      { new: true }
    );
  }

  revokeAllForUser(userId) {
    return this.model.updateMany(
      { user: userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
}

module.exports = new RefreshTokenRepository();
